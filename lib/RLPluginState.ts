import {WorkspaceLeaf} from "obsidian";
import {LinkIndex} from "./LinkIndex";

export class RLPluginState {
	constructor(
		public searchTag: string = "",
		public currentActiveLeaf: WorkspaceLeaf | null = null,
		public linkIndex: LinkIndex | null = null,
	) {}
}
