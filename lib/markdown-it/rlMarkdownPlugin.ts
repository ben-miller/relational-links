import MarkdownIt from "markdown-it";
import { StateInline, Token } from "markdown-it";
import RelationalLinksPlugin from "../../main";
import {MarkdownPostProcessorContext, TFile, Vault} from "obsidian";

export function loadRlMarkdownPlugin(plugin: RelationalLinksPlugin) {
	const markdownPostProcessor = rlMarkdownPostProcessor(plugin.app.vault);
	plugin.registerMarkdownPostProcessor(markdownPostProcessor);
}

export async function getAllTokens(tokens: Token[]): Promise<Token[]> {
	let allTokens: Token[] = [];
	for (const token of tokens) {
		allTokens.push(token);
		if (token.children && token.children.length > 0) {
			allTokens = allTokens.concat(await getAllTokens(token.children));
		}
	}
	return allTokens;
}

export function rlMarkdownPlugin(md: MarkdownIt) {
	function parseRelationalLink(state: StateInline, silent: boolean): boolean {
		const start = state.pos;
		const src = state.src.slice(start);

		if (!src.startsWith("#[")) {
			return false;
		}

		const match = src.match(/#\[([^[]+?)\[(.+?)]]/);

		if (!match) {
			return false;
		}

		const fullMatch = match[0];
		const label = match[1].trim();
		const path = match[2].trim();

		if (!silent) {
			const token = state.push("relational_link", "", 0);
			token.markup = fullMatch;

			// Create child tokens for both label and path
			token.children = [];

			// Child token for the relationship type (label)
			const labelToken = state.push("relational_link_label", "", 0);
			labelToken.content = label;
			token.children.push(labelToken);

			// Child token for the path
			const pathToken = state.push("relational_link_path", "", 0);
			pathToken.content = path;
			token.children.push(pathToken);
		}

		state.pos += fullMatch.length;
		return true;
	}

	// Register the inline rule for the relational links
	md.inline.ruler.before("link", "relational_link", parseRelationalLink);
}

function rlMarkdownPostProcessor(vault: Vault): (element: HTMLElement, context: MarkdownPostProcessorContext) => void {
	return (element: HTMLElement, context: MarkdownPostProcessorContext) => {
		element.querySelectorAll("p").forEach((p) => {
			p.innerHTML = p.innerHTML.replace(/#\[([a-zA-Z0-9._:-]+)\[(.*?)\]\]/g, (match, tag, linkPath) => {
				const file = vault.getAbstractFileByPath(linkPath);
				const tagLink = `<a href="#${tag}" class="relational-links-tag" target="_blank" rel="noopener nofollow">${tag}</a>`;
				let pathLink = "";
				if (file && file instanceof TFile) {
					const basename = file.basename;
					pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link">${basename}</a>`;
				} else {
					const basename = linkPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || linkPath;
					pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link is-unresolved">${basename}</a>`;
				}
				return `#[${tagLink}[${pathLink}]]`;
			});
		});
	}
}

