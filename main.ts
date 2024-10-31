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
	public state: RLPluginState = new RLPluginState();
	private rlEditorController: RLEditorController = new RLEditorController(this, this.state);
	private vaultScanner: VaultScanner | null = null;

	loadEditorSuggests() {
		this.relationalTagSuggest = new RelationalTagSuggest(this.app, this.state);
		this.registerEditorSuggest(this.relationalTagSuggest);
		this.relationalLinkSuggest = new RelationalLinkSuggest(this.app, this);
		this.registerEditorSuggest(this.relationalLinkSuggest);
	}

	unloadEditorSuggests() {
		this.relationalTagSuggest = null;
		this.relationalLinkSuggest = null;
	}

	async initMarkdownPostProcessor() {
		const markdownPostProcessor = this.rlEditorController.rlMarkdownPostProcessor(this.app.vault);
		this.registerMarkdownPostProcessor(markdownPostProcessor);
	}

	public async openTagExplorerView(tag = "") {
		this.state.searchTag = tag;

		const existingLeaf = this.app.workspace.getLeavesOfType(rlSidebarViewId)[0];

		if (!existingLeaf) {
			const leftLeaf = this.app.workspace.getLeftLeaf(false);
			if (leftLeaf) {
				await leftLeaf.setViewState({ type: rlSidebarViewId });
			}
		} else {
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
		await this.vaultScanner.scanVault();
		await this.rlEditorController.initParserEvents(this.vaultScanner);
		await this.initMarkdownPostProcessor();
		await RLTagExplorerView.load(this, this.vaultScanner);
		await this.initLeafChangeEvents();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		this.unloadEditorSuggests();
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
