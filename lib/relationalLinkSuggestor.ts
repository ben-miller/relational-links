import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile
} from "obsidian";
import RelationalLinksPlugin from "../main";

const relationalLinks = [
	"link0", "link1", "link2"
];

export class RelationalLinkSuggestor extends EditorSuggest<string> {
	plugin: RelationalLinksPlugin;

	constructor(app: App, plugin: RelationalLinksPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		const lineBeforeCursor = editor.getLine(cursor.line).substr(0, cursor.ch);
		if (/#\[.*\[$/.test(lineBeforeCursor)) {
			const triggerInfo = {
				start: { line: cursor.line, ch: cursor.ch - 2 },
				end: cursor,
				query: "",
			};
			return triggerInfo
		}
		return null;
	}

	// Return the list of suggestions
	getSuggestions(context: EditorSuggestContext): string[] {
		return relationalLinks.filter(option =>
			option.toLowerCase().includes(context.query.toLowerCase()) // Filter based on user input
		);
	}

	// What happens when a suggestion is selected
	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.createEl("div", { text: suggestion });
	}

	// When the user selects a suggestion, insert it into the editor
	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) {
			console.log("No context available for autocomplete");
			return;
		}
		const { editor, start, end } = this.context;
		if (editor) {
			// Replace text with suggestion
			editor.replaceRange(suggestion, { line: start.line, ch: start.ch + 2 }, { line: end.line, ch: end.ch });

			// Move cursor to end
			editor.setCursor({ line: end.line, ch: end.ch + suggestion.length + 2 });

			// Close popup
			this.close()
		}
	}
}
