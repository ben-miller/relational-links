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

export class RelationalLinkSuggestor extends EditorSuggest<TFile> {
	plugin: RelationalLinksPlugin;

	constructor(app: App, plugin: RelationalLinksPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestTriggerInfo | null {
		const lineBeforeCursor = editor.getLine(cursor.line).substr(0, cursor.ch);
		const match = lineBeforeCursor.match(/#\[[a-zA-Z0-9._:-]*?\[(.*)/);
		if (match) {
			return {
				start: {line: cursor.line, ch: cursor.ch - 2 - match[1].length },
				end: cursor,
				query: match[1]
			}
		}
		return null;
	}

	getSuggestions(context: EditorSuggestContext): TFile[] {
		return this.plugin.app.vault.getFiles().filter(file =>
			file.extension === "md" &&
			file.name.toLowerCase().includes(context.query.toLowerCase())
		)
	}

	renderSuggestion(suggestion: TFile, el: HTMLElement): void {
		const suggestionEl = el.createEl("div", { cls: "suggestion-content" });

		const fileNameEl = suggestionEl.createEl("div", { cls: "suggestion-title" });
		fileNameEl.setText(suggestion.basename);

		const filePathEl = suggestionEl.createEl("small", { cls: "suggestion-note" });
		filePathEl.setText(suggestion.path);
	}

	selectSuggestion(suggestion: TFile, evt: MouseEvent | KeyboardEvent): void {
		if (!this.context) {
			console.log("No context available for autocomplete");
			return;
		}
		const { editor, start, end } = this.context;
		if (editor) {
			// Replace text with suggestion
			editor.replaceRange(suggestion.path, { line: start.line, ch: start.ch + 2 }, { line: end.line, ch: end.ch });

			// Move cursor to end
			editor.setCursor({ line: end.line, ch: end.ch + suggestion.path.length + 2 });

			// Close popup
			this.close()
		}
	}
}
