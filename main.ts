import {Plugin, TAbstractFile, TFile, WorkspaceLeaf} from "obsidian";
import MarkdownIt from "markdown-it";
import {getAllTokens, rlMarkdownPlugin} from "./lib/rlMarkdownPlugin";
import {RelationalTagSuggestor} from "./lib/relationalTagSuggestor";
import {RelationalLinkSuggestor} from "./lib/relationalLinkSuggestor";
import {rlMarkdownPostProcessor} from "./lib/rlMarkdownPostProcessor";
import {rlSidebarViewId, RLSidebarView} from "./lib/RLSidebarView";
import {RLTags} from "./lib/RLTags";
import {RLPluginState} from "./lib/RLPluginState";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

export default class RelationalLinksPlugin extends Plugin {
	public relationalTagSuggestor: RelationalTagSuggestor | null = null;
	public relationalLinkSuggestor: RelationalLinkSuggestor | null = null;
	public relationalTags: Set<string> = new Set();
	private currentActiveLeaf: WorkspaceLeaf | null = null;
	private rlTags: RLTags = new RLTags(this);
	private state: RLPluginState = new RLPluginState();

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
			(leaf) => new RLSidebarView(leaf, this.state)
		);

		// Add a ribbon icon to toggle the view
		this.addRibbonIcon("star", "Relational Links Explorer", () => {
			console.log("clicked")
		});
	}

	public async openLeftSidebarView(tag = "") {
		console.log("opening sidebar view with tag:", tag);
		this.state.searchTag = tag;

		// Check if the sidebar view is already open
		const existingLeaf = this.app.workspace.getLeavesOfType(rlSidebarViewId)[0];

		if (!existingLeaf) {
			// Sidebar view is not open, so open it
			const leftLeaf = this.app.workspace.getLeftLeaf(false);
			if (leftLeaf) {
				await leftLeaf.setViewState({ type: rlSidebarViewId });
			}
		} else {
			// If the sidebar is already open, you could bring it into focus
			await this.app.workspace.revealLeaf(existingLeaf);
		}
	}

	async attachListeners(leaf: WorkspaceLeaf) {
		await this.rlTags.attachTagListeners(leaf.view.containerEl);
	}

	detachListeners(leaf: WorkspaceLeaf) {
		this.rlTags.detachTagListeners(leaf.view.containerEl);
	}

	async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		// If there's a previously active leaf, detach its listeners
		if (this.currentActiveLeaf) {
			this.detachListeners(this.currentActiveLeaf);
		}

		// Set the new active leaf
		this.currentActiveLeaf = leaf;

		// Attach listeners to the new active leaf if it exists
		if (leaf) {
			await this.attachListeners(leaf);
		}
	}

	async initLeafChangeEvents() {
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.handleActiveLeafChange(leaf);
			})
		);
		await this.handleActiveLeafChange(this.app.workspace.getLeaf());
	}

	async onload() {
		console.log('Loading plugin...');
		this.loadSuggestors();
		await this.loadAllTags();
		await this.initParserEvents();
		await this.initMarkdownPostProcessor();
		await this.initLeftSidebarView();
		await this.openLeftSidebarView();
		await this.initLeafChangeEvents();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadSuggestors();
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
