import {EditorSuggest} from "obsidian";
import {noop} from "@babel/types";

export abstract class RLEditorSuggest<T> extends EditorSuggest<T> {
	private handler: (event: KeyboardEvent) => void = noop;

	initHandler(suggestions: T[]) {
		// Remove handler.
		window.removeEventListener('keydown', this.handler);

		// Create handler.
		this.handler = (event: KeyboardEvent) => {
			if (event.key === "Tab") {
				event.preventDefault();
				const suggestion = suggestions[0];
				if (suggestion) {
					this.selectSuggestion(suggestion, event);
				}
			} else if (event.key === "Backspace") {
				this.close();
			}
		}

		// Attach handler.
		window.addEventListener('keydown', this.handler);
	}

	close(): void {

		// Detach handler.
		if (this.handler) {
			window.removeEventListener('keydown', this.handler);
			this.handler = noop;
		}

		super.close();
	}
}
