export type LLMBlock = {
	id: number;
	text: string;
	references?: { name: string; ref_id: number }[];
	children?: LLMBlock[];
};
