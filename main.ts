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
	public linkIndex: LinkIndex | null = null;
	public state: RLPluginState = new RLPluginState();

	async onload() {
		console.log('Loading plugin...');
		loadRlMarkdownPlugin(this);
		const linkIndex = await LinkIndex.load(this);
		RelationalTagSuggest.load(this, linkIndex);
		RelationalLinkSuggest.load(this);
		const explorerView = await RLTagExplorerView.load(this, this.linkIndex!);
		await RLAppController.load(this, explorerView);
		console.log('Plugin loaded.');
	}

	async onunload() {
		console.log('Unloading plugin...');
		RelationalTagSuggest.unload(this);
		RelationalLinkSuggest.unload(this);
		this.app.workspace.detachLeavesOfType(rlSidebarViewId);
	}
}
