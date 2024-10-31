import {App, Editor, EditorPosition, EditorSuggestContext, EditorSuggestTriggerInfo, TFile} from "obsidian";
import {RLEditorSuggest} from "./RLEditorSuggest";
import {RLPluginState} from "../RLPluginState";

export class RelationalTagSuggest extends RLEditorSuggest<string> {
	constructor(app: App, private pluginState: RLPluginState) {
		super(app);
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		const lineBeforeCursor = editor.getLine(cursor.line).substr(0, cursor.ch);
		const match = lineBeforeCursor.match(/#\[(.*)/)
		if (match) {
			const secondMatch = lineBeforeCursor.match(/#\[(.*)\[.*/);
			if (secondMatch) {
				return null;
			}
			return {
				start: { line: cursor.line, ch: cursor.ch - match[0].length },
				end: cursor,
				query: match[1],
			};
		}
		return null;
	}

	getSuggestions(context: EditorSuggestContext): string[] {
		const suggestions = Array.from(this.pluginState.links)
			.map(link => link.tag)
			.filter(tag =>
				tag.toLowerCase().includes(context.query.toLowerCase())
			);
		this.initHandler(suggestions);
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

			// HACK: Insert space so that backspace can be used to trigger link suggest
			editor.replaceRange(' ', cursor)
			const newCursorPosition = { line: cursor.line, ch: cursor.ch + 1 }
			editor.setCursor(newCursorPosition);
		}
	}
}
