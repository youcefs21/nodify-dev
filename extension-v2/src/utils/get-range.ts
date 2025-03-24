import type { SgNode } from "@ast-grep/napi";
import type { CodeRange } from "../ast/llm/llm.schema";

export function getCodeRangeFromSgNode(node: SgNode): CodeRange {
	const raw_range = node.range();
	return {
		start: {
			line: raw_range.start.line,
			character: raw_range.start.column,
		},
		end: {
			line: raw_range.end.line,
			character: raw_range.end.column,
		},
	};
}
