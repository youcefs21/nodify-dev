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

if (entryNode.children?.[0]) {
	entryNode.children[0].children = testSnake;
}

const nodes = AbstractionLevelOneNodeMapper([entryNode]);
const flattenedNodes = flattenCustomNodes(nodes);
const initialEdges = createEdges(nodes);
console.log(flattenedNodes);
// const myEdges = [
// 	{id: 'e-2--1', source: '-2', target: '-1'},
// 	{id: 'e-1-0', source: '-1', target: '0'},
// 	{id: 'e-1-1', source: '-1', target: '1'},
// 	{id: 'e1-2', source: '1', target: '2'},
// 	{id: 'e1-3', source: '1', target: '3'},
// 	{id: 'e-1-4', source: '-1', target: '4'},
// 	{id: 'e4-5', source: '4', target: '5'},
// 	{id: 'e-1-6', source: '-1', target: '6'},
// ];

const myEdges = [
	{
		id: "e-1-0",
		source: "-1",
		sourceHandle: "0-source",
		target: "1",
		targetHandle: "2-target",
	},
	{
		id: "e0-2",
		source: "1",
		sourceHandle: "2-source",
		targetHandle: "5-target",
		target: "4",
	},
];

export default function App() {
	const [nodes, setNodes, onNodesChange] = useNodesState(flattenedNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(myEdges);

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
			>
				<Controls />
				<MiniMap />
				<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
			</ReactFlow>
		</div>
	);
}
