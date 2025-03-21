import { Effect } from "effect";
import { decodeLLMCodeBlocks, type CodeBlock } from "../ast/ast.schema";
import type { AbstractionGroup } from "../ast/llm";
import type { CustomNode } from "./graph.types";
import { getShortId, hashString } from "../utils/hash";
import {
	dedupeAndSummarizeReferences,
	getFlatReferencesListFromAST,
} from "../ast/references";
import { getAbstractionTree } from "../ast/llm";
import type { Graph } from "../vsc/show-open-file";

export function flattenCodeBlocks(codeBlocks: CodeBlock[]): CodeBlock[] {
	return codeBlocks.flatMap((block) => {
		return [block, ...flattenCodeBlocks(block.children || [])];
	});
}

/**
 * Flattens the abstraction group tree,
 * and creates a ReactFlow node for each abstraction group
 */
export function createGraph(
	data: AbstractionGroup[],
	flatCodeBlocks: CodeBlock[],
	parentId: string,
	chunkId: string,
): Graph[] {
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
			console.error("block not found", { ...group, children: "..." });
			return [];
		}

		const nodeId = `${chunkId}-${startId}-${endId}`;

		const childNodes =
			group.children && group.children.length > 0
				? createGraph([...group.children], flatCodeBlocks, nodeId, chunkId)
				: [];

		// Check if the referenced ID exists in any flatCodeBlocks' references
		const refId =
			group.referenceID && typeof group.referenceID === "string"
				? flatCodeBlocks.some((block) =>
						block.references?.some((ref) => ref.id === group.referenceID),
					)
					? group.referenceID
					: undefined
				: undefined;

		const parentNode = {
			id: nodeId,
			data: {
				id: nodeId,
				parentId,
				chunkId,
				isChunkRoot: parentId === "root",
				label: group.label,
				codeRange: [startBlock.range, endBlock.range],
				filePath: startBlock.filePath,
				children: childNodes.map((node) => node.node.data),
				expanded: true,
				type: group.type,
				refID: refId,
			},
			type: "stacked",
			position: { x: 0, y: 0 },
		} satisfies CustomNode;

		return {
			node: parentNode,
			children: childNodes,
		} satisfies Graph;
	});
}

/**
 * Creates a graph from an AST
 * @param ast The AST to create a graph from
 * @param parentId The parent ID of the graph
 * @returns The nodes of the graph
 */
export function getGraphsFromAst(
	ast: CodeBlock[],
	filePath: string,
	signature?: string,
) {
	return Effect.gen(function* () {
		const astHash = yield* hashString(
			`${filePath}\n${signature}\n${JSON.stringify(ast)}`,
		);

		// Process the references
		const references = getFlatReferencesListFromAST(ast);
		console.log(`Found ${references.length} references in the AST`);
		const processedRefs = yield* dedupeAndSummarizeReferences(references);
		const referenceMap = processedRefs.reduce(
			(map, ref) => {
				map[ref.id] = { summary: ref.summary, symbol: ref.symbol };
				return map;
			},
			{} as Record<string, { summary: string; symbol: string }>,
		);

		// LLM prompt context
		const promptContext = {
			filePath,
			context: signature,
			ast: yield* decodeLLMCodeBlocks(ast),
			references: referenceMap,
		};

		// get the abstraction tree
		const tree = yield* getAbstractionTree(promptContext, astHash);
		const flatCodeBlocks = flattenCodeBlocks(ast);

		// create the graph
		const chunkId = getShortId(astHash);
		const graphs = createGraph(
			tree as AbstractionGroup[],
			flatCodeBlocks,
			"root",
			chunkId,
		);

		return { graphs, references };
	});
}
