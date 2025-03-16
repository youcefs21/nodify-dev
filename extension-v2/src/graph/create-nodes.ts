import type { CodeBlock } from "../ast/ast.schema";
import type { AbstractionGroup } from "../ast/llm";
import type { CustomNode } from "./graph.types";

export function flattenCodeBlocks(codeBlocks: CodeBlock[]): CodeBlock[] {
	return codeBlocks.flatMap((block) => {
		return [block, ...flattenCodeBlocks(block.children || [])];
	});
}

/**
 * Flattens the abstraction group tree,
 * and creates a ReactFlow node for each abstraction group
 */
export function createNodes(
	data: AbstractionGroup[],
	flatCodeBlocks: CodeBlock[],
	parentId = "root",
): CustomNode[] {
	return data.flatMap((group) => {
		// find the range
		const startId = group.idRange[0];
		const endId = group.idRange[1];
		const startBlock = flatCodeBlocks.find((block) => {
			return block.id === startId;
		});
		const endBlock = flatCodeBlocks.find((block) => {
			return block.id === endId;
		});

		if (!startBlock || !endBlock) {
			console.error("block not found");
			return [];
		}

		const childNodes =
			group.children && group.children.length > 0
				? createNodes(
						[...group.children],
						flatCodeBlocks,
						`${startId}-${endId}`,
					)
				: [];

		const parentNode = {
			id: `${startId}-${endId}`,
			data: {
				id: `${startId}-${endId}`,
				parentId,
				label: group.label,
				codeRange: [startBlock.range, endBlock.range],
				filePath: startBlock.filePath,
				children: childNodes
					.map((node) => node.data)
					.filter((node) => `${startId}-${endId}` === node.parentId),
				expanded: true,
				type: group.type,
				refID: group.referenceID ?? undefined,
			},
			type: "stacked",
			position: { x: 0, y: 0 },
		} satisfies CustomNode;

		return [parentNode, ...childNodes];
	});
}
