import {Plugin, TAbstractFile, TFile, WorkspaceLeaf} from "obsidian";
import {RelationalTagSuggest} from "./lib/suggest/RelationalTagSuggest";
import {RelationalLinkSuggest} from "./lib/suggest/RelationalLinkSuggest";
import {rlSidebarViewId, RLTagExplorerView} from "./lib/RLTagExplorerView";
import {RLEditorController} from "./lib/RLEditorController";
import {RLPluginState} from "./lib/RLPluginState";
import {VaultScanner} from "./lib/VaultScanner";

export default class RelationalLinksPlugin extends Plugin {
	public relationalTagSuggest: RelationalTagSuggest | null = null;
	public relationalLinkSuggest: RelationalLinkSuggest | null = null;
	private state: RLPluginState = new RLPluginState();
	private rlEditorController: RLEditorController = new RLEditorController(this);
	private vaultScanner: VaultScanner | null = null;

	loadEditorSuggests() {
		this.relationalTagSuggest = new RelationalTagSuggest(this.app, this.state);
		this.registerEditorSuggest(this.relationalTagSuggest);
		this.relationalLinkSuggest = new RelationalLinkSuggest(this.app, this);
		this.registerEditorSuggest(this.relationalLinkSuggest);
	}

	unloadEditorSuggests() {
		if (this.relationalTagSuggest) {
			this.relationalTagSuggest = null;
		}
		if (this.relationalLinkSuggest) {
			this.relationalLinkSuggest = null;
		}
	}

	async initParserEvents(vaultScanner: VaultScanner) {
		this.registerEvent(this.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await vaultScanner.loadTagsInFile(file);
			}
		}));

		this.registerEvent(this.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));
	}

	async initMarkdownPostProcessor() {
		const markdownPostProcessor = this.rlEditorController.rlMarkdownPostProcessor(this.app.vault);
		this.registerMarkdownPostProcessor(markdownPostProcessor);
	}

	async initLeftSidebarView(vaultScanner: VaultScanner) {
		// Register the sidebar view when the plugin loads
		this.registerView(
			rlSidebarViewId,
			(leaf) => new RLTagExplorerView(leaf, this.state, vaultScanner)
		);

		// Add a ribbon icon to toggle the view
		this.addRibbonIcon("star", "Relational Links Explorer", () => {
			console.log("clicked")
		});

		await this.openLeftSidebarView();
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
		await this.rlEditorController.attachTagListeners(leaf.view.containerEl);
	}

	detachListeners(leaf: WorkspaceLeaf) {
		this.rlEditorController.detachTagListeners(leaf.view.containerEl);
	}

	async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
		// If there's a previously active leaf, detach its listeners
		if (this.state.currentActiveLeaf) {
			this.detachListeners(this.state.currentActiveLeaf);
		}

		// Set the new active leaf
		this.state.currentActiveLeaf = leaf;

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
		this.loadEditorSuggests();
		this.vaultScanner = new VaultScanner(this.app.vault, this.state);
		await this.vaultScanner.loadAllTags();
		await this.initParserEvents(this.vaultScanner);
		await this.initMarkdownPostProcessor();
		await this.initLeftSidebarView(this.vaultScanner);
		await this.initLeafChangeEvents();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadEditorSuggests();
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
