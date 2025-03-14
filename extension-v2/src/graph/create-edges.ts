import type { CustomNode } from "./graph.types";
import type { Edge } from "@xyflow/react";

/**
 * Create edges between nodes and their children
 * @param nodes
 * @returns
 */
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
	for (let i = 1; i < nodes.length; i++) {
		parentId = parentMap[nodes[i].id];
		if (nodes[i].data.children && nodes[i].data.children.length > 0) {
			edges.push({
				id: `e${parentId}-${nodes[i].id}`,
				source: parentId,
				sourceHandle: `${nodes[i].id}-source`,
				// type: "step",
				target: nodes[i].id,
				targetHandle: `${nodes[i].data.children[0].id}-root-target`,
			} satisfies Edge);
		}
	}
	return edges;
}
