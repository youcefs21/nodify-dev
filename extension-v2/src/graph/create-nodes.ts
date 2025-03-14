import type { CodeBlock } from "../ast/ast.schema";
import type { AbstractionGroup } from "../ast/llm";
import type { CustomNode } from "./graph.types";

/**
 * Flattens the abstraction group tree,
 * and creates a ReactFlow node for each abstraction group
 */
export function createNodes(
	data: AbstractionGroup[],
	codeBlocks: CodeBlock[],
): CustomNode[] {
	return data.flatMap((group) => {
		// find the range
		const startId = group.idRange[0];
		const endId = group.idRange[1];
		const startBlock = codeBlocks.find((block) => {
			return block.id === startId;
		});
		const endBlock = codeBlocks.find((block) => {
			return block.id === endId;
		});

		if (!startBlock || !endBlock) {
			throw new Error("Block not found");
		}

		const childNodes = group.children
			? createNodes([...group.children], codeBlocks)
			: [];

		const parentNode = {
			id: `${startId}-${endId}`,
			data: {
				id: `${startId}-${endId}`,
				label: group.label,
				codeRange: [startBlock.range, endBlock.range],
				filePath: startBlock.filePath,
				children: childNodes.map((node) => node.data),
				expanded: true,
				type: group.type,
			},
			type: "stacked",
			position: { x: 0, y: 0 },
		} as CustomNode;

		return [parentNode, ...childNodes];
	});
}
