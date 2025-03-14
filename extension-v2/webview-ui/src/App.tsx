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

	useEffect(() => {
		sendToServer({
			type: "on-render",
		});

		// Handle messages from the extension
		const abortController = new AbortController();
		window.addEventListener(
			"message",
			(event) => {
				const message = JSON.parse(event.data) as ServerToClientEvents;
				if (message.type === "nodes") {
					setNodes(message.value);
					console.log("nodes", JSON.stringify(message.value[0].data));
					// if view port is 0,0, put the node which has the "root" as it's parent at the center of the screen
					if (viewport.x === 0 && viewport.y === 0) {
						const rootNode = message.value.find(
							(node) => node.data.parentId === "root",
						);
						if (rootNode) {
							reactFlow.fitView({
								nodes: [rootNode],
								maxZoom: 1.5,
							});
						}
					}
				} else if (message.type === "edges") {
					setEdges(message.value);
					console.log("edges", message.value);
				}
			},
			{ signal: abortController.signal },
		);

		// Cleanup
		return () => {
			abortController.abort();
		};
	}, [setNodes, setEdges, reactFlow, viewport]);

	return (
		<div className="flex flex-1 w-[calc(100vw-3rem)] h-screen overflow-hidden mocha">
			<div className="flex-grow">
				<ReactFlow
					nodes={renderedNodes}
					nodeTypes={{
						stacked: StackedNodes,
					}}
					onNodesChange={onNodesChange}
					edges={renderedEdges}
					viewport={viewport}
					onViewportChange={setViewport}
					onEdgesChange={onEdgesChange}
					snapToGrid={true}
					snapGrid={[10, 10]}
				>
					<Controls />
					<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
				</ReactFlow>
			</div>
		</div>
	);
}

export default App;
