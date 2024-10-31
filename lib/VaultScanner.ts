import {TFile, Vault} from "obsidian";
import {getAllTokens, rlMarkdownPlugin} from "./markdown-it/rlMarkdownPlugin";
import {RLPluginState} from "./RLPluginState";
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

export class VaultScanner {
	constructor(
		private vault: Vault,
		private pluginState: RLPluginState
	) {}

	static async load(plugin: RelationalLinksPlugin) {
		plugin.vaultScanner = new VaultScanner(plugin.app.vault, plugin.state);
		await plugin.vaultScanner.scanVault();
	}

	public async loadTagsInFile(file: TFile) {
		const content = await this.vault.read(file);
		const tokens = md.parse(content, {});
		await getAllTokens(tokens).then((tokens) => tokens
			.filter((token) => token.type === 'relational_link')
			.forEach((token) => {
				const tag = token.children![0].content;
				const linkString = `#[${tag}[${file.basename}]]`;
				const link: RelationalLink = {
					tag: tag,
					fromTitle: file.basename,
					fromFile: file.path,
					toFile: "notes/processes/Project Management Process.md",
					contextLine: linkString,
					lineLocation: { start: 0, end: linkString.length }
				}
				this.pluginState.links.add(link);
			})
		)
	}

	async scanVault() {
		const markdownFiles = this.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.loadTagsInFile(file);
		}
	}

	public async searchTag(tag: string): Promise<RelationalLink[]> {
		const results = Array.from(this.pluginState.links).filter(link => link.tag === tag);
		return Promise.resolve(results);
	}
}
