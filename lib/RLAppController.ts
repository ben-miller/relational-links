import RelationalLinksPlugin from "../main";
import {TAbstractFile, TFile} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {VaultScanner} from "./VaultScanner";

export class RLAppController {
	private listenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState
	) {}

	static async load(plugin: RelationalLinksPlugin, vaultScanner: VaultScanner) {
		plugin.rlAppController = new RLAppController(plugin, plugin.state);
		await plugin.rlAppController.init(vaultScanner);
	}

	async init(vaultScanner: VaultScanner) {
		this.plugin.registerEvent(this.plugin.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await vaultScanner.loadTagsInFile(file);
			}
		}));

		this.plugin.registerEvent(this.plugin.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));

		this.plugin.registerEvent(
			this.plugin.app.workspace.on('active-leaf-change', (leaf) => {
				this.plugin.handleActiveLeafChange(leaf);
			})
		);
		await this.plugin.handleActiveLeafChange(this.plugin.app.workspace.getLeaf());
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
