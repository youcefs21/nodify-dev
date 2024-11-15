import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { nodeTypes, type CustomNode } from "./components/nodes.schema";

const initialNodes = [
	{
		id: "1",
		position: { x: 0, y: 0 },
		data: {
			label: "Function",
			id: "1",
			idRange: [1, 1],
			children: [],
			reversed: false,
			active: true,
			disabled: false,
		},
		type: "function",
	},
] satisfies CustomNode[];
// const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export default function App() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	// const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// const onConnect = useCallback(
	// 	(params) => setEdges((eds) => addEdge(params, eds)),
	// 	[setEdges],
	// );

	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodes={nodes}
				nodeTypes={nodeTypes}
				// edges={edges}
				onNodesChange={onNodesChange}
				// onEdgesChange={onEdgesChange}
				// onConnect={onConnect}
			>
				<Controls />
				<MiniMap />
				<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
			</ReactFlow>
		</div>
	);
}
