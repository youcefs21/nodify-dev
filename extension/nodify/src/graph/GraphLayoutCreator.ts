import type { CustomNode } from "../types";
import type { Edge } from "@xyflow/react";
import dagre from "@dagrejs/dagre";

export function createGraphLayout(nodes: CustomNode[], edges: Edge[]) {
	const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
	graph.setGraph({ rankdir: "LR", ranksep: 50 });
	const nodeWidth = 260;
	const nodeHeight = 40;
	for (const edge of edges) {
		graph.setEdge(edge.source, edge.target);
	}
	for (const node of nodes) {
		graph.setNode(node.id, {
			width: nodeWidth,
			height: nodeHeight * (1 + node.data.children.length),
		});
	}
	dagre.layout(graph);

	for (const v of graph.nodes()) {
		console.log(`Node ${v}: ${JSON.stringify(graph.node(v))}`);
	}
	return {
		nodes: nodes.map((node) => {
			const nodeWithPosition = graph.node(node.id);
			const x = nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000;
			const y =
				nodeWithPosition.y - (nodeHeight * (1 + node.data.children.length)) / 2;

			// node.position = {
			//     x: nodeWithPosition.x - nodeWidth / 2,
			//     y: nodeWithPosition.y - (nodeHeight * (1 + node.data.children.length)) / 2
			//   };
			return { ...node, position: { x, y } };
		}),
		edges,
	};
}
