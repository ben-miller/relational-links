import {Plugin} from "obsidian";
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

	async onload() {
		console.log('Loading plugin...');
		this.loadSuggestors();
		await this.loadAllTags();
		await this.initParserEvents();
		console.log('Plugin loaded.');
	}

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

	async loadAllTags() {
		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			const content = await this.app.vault.read(file);
			const tokens = md.parse(content, {});
			getAllTokens(tokens)
				.filter((token) => token.type === 'relational_link')
				.forEach((token) => {
					this.relationalTags.add(token.children![0].content);
				});
		}
	}

	async initParserEvents() {
		this.registerEvent(this.app.vault.on("create", (file) => {
			console.log(`File created: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("modify", (file) => {
			console.log(`File modified: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("delete", (file) => {
			console.log(`File deleted: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadSuggestors();
	}
}
