import {TAbstractFile, TFile, Vault} from "obsidian";
import {getAllTokens, rlMarkdownPlugin} from "./markdown-it/rlMarkdownPlugin";
import MarkdownIt from "markdown-it";
import RelationalLinksPlugin from "../main";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

export interface RelationalLink {
	tag: string;
	fromTitle: string;
	fromFile: string;
	toFile: string;
	contextLine: string;
	lineLocation: { start: number; end: number }
}

export class LinkIndex {
	// Keep association between file and its relational links.
	private filesToLinks: WeakMap<TFile, RelationalLink[]> = new WeakMap();

	// Map from tag to files it shows up in, for search-by-tag.
	private tagsToLinks: Map<string, Set<RelationalLink>> = new Map();

	// Keep count of total instances of each tag, for autocomplete.
	private tagCounts: Map<string, number> = new Map();

	constructor(
		private vault: Vault,
	) {}

	public tags(): string[] { return Array.from(this.tagCounts.keys()) }

	private updateTagCount(link: string, diff: number): number {
		const curr = this.tagCounts.get(link) ?? 0;
		const next = curr + diff;
		if (next == 0) {
			this.tagCounts.delete(link);
		} else {
			this.tagCounts.set(link, next);
		}
		return next;
	}

	private updateLinkMap(tag: string, link: RelationalLink, add: boolean) {
		let links: Set<RelationalLink> | undefined = this.tagsToLinks.get(tag);
		if (!links) {
			links = new Set();
		}
		if (add) {
			links.add(link);
		} else {
			links.delete(link);
		}
		this.tagsToLinks.set(tag, links);
	}

	static async load(plugin: RelationalLinksPlugin): Promise<LinkIndex> {
		plugin.linkIndex = new LinkIndex(plugin.app.vault);
		await plugin.linkIndex.scanVault();

		plugin.registerEvent(plugin.app.vault.on("modify", async (file: TAbstractFile) => {
			if (file instanceof TFile) {
				await plugin.linkIndex!.loadTagsInFile(file);
			}
		}));

		plugin.registerEvent(plugin.app.vault.on("rename", async (file: TAbstractFile, oldPath) => {
			// TODO Update relational links pointing to this file.
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));

		return Promise.resolve(plugin.linkIndex);
	}

	public async loadTagsInFile(file: TFile) {
		const content = await this.vault.read(file);
		const tokens = md.parse(content, {});

		// Remove current file-tag associations
		const currentLinks = this.filesToLinks.get(file) ?? [];
		for (const link of currentLinks) {
			this.updateLinkMap(link.tag, link, false);
			this.updateTagCount(link.tag, -1);
		}

		const links: RelationalLink[] = [];
		await getAllTokens(tokens).then((tokens) => tokens
			.filter((token) => token.type === 'relational_link')
			.forEach((token) => {
				const tag = token.children![0].content;
				const toFileStr = token.children![1].content;
				const toFile = this.vault.getFileByPath(toFileStr);

				// File's path if file exists, otherwise original field value
				const toFileOrOrig = toFile ? toFile.path : toFileStr;

				const linkString = `#[${tag}[${toFileOrOrig}]]`;
				const link: RelationalLink = {
					tag: tag,
					fromTitle: file.basename,
					fromFile: file.basename,
					toFile: toFileOrOrig,
					contextLine: linkString,
					lineLocation: { start: 0, end: linkString.length }
				}
				links.push(link);

				// Add back file-tag associations
				this.updateLinkMap(tag, link, true);
				this.updateTagCount(link.tag, 1);
			})
		)
		this.filesToLinks.set(file, links);
	}

	async scanVault() {
		console.log("LinkIndex: Scanning vault...");
		const markdownFiles = this.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.loadTagsInFile(file);
		}
		console.log("LinkIndex: Scanning vault finished.");
	}

	public async searchTag(tag: string): Promise<RelationalLink[]> {
		const results: RelationalLink[] = Array.from(this.tagsToLinks.get(tag) ?? new Set());
		return Promise.resolve(results);
	}
}
