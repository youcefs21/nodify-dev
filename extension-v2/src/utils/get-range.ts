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

export function combineCodeRanges(
	range1: CodeRange,
	range2: CodeRange,
): CodeRange {
	return {
		start: {
			line: Math.min(range1.start.line, range2.start.line),
			character:
				range1.start.line < range2.start.line
					? range1.start.character
					: range2.start.line < range1.start.line
						? range2.start.character
						: Math.min(range1.start.character, range2.start.character),
		},
		end: {
			line: Math.max(range1.end.line, range2.end.line),
			character:
				range1.end.line > range2.end.line
					? range1.end.character
					: range2.end.line > range1.end.line
						? range2.end.character
						: Math.max(range1.end.character, range2.end.character),
		},
	};
}
