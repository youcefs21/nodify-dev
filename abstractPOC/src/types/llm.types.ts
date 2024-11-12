export type Reference = { name: string; ref_id: number };
export type LLMBlock = {
	id: number;
	text: string;
	references?: Reference[];
	children?: LLMBlock[];
};
