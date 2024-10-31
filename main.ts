import {Plugin, WorkspaceLeaf} from "obsidian";
import {RelationalTagSuggest} from "./lib/suggest/RelationalTagSuggest";
import {RelationalLinkSuggest} from "./lib/suggest/RelationalLinkSuggest";
import {rlSidebarViewId, RLTagExplorerView} from "./lib/RLTagExplorerView";
import {RLAppController} from "./lib/RLAppController";
import {RLPluginState} from "./lib/RLPluginState";
import {VaultScanner} from "./lib/VaultScanner";
import {loadRlMarkdownPlugin} from "./lib/markdown-it/rlMarkdownPlugin";

export default class RelationalLinksPlugin extends Plugin {
	public relationalTagSuggest: RelationalTagSuggest | null = null;
	public relationalLinkSuggest: RelationalLinkSuggest | null = null;
	public state: RLPluginState = new RLPluginState();
	public rlAppController: RLAppController;
	public vaultScanner: VaultScanner;

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
		await this.rlAppController.attachTagListeners(leaf.view.containerEl);
	}

	detachListeners(leaf: WorkspaceLeaf) {
		this.rlAppController.detachTagListeners(leaf.view.containerEl);
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
		RelationalTagSuggest.load(this);
		RelationalLinkSuggest.load(this);
		await VaultScanner.load(this);
		await RLAppController.load(this, this.vaultScanner);
		loadRlMarkdownPlugin(this);
		await RLTagExplorerView.load(this, this.vaultScanner);
		await this.initLeafChangeEvents();
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		RelationalTagSuggest.unload(this);
		RelationalLinkSuggest.unload(this);
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
