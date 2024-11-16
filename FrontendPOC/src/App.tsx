import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import type { CustomNode, output } from "./components/nodes.schema";
import { AbstractionLevelOneNodeMapper } from "./functions/NodeCreater";
import { StackedNodes } from "./components/StackedNodes";
import { children } from "effect/Fiber";
// import { abstractSnake, testSnake } from "./data/snake";



const abstractSnake: output[] = [
	{
		groupID: 0,
		label: "dummy",
		idRange: [0, 999],
		type: "entry",
		children: [
			{
			groupID: 1,
			label: "entry",
			idRange: [0, 999],
			type: "entry",
			children: [
			{
				groupID: 2,
				label: "Level 1 Child 1",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 3,
				label: "Level 1 Child 2",
				idRange: [11, 20],
				type: "function_call",
				children: [
					{
						groupID: 4,
						label: "Level 3 Child 1",
						idRange: [11, 20],
						type: "expression",
					},
					{
						groupID: 5,
						label: "Level 3 Child 2",
						idRange: [11, 20],
						type: "function_call",
					},
				],
			},
			{
				groupID: 6,
				label: "Level 2 Child 3",
				idRange: [11, 20],
				type: "expression",
			},
			{
				groupID: 7,
				label: "Level 2 Child 4",
				idRange: [11, 20],
				type: "function_call",
			},
		],
	},
]}
];


function flattenCustomNodes(nodes: CustomNode[]): CustomNode[] {
	const flattened: CustomNode[] = [];
  
	function flattenNode(node: CustomNode, depth: number) {
	  node.id = node.data.id; // Ensure the node ID is set to its groupID
	  node.position = { x: 300 * depth, y: 50 * flattened.length }; // Adjust position based on depth and index to avoid overlap
	  flattened.push(node);
	  for (const childData of node.data.children) {
		const childNode: CustomNode = {
		  ...node,
		  id: childData.id, // Set the child node ID to its groupID
		  data: childData,
		};
		flattenNode(childNode, depth + 1);
	  }
	}
  
	for (const node of nodes) {
	  flattenNode(node, 1);
	}
  
	return flattened;
  }
  
  // Usage
  const nodes = AbstractionLevelOneNodeMapper(abstractSnake);
  const flattenedNodes = flattenCustomNodes(nodes);
  console.log(flattenedNodes);

const initialNodes = AbstractionLevelOneNodeMapper(abstractSnake);
// console.log(initialNodes);

// const myNodes: CustomNode[] = [
// 	{
// 		id: "1",
// 		data: {
// 			id: "1",
// 			label: "Entry Node",
// 			idRange: [1, 10],
// 			children: [
// 				{
// 					id: "1",
// 					data: {
// 						id: "1",
// 						label: "Entry Node",
// 						idRange: [1, 10],
// 						children: [],
// 						reversed: false,
// 						active: true,
// 						disabled: false,
// 						type: "expression",
// 					},
// 					position: { x: 0, y: 0 },
// 					type: "stacked",
// 				},
// 			],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 			type: "entry",},
		
// 		position: { x: 0, y: 0 },
// 		type: "stacked",
// 	},
// 	{
// 		id: "2",
// 		data: {
// 			id: "2",
// 			label: "Function Node",
// 			idRange: [11, 20],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 			type: "function",
// 		},
		
// 		position: { x: 100, y: 100 },
// 		type: "stacked",
// 	},
// 	{
// 		id: "3",
// 		data: {
// 			id: "3",
// 			label: "Condition Node",
// 			idRange: [21, 30],
// 			children: [],
// 			reversed: false,
// 			active: true,
// 			disabled: false,
// 			type: "condition",
// 		},
// 		position: { x: 200, y: 200 },
// 		type: "stacked",
// 	},
// ] 


// const initialEdges = [
// 	{ id: "e1-2", source: "1", target: "2" },
// 	{ id: "e2-3", source: "2", target: "3" },
// 	{ id: "e3-4", source: "3", target: "4" },
// 	{ id: "e4-5", source: "4", target: "5" }];

export default function App() {
	const [nodes, setNodes, onNodesChange] = useNodesState(flattenedNodes);
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
