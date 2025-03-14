import type { Edge } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import type { CustomNode } from "./graph.types";

export function createGraphLayout(nodes: CustomNode[], edges: Edge[]) {
	const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	graph.setGraph({
		rankdir: "LR",
		ranksep: 50, // Adjust this value to control rank separation
		align: "UL", // Try aligning nodes to upper-left
		ranker: "tight-tree", // This ranker often gives more predictable results
	});
	const nodeWidth = 260;
	const nodeHeight = 64;
	for (const edge of edges) {
		graph.setEdge(edge.source, edge.target);
	}
	for (const node of nodes) {
		node.width = nodeWidth + 32;
		node.height = nodeHeight * (1 + node.data.children.length) + 32;
		graph.setNode(node.id, {
			width: node.width,
			height: node.height,
		});
	}
	dagre.layout(graph);

	for (const v of graph.nodes()) {
		console.log(`Node ${v}: ${JSON.stringify(graph.node(v))}`);
	}
	return {
		nodes: nodes.map((node) => {
			const nodeWithPosition = graph.node(node.id);
			const x = nodeWithPosition.x;
			const y = nodeWithPosition.y;

			// node.position = {
			//     x: nodeWithPosition.x - nodeWidth / 2,
			//     y: nodeWithPosition.y - (nodeHeight * (1 + node.data.children.length)) / 2
			//   };
			return { ...node, position: { x, y } };
		}),
		edges,
	};
}
