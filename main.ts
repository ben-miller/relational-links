import { Plugin } from "obsidian";
import MarkdownIt, {Token} from "markdown-it";
import {relationalLinksMarkdownPlugin} from "./lib/relationalLinksMarkdownPlugin";

const md = MarkdownIt()
md.use(relationalLinksMarkdownPlugin)

// Recursive function to collect all tokens, with proper type annotations
export function getAllTokens(tokens: Token[]): Token[] {
	let allTokens: Token[] = [];
	for (const token of tokens) {
		allTokens.push(token);
		if (token.children && token.children.length > 0) {
			allTokens = allTokens.concat(getAllTokens(token.children));
		}
	}
	return allTokens;
}

export default class RelationalLinksPlugin extends Plugin {
	async onload() {
		console.log('Loading plugin...');

		// The vault is ready when the plugin is loaded, so we can get markdown files immediately
		const markdownFiles = this.app.vault.getMarkdownFiles();

		console.log('Files in vault:', markdownFiles);

		// Process the files as needed
		for (const file of markdownFiles) {
			const content = await this.app.vault.read(file);
			const tokens = md.parse(content, {});
			getAllTokens(tokens).filter((token) => token.type === 'relational_link').forEach((token) => {
				console.log(`Relational link in: ${file.path}`);
				console.log(token.content);
			})
		}

		// Listen for file changes (if needed)
		this.registerEvent(this.app.vault.on("create", (file) => {
			console.log(`File created: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("modify", (file) => {
			console.log(`File modified: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("delete", (file) => {
			console.log(`File deleted: ${file.path}`);
		}));

		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			console.log(`File renamed from ${oldPath} to ${file.path}`);
		}));
	}

	async onunload() {
		console.log('Unloading plugin...');
		// Cleanup if necessary
	}
}
