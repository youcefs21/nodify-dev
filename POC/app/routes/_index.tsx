import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import "@xyflow/react/dist/style.css";
import {
	type Connection,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
	Controls,
	Background,
	BackgroundVariant,
	type Node,
	type Edge,
	SelectionMode,
	useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import { useLoaderData } from "@remix-run/react";
import { parseStuff } from "~/lib/parser.server";
import { CodeLineNode } from "~/components/CodeLineNode";
import { SummaryNode } from "~/components/SummaryNode";
import type { CustomData, CustomNode } from "~/components/CustomData";

export const meta: MetaFunction = () => {
	return [
		{ title: "New Remix App" },
		{ name: "description", content: "Welcome to Remix!" },
	];
};

export const loader = (r: LoaderFunctionArgs) => {
	return parseStuff();
};

export default function Index() {
	const data = useLoaderData<typeof loader>();
	const nodeTypes = useMemo(
		() => ({ codeLineNode: CodeLineNode, summaryNode: SummaryNode }),
		[],
	);
	const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	useEffect(() => {
		const positionOffsets = {
			x: 300, // Horizontal offset when expanding nested nodes
			y: 100, // Vertical offset between nodes in a sequence
		};

		// Function to expand a node
		const expandNode = (parentNode: CustomNode) => {
			if (parentNode.data.expanded) return; // Avoid re-expanding
			parentNode.data.expanded = true;

			// Find child nodes directly connected to this node
			const childEdges = data.edges.filter(
				(edge) => edge.from === parentNode.id,
			);
			const childNodesData = childEdges.map((edge) =>
				data.nodes.find((node) => node.id === edge.to),
			);

			const newNodes: CustomNode[] = [];
			const newEdges: Edge[] = [];

			childNodesData.forEach((childData, index: number) => {
				if (!childData) return;

				// const isSequence =
				// 	childData.type === "sequence" ||
				// 	childData.type === "while_loop" ||
				// 	childData.type === "if_statement" ||
				// 	childData.type === "for_loop";

				const position = {
					x: parentNode.data.og_pos.x + 0,
					y:
						parentNode.data.og_pos.y +
						index * positionOffsets.y +
						positionOffsets.y,
				};

				const newNode = {
					id: childData.id,
					type: "summaryNode",
					position,
					data: {
						text: childData.title,
						og_pos: position,
						onExpand: expandNode,
						groupId: childData.group_id,
						expanded: false,
						// content: childData.content,
					},
				};

				newNodes.push(newNode);

				const edge = edges.find(
					(e) => e.source === parentNode.id && e.target === childData.id,
				);
				const newEdge: Edge = {
					id: `${parentNode.id}-${childData.id}`,
					source: parentNode.id,
					target: childData.id,
					label: edge?.label || "",
				};

				newEdges.push(newEdge);
			});

			setNodes((prevNodes) => prevNodes.concat(newNodes));
			setEdges((prevEdges) => prevEdges.concat(newEdges));
		};

		// Initialize the root node
		const initializeTree = () => {
			const rootNodeData = data.nodes.find((node) => node.id === "R");
			if (!rootNodeData) return;

			const rootNode: CustomNode = {
				id: rootNodeData.id,
				type: "summaryNode",
				position: { x: 0, y: 0 },
				data: {
					text: rootNodeData.title,
					og_pos: { x: 0, y: 0 },
					onExpand: expandNode,
					groupId: rootNodeData.group_id,
					expanded: false,
					// content: rootNodeData.content,
				},
			};

			setNodes([rootNode]);
			setEdges([]);
		};

		initializeTree();
	}, [data]);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	return (
		<div className="font-sans w-screen h-screen">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				snapToGrid={true}
				fitView
				panOnScroll
				selectionOnDrag
				selectionMode={SelectionMode.Partial}
				nodeTypes={nodeTypes}
				disableKeyboardA11y
				onNodeDrag={(e, node) => {
					const {
						id,
						data: { og_pos, groupId },
					} = node;
					const diffX = og_pos.x - node.position.x;
					const diffY = og_pos.y - node.position.y;
					// console.log(og_pos, node.position);

					setNodes((ns) =>
						ns.map((n) => {
							if (n.data.groupId === groupId && n.id !== id) {
								return {
									...n,
									position: {
										x: n.data.og_pos.x - diffX,
										y: n.data.og_pos.y - diffY,
									},
								};
							}

							return n;
						}),
					);
				}}
			>
				<Controls />
				<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
			</ReactFlow>
		</div>
	);
}
