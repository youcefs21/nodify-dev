import {
	ReactFlow,
	MiniMap,
	Controls,
	Background,
	useNodesState,
	BackgroundVariant,
	useEdgesState,
	SelectionMode,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { StackedNodes } from "./components/StackedNodes";
import { useAtomValue } from "jotai";
import { edgesAtom, nodesAtom } from "./data/nodesAtom";
import { useEffect } from "react";
import { rawSnake } from "./data/snake";

function RawCode({ code }: { code: typeof rawSnake }) {
	return (
		<>
			{code.map((node) => {
				const text = node.text.replace(/<(\w+)_body\/>/, "");
				return (
					<div key={node.id} className="px-1 font-mono whitespace-pre">
						{text}
						{node.children && (
							<div className="pl-4">
								<RawCode code={node.children} />
							</div>
						)}
					</div>
				);
			})}
		</>
	);
}

export default function App() {
	const nodes = useAtomValue(nodesAtom);
	const edges = useAtomValue(edgesAtom);

	const [renderedNodes, setNodes, onNodesChange] = useNodesState(nodes);
	const [renderedEdges, setEdges, onEdgesChange] = useEdgesState(edges);

	useEffect(() => {
		console.log("nodes changed", nodes);
		setNodes(nodes);
	}, [nodes, setNodes]);

	useEffect(() => {
		console.log("edges changed", edges);
		setEdges(edges);
	}, [edges, setEdges]);

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
			<div className="outline outline-1 w-96">
				<div className="grid grid-cols-4 border text-center outline-1 outline">
					<div className="border-r border-black col-span-3 p-2 font-mono">
						src/data/snake.ts
					</div>
					<div className="p-2 font-mono">Level 0</div>
				</div>
				<div className="p-2 overflow-auto max-h-[calc(100vh-39px)] text-xs">
					<RawCode code={rawSnake} />
				</div>
			</div>
		</div>
	);
}
