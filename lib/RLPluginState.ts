import {WorkspaceLeaf} from "obsidian";
import {RelationalLink} from "./VaultScanner";

export class RLPluginState {
	constructor(
		public searchTag: string = "",
		public currentActiveLeaf: WorkspaceLeaf | null = null,
		public links: Set<RelationalLink> = new Set()
	) {}
}
