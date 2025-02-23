import { useEffect, useState } from "react";
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
import type { CustomNode, ServerToClientEvents } from "../../src/types";
import { sendToServer } from "./utils/sendToServer";
import type * as vscode from "vscode";
import type { AstLocation } from "../../src/vsc-commands/analyze-document";

function App() {
	const [renderedNodes, setNodes, onNodesChange] = useNodesState<CustomNode>(
		[],
	);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [cursorPositionState, setCursorPosition] =
		useState<vscode.Position | null>(null);
	const [astLocations, setAstLocations] = useState<AstLocation[]>([]);

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
					console.log("nodes", message.value);
				} else if (message.type === "edges") {
					setEdges(message.value);
					console.log("edges", message.value);
				} else if (message.type === "cursor-position") {
					setCursorPosition(message.value);
					console.log("cursor_position", message.value);
				} else if (message.type === "ast_locations") {
					setAstLocations(message.value);
					console.log("ast_locations", message.value);
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

	return (
		<div className="flex flex-1 w-[calc(100vw-3rem)] h-screen overflow-hidden mocha">
			<div className="flex-grow">
				<ReactFlow
					nodes={renderedNodes.map((node) => ({
						...node,
						// Only add cursor position to nodes at the last second
						data: { ...node.data, cursorPosition: cursorPositionState },
					}))}
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
