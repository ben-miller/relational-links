import MarkdownIt from "markdown-it";
import {relationalLinksMarkdownPlugin} from "./relationalLinksMarkdownPlugin";
import {getAllTokens} from "../main";

const md = new MarkdownIt();
md.use(relationalLinksMarkdownPlugin);

const markdownText = `
This is a note referencing another note:

#[bfo:depends_on[/path/to/another/note]]

Another example: #[example:related_to[/some/other/note]] with text after
`;

const tokens = md.parse(markdownText, {});
const allTokens = getAllTokens(tokens);

// Filter out the relational_link tokens
const relationalTokens = allTokens.filter(
	(token) => token.type === "relational_link"
);

console.log(`Relational tokens:`, relationalTokens);

// Output the rendered HTML
const renderedHtml = md.render(markdownText);
console.log("Rendered HTML:");
console.log(renderedHtml);
