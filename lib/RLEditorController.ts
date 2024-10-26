import RelationalLinksPlugin from "../main";

export class RLEditorController {
	private listenerMap: WeakMap<HTMLElement, EventListener> = new WeakMap();
	private plugin: RelationalLinksPlugin;

	constructor(plugin: RelationalLinksPlugin) {
		this.plugin = plugin;
	}

	public async attachTagListeners(container: HTMLElement) {
		container.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
			const listener = (event: Event) => {
				const tag = (event.currentTarget as HTMLElement).getAttribute("href")?.substring(1);
				this.plugin.openLeftSidebarView(tag);
			};

			element.addEventListener("click", listener);
			this.listenerMap.set(element, listener);
		});
	}

	public detachTagListeners(container: HTMLElement) {
		container.querySelectorAll(".relational-links-tag").forEach((element: HTMLElement) => {
			const listener = this.listenerMap.get(element);
			if (listener) {
				element.removeEventListener("click", listener);
				this.listenerMap.delete(element);
			}
		});
	}
}
