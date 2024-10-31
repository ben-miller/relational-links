import {WorkspaceLeaf} from "obsidian";
import {RelationalLink} from "./LinkIndex";

export class RLPluginState {
	constructor(
		public searchTag: string = "",
		public currentActiveLeaf: WorkspaceLeaf | null = null,
		public links: Set<RelationalLink> = new Set()
	) {}
}
