import MarkdownIt from "markdown-it";
import { StateInline, Token } from "markdown-it";

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

export function relationalLinksMarkdownPlugin(md: MarkdownIt) {
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
			token.content = label;
			token.meta = { path };
			token.markup = fullMatch;
		}

		state.pos += fullMatch.length;
		return true;
	}

	// Register the inline rule for the relational links
	md.inline.ruler.before("link", "relational_link", parseRelationalLink);

	// Define how to render the token into HTML (or any other desired format)
	md.renderer.rules["relational_link"] = function (
		tokens: Token[],
		idx: number,
		options,
		env,
		self
	) {
		const token = tokens[idx];
		const label = md.utils.escapeHtml(token.content);
		const meta = token.meta as { path: string };
		const path = md.utils.escapeHtml(meta.path);

		return `<a class="relational-link" href="${path}">${label}</a>`;
	};
}
