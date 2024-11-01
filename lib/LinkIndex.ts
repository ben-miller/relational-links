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
	private linkSet: Set<RelationalLink> = new Set();

	constructor(
		private vault: Vault,
	) {}

	public links(): RelationalLink[] { return Array.from(this.linkSet) }

	static async load(plugin: RelationalLinksPlugin) {
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
	}

	public async loadTagsInFile(file: TFile) {
		const content = await this.vault.read(file);
		const tokens = md.parse(content, {});
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
					fromFile: file.path,
					toFile: toFileOrOrig,
					contextLine: linkString,
					lineLocation: { start: 0, end: linkString.length }
				}
				this.linkSet.add(link);
			})
		)
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
		const results = this.links().filter(link => link.tag === tag);
		return Promise.resolve(results);
	}
}
