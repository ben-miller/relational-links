import RelationalLinksPlugin from "../main";
import {MarkdownPostProcessorContext, TAbstractFile, TFile, Vault} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {VaultScanner} from "./VaultScanner";

export class RLEditorController {
	private listenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();

	constructor(
		private plugin: RelationalLinksPlugin,
		private pluginState: RLPluginState
	) {}

	async initParserEvents(vaultScanner: VaultScanner) {
		this.plugin.registerEvent(this.plugin.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await vaultScanner.loadTagsInFile(file);
			}
		}));

		this.plugin.registerEvent(this.plugin.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));
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

	public rlMarkdownPostProcessor(vault: Vault): (element: HTMLElement, context: MarkdownPostProcessorContext) => void {
		return (element: HTMLElement, context: MarkdownPostProcessorContext) => {
			element.querySelectorAll("p").forEach((p) => {
				p.innerHTML = p.innerHTML.replace(/#\[([a-zA-Z0-9._:-]+)\[(.*?)\]\]/g, (match, tag, linkPath) => {
					const file = vault.getAbstractFileByPath(linkPath);
					const tagLink = `<a href="#${tag}" class="relational-links-tag" target="_blank" rel="noopener nofollow">${tag}</a>`;
					let pathLink = "";
					if (file && file instanceof TFile) {
						const basename = file.basename;
						pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link">${basename}</a>`;
					} else {
						const basename = linkPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || linkPath;
						pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link is-unresolved">${basename}</a>`;
					}
					return `#[${tagLink}[${pathLink}]]`;
				});
			});
		}
	}

}
