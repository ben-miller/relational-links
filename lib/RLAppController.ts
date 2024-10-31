import RelationalLinksPlugin from "../main";
import {WorkspaceLeaf} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {rlSidebarViewId} from "./RLTagExplorerView";

export class RLAppController {
	private tagElementListenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState
	) {}

	static async load(plugin: RelationalLinksPlugin): Promise<RLAppController> {
		const rlAppController = new RLAppController(plugin, plugin.state);
		plugin.registerEvent(
			plugin.app.workspace.on('active-leaf-change', async (leaf) => {
				await rlAppController.handleActiveLeafChange(leaf);
			})
		);
		await rlAppController.handleActiveLeafChange(plugin.app.workspace.getLeaf());
		return Promise.resolve(rlAppController);
	}

	async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		if (this.plugin.state.currentActiveLeaf) {
			this.detachTagListeners(this.plugin.state.currentActiveLeaf.view.containerEl);
		}
		this.plugin.state.currentActiveLeaf = leaf;
		if (leaf) {
			this.attachTagListeners(leaf.view.containerEl);
		}
	}

	public async openTagExplorerView(tag = "") {
		this.plugin.state.searchTag = tag;

		const existingLeaf = this.plugin.app.workspace.getLeavesOfType(rlSidebarViewId)[0];

		if (!existingLeaf) {
			const leftLeaf = this.plugin.app.workspace.getLeftLeaf(false);
			if (leftLeaf) {
				await leftLeaf.setViewState({ type: rlSidebarViewId });
			}
		} else {
			await this.plugin.app.workspace.revealLeaf(existingLeaf);
		}
	}

	private attachTagListeners(container: HTMLElement) {
		container.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
			const listener = async (event: Event) => {
				const tag = (event.currentTarget as HTMLElement).getAttribute("href")?.substring(1);
				if (tag) {
					this.pluginState.searchTag = tag;
					await this.openTagExplorerView(tag);
				} else {
					throw Error('Unknown tag');
				}
			};

			element.addEventListener("click", listener);
			this.tagElementListenerMap.set(element, listener);
		});
	}

	public detachTagListeners(container: HTMLElement) {
		container.querySelectorAll(".relational-links-tag").forEach((element: HTMLElement) => {
			const listener = this.tagElementListenerMap.get(element);
			if (listener) {
				element.removeEventListener("click", listener);
				this.tagElementListenerMap.delete(element);
			}
		});
	}
}
