import { useEffect, useState } from "react";
import "./reactflow.css";
import { sendToServer } from "./utils/sendToServer";
import {
	BackgroundVariant,
	type Edge,
	SelectionMode,
	useNodesState,
	useEdgesState,
	type Viewport,
	useReactFlow,
} from "@xyflow/react";
import { Background, Controls } from "@xyflow/react";
import { ReactFlow } from "@xyflow/react";
import type { CustomNode, ServerToClientEvents } from "../../src/shared-types";
import { StackedNodes } from "./components/StackedNode";
import { useNodeNavigation } from "./utils/useNodeNavigation";
import { LoadingScreen } from "./components/LoadingScreen";
import { SummaryNode } from "./components/SummaryNode";

function App() {
	const [renderedNodes, setNodes, onNodesChange] = useNodesState<CustomNode>(
		[],
	);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [viewport, setViewport] = useState<Viewport>({
		x: 0,
		y: 0,
		zoom: 1,
	});
	const reactFlow = useReactFlow();
	const [baseUrl, setBaseUrl] = useState<string | null>(null);

	// Use our custom hook for node navigation
	const { setHighlightedNodeId } = useNodeNavigation(
		renderedNodes.map((a) => a.data),
	);

	// Send initial render message to server
	useEffect(() => {
		sendToServer({
			type: "on-render",
		});
	}, []);

	// Handle messages from the extension
	useEffect(() => {
		const abortController = new AbortController();

		window.addEventListener(
			"message",
			(event) => {
				const message = JSON.parse(event.data) as ServerToClientEvents;
				if (message.type === "nodes") {
					setNodes(message.value);
					console.log("nodes", message.value);
				} else if (message.type === "edges") {
					setEdges(message.value);
					console.log("edges", message.value);
				} else if (message.type === "base-url") {
					setBaseUrl(message.value);
					console.log("base-url", message.value);
				}
			},
			{ signal: abortController.signal },
		);

		return () => {
			abortController.abort();
		};
	}, [setNodes, setEdges]);

	// Handle viewport and node highlighting
	useEffect(() => {
		if (renderedNodes.length === 0) return;

		// If viewport is at initial position, center on root node
		if (viewport.x === 0 && viewport.y === 0) {
			const rootNode = renderedNodes.find(
				(node) => node.data.parentId === "root",
			);

			if (rootNode) {
				reactFlow.fitView({
					nodes: [rootNode],
					maxZoom: 1.5,
				});

				// Highlight the root node's first child
				setHighlightedNodeId(rootNode.data.children[0].id);
			}
		}
	}, [renderedNodes, viewport, reactFlow, setHighlightedNodeId]);

	if (renderedNodes.length === 0) {
		return <LoadingScreen baseUrl={baseUrl ?? ""} />;
	}

	return (
		<div className="flex flex-1 w-[calc(100vw-3rem)] h-screen overflow-hidden mocha">
			<div className="flex-grow">
				<ReactFlow
					nodes={renderedNodes}
					nodeTypes={{
						stacked: StackedNodes,
						summary: SummaryNode,
					}}
					onNodesChange={onNodesChange}
					edges={renderedEdges}
					viewport={viewport}
					onViewportChange={setViewport}
					onEdgesChange={onEdgesChange}
					nodesDraggable={false}
					nodesConnectable={false}
					edgesFocusable={false}
				>
					<Controls />
					<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
				</ReactFlow>
			</div>
		</div>
	);
}

export default App;
