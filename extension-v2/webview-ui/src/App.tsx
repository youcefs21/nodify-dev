import { useEffect } from "react";
import "./reactflow.css";
import { sendToServer } from "./utils/sendToServer";
import {
	BackgroundVariant,
	type Edge,
	SelectionMode,
	useNodesState,
	useEdgesState,
	Handle,
	Position,
	type NodeProps,
} from "@xyflow/react";
import { Background, Controls } from "@xyflow/react";
import { ReactFlow } from "@xyflow/react";
import type { CustomNode, ServerToClientEvents } from "../../src/shared-types";
import { cn } from "./utils/cn";
import { Icon } from "./components/Icon";

// 8px of padding around the whole thing, 8px gaps between nodes
// 32px total added because of padding
// 56px per node + 8px gap so 64px per node
export function StackedNodes({ data }: NodeProps<CustomNode>) {
	return (
		<div className="relative flex flex-col w-full h-full gap-2 p-2 rounded-lg bg-surface-0">
			<div className="flex items-center gap-2 px-2 py-1 rounded-lg h-14">
				<div className={cn("p-2 rounded-lg", "bg-blue [&>*]:stroke-mantle")}>
					<Icon name={"tags"} className="size-5" />
				</div>
				<span className="font-mono text-sm">{data.label}</span>
			</div>

			<div className="flex flex-col gap-2 px-3 py-2">
				{data.children.map((child) => {
					return (
						<div
							key={child.id}
							className="flex items-center gap-2 px-2 py-1 rounded-lg h-14 bg-surface-2"
						>
							<div
								className={cn("p-2 rounded-lg", "bg-blue [&>*]:stroke-mantle")}
							>
								<Icon name={"tags"} className="size-5" />
							</div>
							<span className="font-mono text-sm">{child.label}</span>
						</div>
					);
				})}
			</div>

			{/* <NodeBody body={body} /> */}
		</div>
	);
}

function App() {
	const [renderedNodes, setNodes, onNodesChange] = useNodesState<CustomNode>(
		[],
	);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

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
	}, [setNodes, setEdges]);

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
