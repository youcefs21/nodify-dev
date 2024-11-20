import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
	useEdgesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { StackedNodes } from "./components/StackedNodes";
import { useAtomValue } from "jotai";
import { edgesAtom, nodesAtom } from "./data/nodesAtom";
import { useEffect } from "react";

export default function App() {
	const nodes = useAtomValue(nodesAtom);
	const edges = useAtomValue(edgesAtom);

	const [renderedNodes, setNodes, onNodesChange] = useNodesState(nodes);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState(edges);

	useEffect(() => {
		console.log("nodes changed", nodes);
		setNodes(nodes);
	}, [nodes, setNodes]);

	useEffect(() => {
		console.log("edges changed", edges);
		setEdges(edges);
	}, [edges, setEdges]);

	return (
		<div className="w-screen h-screen">
			<ReactFlow
				nodes={renderedNodes}
				nodeTypes={{
					stacked: StackedNodes,
				}}
				onNodesChange={onNodesChange}
				edges={renderedEdges}
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
