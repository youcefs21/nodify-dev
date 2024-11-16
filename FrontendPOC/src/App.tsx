import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import type { output } from "./components/nodes.schema";
import { AbstractionLevelOneNodeMapper } from "./functions/NodeCreater";
import { StackedNodes } from "./components/StackedNodes";
// import { abstractSnake, testSnake } from "./data/snake";

// const initialNodes = [
// 	{
// 		id: "1",
// 		position: { x: 0, y: 0 },
// 		data: {
// 			label: "Entry",
// 			id: "1",
// 			idRange: [1, 1],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 		},
// 		type: "entry",
// 	},{
// 		id: "2",
// 		position: { x: 100, y: 0 },
// 		data: {
// 			label: "Function",
// 			id: "1",
// 			idRange: [1, 1],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 		},
// 		type: "function",
// 	},
// 	{
// 		id: "3",
// 		position: { x: 300, y: 0 },
// 		data: {
// 			label: "Expression",
// 			id: "1",
// 			idRange: [1, 1],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 		},
// 		type: "expression",
// 	},{
// 		id: "4",
// 		position: { x: 500, y: 0 },
// 		data: {
// 			label: "Event",
// 			id: "1",
// 			idRange: [1, 1],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 		},
// 		type: "event",
// 	},{
// 		id: "5",
// 		position: { x: 700, y: 0 },
// 		data: {
// 			label: "Loop",
// 			id: "1",
// 			idRange: [1, 1],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 		},
// 		type: "loop",
// 	},
// ] satisfies CustomNode[];

const abstractSnake: output[] = [
	{
		groupID: 1,
		label: "entry",
		idRange: [0, 999],
		type: "entry",
		children: [
			{
				groupID: 1,
				label: "Child Label",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 2,
				label: "Child Label",
				idRange: [11, 20],
				type: "function_call",
				children: [
					{
						groupID: 3,
						label: "Child Label",
						idRange: [11, 20],
						type: "expression",
					},
					{
						groupID: 4,
						label: "Child Label",
						idRange: [11, 20],
						type: "function_call",
					},
				],
			},
			{
				groupID: 3,
				label: "Child Label",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 4,
				label: "Child Label",
				idRange: [11, 20],
				type: "function_call",
			},
		],
	},
	{
		groupID: 2,
		label: "Child Label",
		idRange: [11, 20],
		type: "function_call",
		children: [
			{
				groupID: 3,
				label: "Child Label",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 4,
				label: "Child Label",
				idRange: [11, 20],
				type: "function_call",
			},
		],
	},
];

const initialNodes = AbstractionLevelOneNodeMapper(abstractSnake);
// const initialEdges = [
// 	{ id: "e1-2", source: "1", target: "2" },
// 	{ id: "e2-3", source: "2", target: "3" },
// 	{ id: "e3-4", source: "3", target: "4" },
// 	{ id: "e4-5", source: "4", target: "5" }];

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
				nodeTypes={{
					stacked: StackedNodes,
				}}
				onNodesChange={onNodesChange}
				// edges={edges}
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
