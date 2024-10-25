import {ItemView, WorkspaceLeaf} from "obsidian";

export const relationalLinksSidebarView = "relational-links-sidebar-view";

export class RLSidebarView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	// Unique identifier for the view type
	getViewType() {
		return relationalLinksSidebarView;
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
		container.createEl("h1", { text: "Relational Links Explorer" });
	}

	async onClose() {
		// Optional cleanup when the view is closed
	}
}
