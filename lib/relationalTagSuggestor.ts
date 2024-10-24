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
import {noop} from "@babel/types";

export class RelationalTagSuggestor extends EditorSuggest<string> {
	plugin: RelationalLinksPlugin;
	tabHandler: (event: KeyboardEvent) => void = noop;

	constructor(app: App, plugin: RelationalLinksPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		const lineBeforeCursor = editor.getLine(cursor.line).substr(0, cursor.ch);

		// Check if the trigger is "#[" and trigger autocomplete
		const match = lineBeforeCursor.match(/#\[(.*)$/)
		if (match) {
			const secondMatch = lineBeforeCursor.match(/#\[(.*)\[$/);
			if (secondMatch) {
				return null;
			}
			return {
				start: { line: cursor.line, ch: cursor.ch - match[0].length },  // Start position for the suggestion
				end: cursor,  // End position
				query: match[1],  // Extract the typed characters after #[ for filtering
			};
		}
		return null;
	}

	getSuggestions(context: EditorSuggestContext): string[] {
		const suggestions = Array.from(this.plugin.relationalTags).filter(option =>
			option.toLowerCase().includes(context.query.toLowerCase())
		);

		// In case there is an existing handler, remove it.
		window.removeEventListener('keydown', this.tabHandler);

		// Create a new handler using the suggestions.
		this.tabHandler = (event: KeyboardEvent) => {
			if (event.key === "Tab") {
				event.preventDefault();
				const suggestion = suggestions[0];
				if (suggestion) {
					this.selectSuggestion(suggestion, event);
				}
			}
		}
		window.addEventListener('keydown', this.tabHandler);

		return suggestions;
	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.createEl("div", { text: suggestion });
	}

	selectSuggestion(suggestion: string, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) {
			console.log("No context available for autocomplete");
			return;
		}
		const { editor, start, end } = this.context;
		const completionText = `#[${suggestion}[]`;
		if (editor) {

			// Replace text with selected suggestion
			editor.replaceRange(`#[${suggestion}[]`, start, end);
			this.close()

			// Set cursor to inside the new []
			const cursor = {
				line: start.line,
				ch: start.ch + completionText.length - 1
			}
			editor.setCursor(cursor);

			// HACK: Insert space so that backspace can be used to trigger link suggestor
			editor.replaceRange(' ', cursor)
			const newCursorPosition = { line: cursor.line, ch: cursor.ch + 1 }
			editor.setCursor(newCursorPosition);
		}
	}

	close(): void {
		if (this.tabHandler) {
			window.removeEventListener('keydown', this.tabHandler);
			this.tabHandler = noop;
		}
		super.close();
	}
}
