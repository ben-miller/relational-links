import RelationalLinksPlugin from "../main";
import {WorkspaceLeaf} from "obsidian";
import {RLPluginState} from "./RLPluginState";

export class RLAppController {
	private listenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState
	) {}

	static async load(plugin: RelationalLinksPlugin) {
		const rlAppController = new RLAppController(plugin, plugin.state);
		await rlAppController.init();
	}

	async init() {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', async (leaf) => {
				await this.handleActiveLeafChange(leaf);
			})
		);
		await this.handleActiveLeafChange(this.plugin.app.workspace.getLeaf());
	}

	async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		// If there's a previously active leaf, detach its listeners
		if (this.plugin.state.currentActiveLeaf) {
			this.detachTagListeners(this.plugin.state.currentActiveLeaf.view.containerEl);
		}

		// Set the new active leaf
		this.plugin.state.currentActiveLeaf = leaf;

		// Attach listeners to the new active leaf if it exists
		if (leaf) {
			leaf.view.containerEl.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
				const listener = (event: Event) => {
					const tag = (event.currentTarget as HTMLElement).getAttribute("href")?.substring(1);
					if (tag) {
						this.pluginState.searchTag = tag;
						this.plugin.openTagExplorerView(tag);
					} else {
						throw Error('Unknown tag');
					}
				};

				element.addEventListener("click", listener);
				this.listenerMap.set(element, listener);
			});
		}
	}

	public detachTagListeners(container: HTMLElement) {
		container.querySelectorAll(".relational-links-tag").forEach((element: HTMLElement) => {
			const listener = this.listenerMap.get(element);
			if (listener) {
				element.removeEventListener("click", listener);
				this.listenerMap.delete(element);
			}
		});
	}
}
