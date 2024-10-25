const listenerMap = new WeakMap<HTMLElement, EventListener>(); // Encapsulate listenerMap here

export function attachTagListeners(container: HTMLElement) {
	container.querySelectorAll('.relational-links-tag').forEach((element: HTMLElement) => {
		const listener = (event: Event) => {
			const tag = (event.currentTarget as HTMLElement).getAttribute("href")?.substring(1);
			console.log("TAG CLICKED:", tag);
		};

		element.addEventListener("click", listener);
		listenerMap.set(element, listener);
	});
}

export function detachTagListeners(container: HTMLElement) {
	container.querySelectorAll(".relational-links-tag").forEach((element: HTMLElement) => {
		const listener = listenerMap.get(element);
		if (listener) {
			element.removeEventListener("click", listener);
			listenerMap.delete(element);
		}
	});
}
