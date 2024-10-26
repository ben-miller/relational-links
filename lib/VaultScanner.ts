import {TFile, Vault} from "obsidian";
import {getAllTokens, rlMarkdownPlugin} from "./markdown-it/rlMarkdownPlugin";
import {RLPluginState} from "./RLPluginState";
import MarkdownIt from "markdown-it";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

export interface TagSearchResult {
	title: string;
	path: string;
	tag: string;
	url?: string;
}

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

	public async searchTag(tag: string): Promise<TagSearchResult[]> {
		const dummyResults = [
			{ title: "Accountant", path: "/path/to/accountant.md", tag: "#ProfessionalOccupation" },
			{ title: "Apothecary", path: "/path/to/apothecary.md", tag: "#ProfessionalOccupation", url: "https://www.wikiwand.com/en/articles/apothecary" },
			{ title: "Concept Artist", path: "/path/to/concept_artist.md", tag: "#ProfessionalOccupation" },
			{ title: "Graphic Designer", path: "/path/to/graphic_designer.md", tag: "#ProfessionalOccupation" },
			{ title: "IP Attorney", path: "/path/to/ip_attorney.md", tag: "#ProfessionalOccupation" },
		];
		return dummyResults;
	}
}
