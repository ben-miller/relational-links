import RelationalLinksPlugin from "../main";
import {WorkspaceLeaf} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {RLTagExplorerView} from "./RLTagExplorerView";

export class RLAppController {
	private tagElementListenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState,
		private explorerView: RLTagExplorerView,
	) {}

	static async load(plugin: RelationalLinksPlugin, explorerView: RLTagExplorerView) {
		const rlAppController = new RLAppController(plugin, plugin.state, explorerView);
		plugin.registerEvent(
			plugin.app.workspace.on('active-leaf-change', async (leaf) => {
				await rlAppController.handleActiveLeafChange(leaf);
			})
		);
		await rlAppController.handleActiveLeafChange(plugin.app.workspace.getLeaf());
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

	private attachTagListeners(container: HTMLElement) {
		container.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
			const listener = async (event: Event) => {
				const tag = (event.currentTarget as HTMLElement).getAttribute("href")?.substring(1);
				if (tag) {
					this.pluginState.searchTag = tag;
					await this.explorerView.openTagExplorerView(tag);
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
