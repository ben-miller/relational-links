import {Plugin} from "obsidian";
import {RelationalTagSuggest} from "./lib/suggest/RelationalTagSuggest";
import {RelationalLinkSuggest} from "./lib/suggest/RelationalLinkSuggest";
import {rlSidebarViewId, RLTagExplorerView} from "./lib/RLTagExplorerView";
import {RLAppController} from "./lib/RLAppController";
import {RLPluginState} from "./lib/RLPluginState";
import {LinkIndex} from "./lib/LinkIndex";
import {loadRlMarkdownPlugin} from "./lib/markdown-it/rlMarkdownPlugin";

export default class RelationalLinksPlugin extends Plugin {
	public relationalTagSuggest: RelationalTagSuggest | null = null;
	public relationalLinkSuggest: RelationalLinkSuggest | null = null;
	public state: RLPluginState = new RLPluginState();
	public linkIndex: LinkIndex;

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

	async onload() {
		console.log('Loading plugin...');
		loadRlMarkdownPlugin(this);
		RelationalTagSuggest.load(this);
		RelationalLinkSuggest.load(this);
		await LinkIndex.load(this);
		await RLAppController.load(this, this.linkIndex);
		await RLTagExplorerView.load(this, this.linkIndex);
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		RelationalTagSuggest.unload(this);
		RelationalLinkSuggest.unload(this);
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
