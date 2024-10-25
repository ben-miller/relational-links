import {ItemView, WorkspaceLeaf} from "obsidian";

export const rlSidebarViewId = "relational-links-sidebar-view";

export class RLSidebarView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
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
		return "star";  // Choose any icon from Obsidian's built-in icon set (e.g., 'star', 'tag', etc.)
	}

	// Render the view content
	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// Title for the sidebar view
		container.createEl("h1", { text: "Relational Links Explorer" });

		// Dummy data for search results
		const dummyResults = [
			{ title: "Accountant", path: "/path/to/accountant.md", tag: "#ProfessionalOccupation" },
			{ title: "Apothecary", path: "/path/to/apothecary.md", tag: "#ProfessionalOccupation", url: "https://www.wikiwand.com/en/articles/apothecary" },
			{ title: "Concept Artist", path: "/path/to/concept_artist.md", tag: "#ProfessionalOccupation" },
			{ title: "Graphic Designer", path: "/path/to/graphic_designer.md", tag: "#ProfessionalOccupation" },
			{ title: "IP Attorney", path: "/path/to/ip_attorney.md", tag: "#ProfessionalOccupation" },
		];

		// Main container to hold all search results
		const resultsContainer = container.createEl("div", { cls: "search-results-children" });

		dummyResults.forEach(result => {
			// Result item container
			const resultItem = resultsContainer.createEl("div", { cls: "tree-item search-result", attr: { draggable: "true" } });

			// Header/title with icon
			const itemSelf = resultItem.createEl("div", { cls: "tree-item-self search-result-file-title is-clickable" });
			const collapseIcon = itemSelf.createEl("div", { cls: "tree-item-icon collapse-icon" });
			collapseIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>`;

			// Title text
			itemSelf.createEl("div", { cls: "tree-item-inner", text: result.title });

			// Flair (e.g., result count or status indicator)
			const flairOuter = itemSelf.createEl("div", { cls: "tree-item-flair-outer" });
			flairOuter.createEl("span", { cls: "tree-item-flair", text: "1" });

			// Matches container
			const matchesContainer = resultItem.createEl("div", { cls: "search-result-file-matches" });

			// Dummy matched result snippet
			const matchSnippet = matchesContainer.createEl("div", { cls: "search-result-file-match tappable" });
			if (result.url) {
				matchSnippet.createEl("span", { text: result.url });
			}
			matchSnippet.createEl("span", { cls: "search-result-file-matched-text", text: result.tag });

			// Hover buttons for expanding/collapsing context
			const hoverButtonTop = matchSnippet.createEl("div", {
				cls: "search-result-hover-button mod-top",
				attr: { "aria-label": "Show more context", "data-tooltip-position": "top" },
			});
			hoverButtonTop.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"></path></svg>`;

			const hoverButtonBottom = matchSnippet.createEl("div", {
				cls: "search-result-hover-button mod-bottom",
				attr: { "aria-label": "Show more context" },
			});
			hoverButtonBottom.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"></path></svg>`;
		});
	}

	async onClose() {
		// Optional cleanup when the view is closed
	}
}
