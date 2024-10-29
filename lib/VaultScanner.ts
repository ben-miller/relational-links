import {TFile, Vault} from "obsidian";
import {getAllTokens, rlMarkdownPlugin} from "./markdown-it/rlMarkdownPlugin";
import {RLPluginState} from "./RLPluginState";
import MarkdownIt from "markdown-it";

const md = MarkdownIt()
md.use(rlMarkdownPlugin)

export interface TagSearchResult {
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

	async scanVault() {
		const markdownFiles = this.vault.getMarkdownFiles();
		for (const file of markdownFiles) {
			await this.loadTagsInFile(file);
		}
	}

	public async searchTag(tag: string): Promise<TagSearchResult[]> {
		const dummyResults: TagSearchResult[] = [
			{
				tag: "illustrates",
				fromTitle: "Process Flowchart",
				fromFile: "notes/diagrams/Process Flowchart.md",
				toFile: "notes/processes/Project Management Process.md",
				contextLine: "Steps to #[illustrates[Project Management Process]] in project planning.",
				lineLocation: { start: 9, end: 50 }
			},
			{
				tag: "illustrates",
				fromTitle: "Gravity Example",
				fromFile: "notes/examples/Gravity Example.md",
				toFile: "notes/theories/Newtons Laws.md",
				contextLine: "#[illustrates[Newtons Laws]]",
				lineLocation: { start: 0, end: 27 }
			},
			{
				tag: "illustrates",
				fromTitle: "Tesla Case Study",
				fromFile: "notes/case studies/Tesla Case Study.md",
				toFile: "notes/theories/Disruptive Innovation Theory.md",
				contextLine: "Tesla's #[illustrates[Disruptive Innovation Theory]] shows innovation in action.",
				lineLocation: { start: 8, end: 51 }
			},
			{
				tag: "illustrates",
				fromTitle: "Internet Users Bar Graph",
				fromFile: "notes/data/Internet Users Bar Graph.md",
				toFile: "notes/trends/Global Connectivity Trends.md",
				contextLine: "#[illustrates[Global Connectivity Trends]]",
				lineLocation: { start: 0, end: 41 }
			},
			{
				tag: "illustrates",
				fromTitle: "Gandhi Quote",
				fromFile: "notes/quotes/Gandhi Quote.md",
				toFile: "notes/philosophies/Personal Responsibility Philosophy.md",
				contextLine: "#[illustrates[Personal Responsibility Philosophy]]",
				lineLocation: { start: 0, end: 49 }
			},
			{
				tag: "illustrates",
				fromTitle: "Magna Carta Event",
				fromFile: "notes/history/Magna Carta Event.md",
				toFile: "notes/principles/Constitutional Governance Principle.md",
				contextLine: "Historical #[illustrates[Constitutional Governance Principle]] example.",
				lineLocation: { start: 11, end: 61 }
			},
			{
				tag: "illustrates",
				fromTitle: "Double Slit Experiment",
				fromFile: "notes/experiments/Double Slit Experiment.md",
				toFile: "notes/principles/Wave Particle Duality.md",
				contextLine: "#[illustrates[Wave Particle Duality]]",
				lineLocation: { start: 0, end: 36 }
			},
			{
				tag: "illustrates",
				fromTitle: "Tortoise and Hare Fable",
				fromFile: "notes/fables/Tortoise and Hare Fable.md",
				toFile: "notes/lessons/Persistence Lesson.md",
				contextLine: "#[illustrates[Persistence Lesson]]",
				lineLocation: { start: 0, end: 33 }
			},
			{
				tag: "illustrates",
				fromTitle: "The Scream Painting",
				fromFile: "notes/art/The Scream Painting.md",
				toFile: "notes/emotions/Anxiety and Dread.md",
				contextLine: "#[illustrates[Anxiety and Dread]]",
				lineLocation: { start: 0, end: 32 }
			},
			{
				tag: "illustrates",
				fromTitle: "Sherlock Holmes Character",
				fromFile: "notes/characters/Sherlock Holmes Character.md",
				toFile: "notes/archetypes/Analytical Archetype.md",
				contextLine: "#[illustrates[Analytical Archetype]]",
				lineLocation: { start: 0, end: 35 }
			}
		];
		return dummyResults;
	}
}
