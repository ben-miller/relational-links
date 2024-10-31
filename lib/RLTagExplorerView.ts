import {ItemView, WorkspaceLeaf} from "obsidian";
import {LinkIndex} from "./LinkIndex";
import RelationalLinksPlugin from "../main";

export const rlSidebarViewId = "relational-links-sidebar-view";

export class RLTagExplorerView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private plugin: RelationalLinksPlugin,
		private linkIndex: LinkIndex
	) {
		super(leaf);
	}

	static async load(plugin: RelationalLinksPlugin, linkIndex: LinkIndex): Promise<RLTagExplorerView> {
		// Register the sidebar view when the plugin loads
		plugin.registerView(
			rlSidebarViewId,
			(leaf) => new RLTagExplorerView(leaf, plugin, linkIndex)
		);

		// Add a ribbon icon to toggle the view
		plugin.addRibbonIcon("star", "Relational Links Explorer", () => {
			console.log("Ribbon clicked")
		});

		const leaf = plugin.app.workspace.getLeftLeaf(false)!;
		await leaf.setViewState({ type: rlSidebarViewId });
		const view = leaf.view as RLTagExplorerView;
		await view.openTagExplorerView();

		return Promise.resolve(view);
	}

	public async openTagExplorerView(tag = "") {
		this.plugin.state.searchTag = tag;

		const existingLeaf = this.plugin.app.workspace.getLeavesOfType(rlSidebarViewId)[0];

		if (!existingLeaf) {
			const leftLeaf = this.plugin.app.workspace.getLeftLeaf(false);
			if (leftLeaf) {
				await leftLeaf.setViewState({ type: rlSidebarViewId });
			}
		} else {
			await this.plugin.app.workspace.revealLeaf(existingLeaf);
		}

		await this.renderContent();
	}

	// Unique identifier for the view type
	getViewType() {
		return rlSidebarViewId;
	}

	// Display name for the view in the Left Sidebar
	getDisplayText() {
		return "Relational Links Explorer";
	}

	// Icon for the Left Sidebar view
	getIcon() {
		return "star";
	}

	async onOpen() {
		this.registerEvent(this.app.workspace.on('active-leaf-change', async (leaf) => {
			if (leaf === this.leaf) {
				console.log("Active leaf changed to explorer view");
				await this.renderContent();
			}
		}));
		await this.renderContent();
	}

	// Render the view content
	private async renderContent() {
		console.log("Rendering tax explorer with search tag:", this.plugin.state.searchTag);

		const container = this.containerEl.children[1];
		container.empty();

		// Title for the sidebar view
		container.createEl("h1", { text: "Relational Links Explorer" });

		// Dummy data for search results
		// Main container to hold all search results
		const resultsContainer = container.createEl("div", { cls: "search-results-children" });

		const searchResults = await this.linkIndex.searchTag(this.plugin.state.searchTag);
		searchResults.forEach(result => {
			const resultItem = resultsContainer.createEl("div", { cls: "tree-item search-result", attr: { draggable: "true" } });
			const itemSelf = resultItem.createEl("div", { cls: "tree-item-self search-result-file-title is-clickable" });
			itemSelf.createEl("div", { cls: "tree-item-inner", text: result.fromTitle });

			const matchesContainer = resultItem.createEl("div", { cls: "search-result-file-matches" });
			const matchSnippet = matchesContainer.createEl("div", { cls: "search-result-file-match tappable" });

			// Split the context line based on lineLocation
			const beforeMatch = result.contextLine.slice(0, result.lineLocation.start);
			const matchText = result.contextLine.slice(result.lineLocation.start, result.lineLocation.end);
			const afterMatch = result.contextLine.slice(result.lineLocation.end + 1);

			// Create span for text before the matched text
			if (beforeMatch) {
				matchSnippet.createEl("span", { text: beforeMatch });
			}

			// Create span for the matched text with specific class
			matchSnippet.createEl("span", { cls: "search-result-file-matched-text", text: matchText });

			// Create span for text after the matched text
			if (afterMatch) {
				matchSnippet.createEl("span", { text: afterMatch });
			}
		});
	}

	async onClose() {
		// Optional cleanup when the view is closed
	}
}
