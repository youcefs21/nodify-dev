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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { handleError } from "./utils/errorHandling";
import { ExportButtons } from "./components/ExportButtons";

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
				try {
					const message = JSON.parse(event.data) as ServerToClientEvents;

					if (message.type === "nodes") {
						// Validate nodes before setting them
						if (!Array.isArray(message.value)) {
							console.error("Received invalid nodes data:", message.value);
							return;
						}

						// Filter out any invalid nodes
						const validNodes = message.value.filter(
							(node) =>
								node &&
								typeof node === "object" &&
								node.id &&
								node.data &&
								typeof node.data === "object",
						);

						setNodes(validNodes);
						console.log("nodes", validNodes);
					} else if (message.type === "edges") {
						// Validate edges before setting them
						if (!Array.isArray(message.value)) {
							console.error("Received invalid edges data:", message.value);
							return;
						}

						// Filter out any invalid edges
						const validEdges = message.value.filter(
							(edge) =>
								edge &&
								typeof edge === "object" &&
								edge.id &&
								edge.source &&
								edge.target,
						);

						setEdges(validEdges);
						console.log("edges", validEdges);
					} else if (message.type === "base-url") {
						if (typeof message.value !== "string") {
							console.error("Received invalid base-url:", message.value);
							return;
						}
						setBaseUrl(message.value);
						console.log("base-url", message.value);
					}
				} catch (error) {
					handleError(error, "Error processing message from extension");
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
				<ErrorBoundary
					fallback={
						<div className="flex items-center justify-center w-full h-full">
							<div className="p-4 border rounded shadow-lg bg-surface-0">
								<h2 className="text-lg font-semibold mb-2">
									Something went wrong
								</h2>
								<p>
									The visualization encountered an error. Please try refreshing.
								</p>
							</div>
						</div>
					}
				>
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
						connectionLineStyle={{ stroke: "#ffff" }}
						minZoom={0}
					>
						<Controls />
						<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
						<ExportButtons />
					</ReactFlow>
				</ErrorBoundary>
			</div>
		</div>
	);
}

export default App;
