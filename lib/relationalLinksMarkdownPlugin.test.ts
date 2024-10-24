import MarkdownIt from "markdown-it";
import {getAllTokens, relationalLinksMarkdownPlugin} from "./relationalLinksMarkdownPlugin";

const markdownText = `
This is a note referencing another note:

#[bfo:depends_on[/path/to/another/note]]

Another example: #[example:related_to[/some/other/note]] with text after
`;

describe("Relational Links Markdown Plugin", () => {
	let md: MarkdownIt;

	beforeEach(() => {
		md = new MarkdownIt();
		md.use(relationalLinksMarkdownPlugin);
	});

	it("should parse relational link tokens correctly", () => {

		// Parse the markdown text
		const tokens = md.parse(markdownText, {});
		const allTokens = getAllTokens(tokens);

		// Filter out relational_link tokens
		const relationalTokens = allTokens.filter(
			(token) => token.type === "relational_link"
		);

		// Expect two relational_link tokens
		expect(relationalTokens.length).toBe(2);

		// Check that each relational_link token has two children (label and path)
		expect(relationalTokens[0].children?.length).toBe(2);
		expect(relationalTokens[1].children?.length).toBe(2);

		// Check the first token's children (bfo:depends_on label and path)
		const firstTokenChildren = relationalTokens[0].children!;
		expect(firstTokenChildren[0].type).toBe("relational_link_label");
		expect(firstTokenChildren[0].content).toBe("bfo:depends_on");
		expect(firstTokenChildren[1].type).toBe("relational_link_path");
		expect(firstTokenChildren[1].content).toBe("/path/to/another/note");

		// Check the second token's children (example:related_to label and path)
		const secondTokenChildren = relationalTokens[1].children!;
		expect(secondTokenChildren[0].type).toBe("relational_link_label");
		expect(secondTokenChildren[0].content).toBe("example:related_to");
		expect(secondTokenChildren[1].type).toBe("relational_link_path");
		expect(secondTokenChildren[1].content).toBe("/some/other/note");
	});
});
