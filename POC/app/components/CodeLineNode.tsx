import { Handle, Position } from "@xyflow/react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/cjs/styles/hljs";
import type { CustomNode } from "./CustomData";

export function CodeLineNode(props: Partial<CustomNode>) {
	if (!props.data) return null;
	const data = props.data;
	return (
		<>
			<button
				className="bg-white border text-xs w-full text-left rounded p-2 h-16 font-mono"
				type="button"
				onClick={(x) => {
					console.log("click!", x.metaKey);
					if (x.metaKey) {
						data.onExpand(props as CustomNode);
					}
				}}
			>
				<SyntaxHighlighter
					language="markdown"
					style={docco}
					customStyle={{ overflow: "clip" }}
				>
					{data.text}
				</SyntaxHighlighter>
			</button>
			<Handle
				type="target"
				position={Position.Left}
				id="a"
				className="!bg-transparent"
			/>
			<Handle
				type="source"
				position={Position.Right}
				id="b"
				className="!bg-transparent"
			/>
		</>
	);
}
