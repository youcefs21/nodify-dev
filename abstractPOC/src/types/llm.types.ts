import type { Scope } from "./graph.types";

export type Reference = { name: string; ref_id: number };
export type LLMBlock = {
	id: number;
	text: string;
	references?: Reference[];
	children?: LLMBlock[];
};

export interface FlowOutput {
	scope: Scope;
	blocks: LLMBlock[];
}
