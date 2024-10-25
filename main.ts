import {MarkdownPostProcessorContext, Plugin, TAbstractFile, TFile} from "obsidian";
import MarkdownIt from "markdown-it";
import {getAllTokens, relationalLinksMarkdownPlugin} from "./lib/relationalLinksMarkdownPlugin";
import {RelationalTagSuggestor} from "./lib/relationalTagSuggestor";
import {RelationalLinkSuggestor} from "./lib/relationalLinkSuggestor";

const md = MarkdownIt()
md.use(relationalLinksMarkdownPlugin)

export default class RelationalLinksPlugin extends Plugin {
	public relationalTagSuggestor: RelationalTagSuggestor | null = null;
	public relationalLinkSuggestor: RelationalLinkSuggestor | null = null;
	public relationalTags: Set<string> = new Set();

	loadSuggestors() {
		this.relationalTagSuggestor = new RelationalTagSuggestor(this.app, this);
		this.registerEditorSuggest(this.relationalTagSuggestor);
		this.relationalLinkSuggestor = new RelationalLinkSuggestor(this.app, this);
		this.registerEditorSuggest(this.relationalLinkSuggestor);
	}

	unloadSuggestors() {
		if (this.relationalTagSuggestor) {
			this.relationalTagSuggestor = null;
		}
		if (this.relationalLinkSuggestor) {
			this.relationalLinkSuggestor = null;
		}
	}

	async loadTagsInFile(file: TFile) {
		const content = await this.app.vault.read(file);
		const tokens = md.parse(content, {});
		await getAllTokens(tokens).then((tokens) => tokens
			.filter((token) => token.type === 'relational_link')
			.forEach((token) => {
				const tag = token.children![0].content;
				this.relationalTags.add(tag);
			})
		)
	}

	async loadAllTags() {
		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.loadTagsInFile(file);
		}
	}

	async initParserEvents() {
		this.registerEvent(this.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await this.loadTagsInFile(file);
			}
		}));

		this.registerEvent(this.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));
	}

	async initMarkdownPostProcessor() {
		this.registerMarkdownPostProcessor((element: HTMLElement, context: MarkdownPostProcessorContext) => {
			element.querySelectorAll("p").forEach((p) => {
				p.innerHTML = p.innerHTML.replace(/#\[([a-zA-Z0-9._:-]+)\[(.*?)\]\]/g, (match, tag, linkPath) => {
					const file = this.app.vault.getAbstractFileByPath(linkPath);
					const tagLink = `<a href="#${tag}" class="tag" target="_blank" rel="noopener nofollow">${tag}</a>`;
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
		});
	}

	async onload() {
		console.log('Loading plugin...');
		this.loadSuggestors();
		await this.loadAllTags();
		await this.initParserEvents();
		await this.initMarkdownPostProcessor();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadSuggestors();
	}
}
