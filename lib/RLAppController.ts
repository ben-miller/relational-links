import RelationalLinksPlugin from "../main";
import {TAbstractFile, TFile, WorkspaceLeaf} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {LinkIndex} from "./LinkIndex";

export class RLAppController {
	private listenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState
	) {}

	static async load(plugin: RelationalLinksPlugin, linkIndex: LinkIndex) {
		const rlAppController = new RLAppController(plugin, plugin.state);
		await rlAppController.init(linkIndex);
	}

	async init(linkIndex: LinkIndex) {
		this.plugin.registerEvent(this.plugin.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await linkIndex.loadTagsInFile(file);
			}
		}));

		this.plugin.registerEvent(this.plugin.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', (leaf) => {
				this.handleActiveLeafChange(leaf);
			})
		);
		await this.handleActiveLeafChange(this.plugin.app.workspace.getLeaf());
	}

	public async attachTagListeners(container: HTMLElement) {
		container.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
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

	async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		// If there's a previously active leaf, detach its listeners
		if (this.plugin.state.currentActiveLeaf) {
			this.detachTagListeners(this.plugin.state.currentActiveLeaf.view.containerEl);
		}

		// Set the new active leaf
		this.plugin.state.currentActiveLeaf = leaf;

		// Attach listeners to the new active leaf if it exists
		if (leaf) {
			await this.attachTagListeners(leaf.view.containerEl);
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
