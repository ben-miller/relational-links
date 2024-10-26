import {TFile, Vault} from "obsidian";
import {getAllTokens, rlMarkdownPlugin} from "./markdown-it/rlMarkdownPlugin";
import {RLPluginState} from "./RLPluginState";
import MarkdownIt from "markdown-it";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

export class VaultScanner {
	constructor(
		private vault: Vault,
		private pluginState: RLPluginState
	) {}

	public async loadTagsInFile(file: TFile) {
		const content = await this.vault.read(file);
		const tokens = md.parse(content, {});
		await getAllTokens(tokens).then((tokens) => tokens
			.filter((token) => token.type === 'relational_link')
			.forEach((token) => {
				const tag = token.children![0].content;
				this.pluginState.relationalTags.add(tag);
			})
		)
	}

	async loadAllTags() {
		const markdownFiles = this.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.loadTagsInFile(file);
		}
	}
}
