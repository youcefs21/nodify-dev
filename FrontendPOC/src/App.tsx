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
import { abstractSnake } from "./data/snake";

export default function App() {
	if (entryNode.children?.[0]) {
		entryNode.children[0].children = abstractSnake;
	}
	const flattenedNodes = flattenCustomNodes(
		AbstractionLevelOneNodeMapper([entryNode]),
	);
	const initialEdges = createEdges(flattenedNodes);

	const [nodes, _setNodes, onNodesChange] = useNodesState(flattenedNodes);
	const [edges, _setEdges, onEdgesChange] = useEdgesState(initialEdges);

	return (
		<div className="w-screen h-screen">
			<ReactFlow
				nodes={nodes}
				nodeTypes={{
					stacked: StackedNodes,
				}}
				onNodesChange={onNodesChange}
				edges={edges}
				onEdgesChange={onEdgesChange}
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
