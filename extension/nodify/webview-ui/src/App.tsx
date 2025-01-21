import { useEffect } from "react";
import {
	ReactFlow,
	Controls,
	Background,
	BackgroundVariant,
	SelectionMode,
	useEdgesState,
	useNodesState,
	type Edge,
} from "@xyflow/react";

import "./reactflow.css";
import { StackedNodes } from "./components/StackedNodes";
import type { CustomNode, ServerToClientEvents } from "@nodify/schema";
import { sendToServer } from "./utils/sendToServer";

function App() {
	const [renderedNodes, setNodes, onNodesChange] = useNodesState<CustomNode>(
		[],
	);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	useEffect(() => {
		// Handle messages from the extension
		const abortController = new AbortController();
		window.addEventListener(
			"message",
			(event) => {
				const message = event.data as ServerToClientEvents;
				if (message.type === "nodes") {
					setNodes(message.value);
				} else if (message.type === "edges") {
					setEdges(message.value);
				}
			},
			{ signal: abortController.signal },
		);

		// Cleanup
		return () => {
			abortController.abort();
		};
	}, [setNodes, setEdges]);

	// TODO: send all click events to the extension, including node expansion/collapse. Maybe even node hovers?
	// will be used to highlight code in the editor.
	const handleClick = () => {
		// Send a message to the extension
		sendToServer({
			type: "hello",
			value: "Hello from React!",
		});
	};

	return (
		<div className="flex flex-1 w-[calc(100vw-3rem)] h-screen overflow-hidden">
			<button
				className="absolute z-40 p-2 text-white bg-black top-20 left-20"
				type="button"
				onClick={handleClick}
			>
				Click me
			</button>
			<div className="flex-grow">
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
					panOnScroll
					selectionOnDrag
					panOnDrag={false}
					selectionMode={SelectionMode.Partial}
				>
					<Controls />
					<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
				</ReactFlow>
			</div>
		</div>
	);
}

export default App;
