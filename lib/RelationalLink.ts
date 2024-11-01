
export interface RelationalLink {
	tag: string;
	fromTitle: string;
	fromFile: string;
	toFile: string;
	contextLine: string;
	lineLocation: { start: number; end: number }
}
