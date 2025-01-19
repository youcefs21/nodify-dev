import { useState, useEffect } from "react";
import { vscode } from "./utilities/vscode";
import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	BackgroundVariant,
	SelectionMode,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { StackedNodes } from "./components/StackedNodes";

function App() {
	// TODO: type safety this
	const [flows, setFlows] = useState<any>(null);
	const [renderedNodes, setNodes, onNodesChange] = useNodesState([]);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState([]);

	useEffect(() => {
		// Handle messages from the extension
		const messageHandler = (event: MessageEvent) => {
			const message = event.data; // TODO: type safety this
			if (message.type === "flows") {
				setFlows(message.value);
			}
		};

		window.addEventListener("message", messageHandler);

		// Cleanup
		return () => {
			window.removeEventListener("message", messageHandler);
		};
	}, []);

	// TODO: send all click events to the extension, including node expansion/collapse. Maybe even node hovers?
	// will be used to highlight code in the editor.
	const handleClick = () => {
		// Send a message to the extension
		vscode.postMessage({
			type: "hello",
			value: "Hello from React!",
		});
	};

	// TODO: migrate reactflow stuff here.
	// TODO: match theming to vscode
	// https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content
	return (
		<div className="w-screen h-screen flex flex-1 overflow-hidden">
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
					<MiniMap />
					<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
				</ReactFlow>
			</div>
		</div>
	);
}

export default App;
