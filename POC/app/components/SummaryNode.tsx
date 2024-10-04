import { Handle, Position, type Node } from "@xyflow/react";
import type { CustomData, CustomNode } from "./CustomData";

export function SummaryNode(props: Partial<CustomNode>) {
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
				{data.text}
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
