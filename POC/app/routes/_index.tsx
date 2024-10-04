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
		// const functions = data.nodes.filter((x) => x.type === "function");
		// const other = data.nodes.filter((x) => x.type !== "function");

		const expandTree = (parent: CustomNode) => {
			const newEdges = data.edges.filter((x) => x.from === parent.id);

			const newNodes = newEdges.flatMap((edge, groupIndex) => {
				const children = data.nodes.filter((x) => x.id === edge.to);
				console.log("children!", children);

				const pos = (i: number) => ({
					x: parent.data.og_pos.x + 700,
					y: 65 * (groupIndex * 2 + groupIndex) * (i + 1),
				});

				return children.map((x, i) => ({
					data: {
						text: x.title,
						og_pos: pos(i),
						onExpand: expandTree,
						groupId: parent.id + groupIndex,
					},
					type: "summaryNode",
					width: 350,
					id: x.id,
					position: pos(i),
				}));
			});

			setNodes((x) => [...x, ...newNodes]);

			// now for the edges!
			setEdges(
				newEdges.map(({ from, to, label }) => ({
					id: `${from}-${to}`,
					source: from,
					target: to,
					label,
				})),
			);
		};

		const expandFromRoot = (root: CustomNode) => {
			// what if I make the root a group?
			console.log("expanded root!");
			// find the edge coming out of root
			// expand that group.
			const edge = data.edges.find((x) => x.from === root.id);
			if (!edge) return;
			const rootChildren = data.nodes.filter((x) => x.group_id === edge.to);

			const rootGroup = rootChildren.map((x, i) => ({
				data: {
					text: x.title,
					og_pos: { x: 0, y: 65 * (i + 1) },
					onExpand: expandTree,
					groupId: root.id,
				},
				type: "summaryNode",
				width: 350,
				id: x.id,
				position: { x: 0, y: 65 * (i + 1) },
			}));

			setNodes((ns) => [...ns, ...rootGroup]);
		};

		const root = data.nodes.find((x) => x.id === "R");
		if (!root) return;

		setNodes(() => [
			{
				data: {
					text: root.title,
					og_pos: { x: 0, y: 0 },
					groupId: "N/A",
					onExpand: expandFromRoot,
				},
				type: "summaryNode",
				width: 350,
				id: root.id,
				position: { x: 0, y: 0 },
			},
		]);
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
