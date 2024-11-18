import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
	useEdgesState,
	addEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import {
	AbstractionLevelOneNodeMapper,
	createEdges,
	entryNode,
	flattenCustomNodes,
} from "./functions/NodeCreater";
import { StackedNodes } from "./components/StackedNodes";
import { useCallback } from "react";
import { abstractSnake, testSnake } from "./data/snake";

export default function App() {
	if (entryNode.children?.[0]) {
		entryNode.children[0].children = abstractSnake;
	}
	const flattenedNodes = flattenCustomNodes(
		AbstractionLevelOneNodeMapper([entryNode]),
	);
	const initialEdges = createEdges(flattenedNodes);

	const [nodes, setNodes, onNodesChange] = useNodesState(flattenedNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	const onConnect = useCallback(
		(params) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	return (
		<div style={{ width: "100vw", height: "100vh" }}>
			<ReactFlow
				nodes={nodes}
				nodeTypes={{
					stacked: StackedNodes,
				}}
				onNodesChange={onNodesChange}
				edges={edges}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				snapToGrid={true}
				snapGrid={[10, 10]}
			>
				<Controls />
				<MiniMap />
				<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
			</ReactFlow>
		</div>
	);
}
