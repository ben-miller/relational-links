import {WorkspaceLeaf} from "obsidian";

export class RLPluginState {
	constructor(
		public searchTag: string = "",
		public currentActiveLeaf: WorkspaceLeaf | null = null,
		public relationalTags: Set<string> = new Set()
	) {}
}
