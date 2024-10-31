import {ItemView, WorkspaceLeaf} from "obsidian";
import {RLPluginState} from "./RLPluginState";
import {VaultScanner} from "./VaultScanner";

export const rlSidebarViewId = "relational-links-sidebar-view";

export class RLTagExplorerView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private state: RLPluginState,
		private vaultScanner: VaultScanner
	) {
		super(leaf);
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
		console.log("Rendering tax explorer with search tag:", this.state.searchTag);

		const container = this.containerEl.children[1];
		container.empty();

		// Title for the sidebar view
		container.createEl("h1", { text: "Relational Links Explorer" });

		// Dummy data for search results
		// Main container to hold all search results
		const resultsContainer = container.createEl("div", { cls: "search-results-children" });

		const searchResults = await this.vaultScanner.searchTag(this.state.searchTag);
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
