import {MarkdownPostProcessorContext, TFile} from "obsidian";

export function rlMarkdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext) {
	element.querySelectorAll("p").forEach((p) => {
		p.innerHTML = p.innerHTML.replace(/#\[([a-zA-Z0-9._:-]+)\[(.*?)\]\]/g, (match, tag, linkPath) => {
			const file = this.app.vault.getAbstractFileByPath(linkPath);
			const tagLink = `<a href="#${tag}" class="relational-links-tag" target="_blank" rel="noopener nofollow">${tag}</a>`;
			let pathLink = "";
			if (file && file instanceof TFile) {
				const basename = file.basename;
				pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link">${basename}</a>`;
			} else {
				const basename = linkPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || linkPath;
				pathLink = `<a data-ref="${basename}" href="${basename}" class="internal-link is-unresolved">${basename}</a>`;
			}
			return `#[${tagLink}[${pathLink}]]`;
		});
	});
}
