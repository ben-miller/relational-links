import {Plugin, TAbstractFile, TFile} from "obsidian";
import MarkdownIt from "markdown-it";
import {getAllTokens, rlMarkdownPlugin} from "./lib/rlMarkdownPlugin";
import {RelationalTagSuggestor} from "./lib/relationalTagSuggestor";
import {RelationalLinkSuggestor} from "./lib/relationalLinkSuggestor";
import {rlMarkdownPostProcessor} from "./lib/rlMarkdownPostProcessor";
import {rlSidebarViewId, RLSidebarView} from "./lib/RLSidebarView";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

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
		this.registerMarkdownPostProcessor(rlMarkdownPostProcessor);
	}

	async initLeftSidebarView() {
		// Register the sidebar view when the plugin loads
		this.registerView(
			rlSidebarViewId,
			(leaf) => new RLSidebarView(leaf)
		);

		// Add a ribbon icon to toggle the view
		this.addRibbonIcon("star", "Relational Links Explorer", () => {
			console.log("clicked")
		});

		this.app.workspace.detachLeavesOfType(rlSidebarViewId);

		const leftLeaf = this.app.workspace.getLeftLeaf(false);
		if (leftLeaf) {
			await leftLeaf.setViewState({
				type: rlSidebarViewId,
			});
		}
	}

	async onload() {
		console.log('Loading plugin...');
		this.loadSuggestors();
		await this.loadAllTags();
		await this.initParserEvents();
		await this.initMarkdownPostProcessor();
		await this.initLeftSidebarView();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadSuggestors();
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
