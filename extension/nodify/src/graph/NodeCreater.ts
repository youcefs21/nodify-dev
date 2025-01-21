import type { CustomNode, LLMOutput } from "@nodify/schema";
import type { Edge } from "@xyflow/react";

export type NodeTypes =
	| "expression"
	| "function"
	| "entry"
	| "event"
	| "loop"
	| "condition";

export function AbstractionLevelOneNodeMapper(
	output: LLMOutput[],
	expanded: Map<string, boolean>,
): CustomNode[] {
	// Map the output nodes recursively, starting with depth 1
	return output.map((node) => mapSingleNode(node, 1, expanded));
}

// Helper function to map a single node to CustomNode
function mapSingleNode(
	node: LLMOutput,
	depth: number,
	expanded: Map<string, boolean>,
): CustomNode {
	return {
		id: `${node.groupID}`,
		data: {
			id: `${node.groupID}`,
			label: node.label,
			idRange: node.idRange,
			expanded: expanded.get(node.groupID.toString()) ?? false,
			// TODO: create a type -> icon/color mapping
			icon: "tags",
			iconBackgroundColor: "black",
			hasChildren: !!node.children && node.children.length > 0,
			children:
				node.children && expanded.get(node.groupID.toString()) === true
					? node.children.map((child) => {
							const childNode = mapSingleNode(child, depth + 1, expanded);
							return {
								...childNode.data,
								position: childNode.position,
							};
						})
					: [],
			reversed: false,
			active: true,
			disabled: false,
		},
		type: "stacked",
		position: { x: 300 * depth, y: 0 },
	} satisfies CustomNode;
}

export function flattenCustomNodes(nodes: CustomNode[]): CustomNode[] {
	const flattened: CustomNode[] = [];
	const padding = 10;
	const yPerDepth: number[] = [];

	function flattenNode(node: CustomNode, depth: number) {
		if (yPerDepth[depth] === undefined) {
			yPerDepth[depth] = 0;
		}
		node.id = node.data.id; // Ensure the node ID is set to its groupID
		node.position = {
			x: 300 * depth,
			y: yPerDepth[depth],
		}; // Adjust position based on depth and verticalDepth to avoid overlap
		if (node.data.children.length > 0) {
			flattened.push(node);
		}
		for (let i = 0; i < node.data.children.length; i++) {
			const childData = node.data.children[i];
			const childNode: CustomNode = {
				...node,
				id: childData.id, // Set the child node ID to its groupID
				data: childData,
			};
			flattenNode(childNode, depth + 1); // Keep verticalDepth the same for the first child and increment for subsequent children
			yPerDepth[depth + 1] += 40 * childNode.data.children.length + padding;
		}
	}

	yPerDepth.push(0);
	for (let i = 0; i < nodes.length; i++) {
		flattenNode(nodes[i], 1); // Start verticalDepth from the same level as the root
		yPerDepth[0] += 40 * nodes[i].data.children.length + padding;
	}

	return flattened;
}

export function createEdges(nodes: CustomNode[]): Edge[] {
	const edges: Edge[] = [];

	const parentMap: { [key: string]: string } = {};
	let parentId = nodes[0].id;

	for (let i = 0; i < nodes.length; i++) {
		for (let j = 0; j < nodes[i].data.children.length; j++) {
			const child = nodes[i].data.children[j];
			parentMap[child.id] = nodes[i].id;
		}
	}
	console.log(parentMap);
	for (let i = 1; i < nodes.length; i++) {
		parentId = parentMap[nodes[i].id];
		if (nodes[i].data.children && nodes[i].data.children.length > 0) {
			edges.push({
				id: `e${parentId}-${nodes[i].id}`,
				source: parentId,
				sourceHandle: `${nodes[i].id}-source`,
				type: "step",
				target: nodes[i].id,
				targetHandle: `${nodes[i].data.children[0].id}-root-target`,
			} satisfies Edge);
		}
	}
	return edges;
}

export const entryNode: LLMOutput = {
	groupID: -2,
	label: "Dummy",
	idRange: [0, 999],
	type: "entry",
	expanded: true,
	children: [
		{
			groupID: -1,
			label: "Entry",
			idRange: [0, 999],
			type: "entry",
			expanded: true,
			children: [],
		},
	],
};
