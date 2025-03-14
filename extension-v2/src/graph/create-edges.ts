import type { CustomNode } from "./graph.types";
import type { Edge } from "@xyflow/react";

/**
 * Create edges between nodes and their children
 * @param nodes
 * @returns
 */
export function createEdges(nodes: CustomNode[]): Edge[] {
	return nodes.flatMap((node) => {
		return node.data.children
			.filter((child) => child.children.length > 0)
			.map((child) => {
				return {
					id: `${node.id}->${child.id}`,
					source: node.id,
					target: child.id,
					sourceHandle: `${node.id}-${child.id}`,
					targetHandle: `${child.id}`,
				} as Edge;
			});
	});
}
