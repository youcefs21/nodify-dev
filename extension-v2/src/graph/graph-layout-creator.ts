import type { Edge } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import type { CustomNode } from "./graph.types";

export function createGraphLayout(nodes: CustomNode[], edges: Edge[]) {
	const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	graph.setGraph({
		rankdir: "LR",
		// ranksep: 150,
		// nodesep: 100,
		// edgesep: 50,
		// align: "UL",
	});
	const nodeWidth = 300;
	for (const edge of edges) {
		graph.setEdge(edge.source, edge.target);
	}
	for (const node of nodes) {
		const nodeHeight = node.type === "stacked" ? 64 : 96;
		node.width = nodeWidth + 32;
		node.height = nodeHeight * (1 + node.data.children.length) + 32;
		graph.setNode(node.id, {
			width: node.width,
			height: node.height + 32,
		});
	}
	dagre.layout(graph);

	return {
		nodes: nodes.map((node) => {
			const nodeHeight = node.type === "stacked" ? 64 : 160;
			const nodeWithPosition = graph.node(node.id);
			const x = nodeWithPosition.x;
			const y = nodeWithPosition.y;

			node.position = {
				x: x - nodeWidth / 2,
				y: y - (nodeHeight * (1 + node.data.children.length)) / 2,
			};
			return node;
		}),
		edges,
	};
}
