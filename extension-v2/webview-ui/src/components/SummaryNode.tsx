import { type NodeProps, Position, Handle } from "@xyflow/react";
import type { CustomNode } from "../../../src/shared-types";
import { cn } from "../utils/cn";
import {
	ChevronLeft,
	ChevronRight,
	Cpu,
	Loader2,
	RefreshCcw,
} from "lucide-react";
import { Button } from "./ui/Button";
import { highlightedNodeAtom } from "../utils/useNodeNavigation";
import { useAtom, useAtomValue } from "jotai";
import { sendToServer } from "../utils/sendToServer";
import { ErrorBoundary } from "./ErrorBoundary";
import { SafeIconRenderer } from "./ui/SafeIconRenderer";
import { hasItems } from "../utils/errorHandling";

// 8px of padding around the whole thing, 8px gaps between nodes
// 32px total added because of padding
// 56px per node + 8px gap so 64px per node
export function SummaryNode({ data }: NodeProps<CustomNode>) {
	const [highlightedNodeId, setHighlightedNodeId] =
		useAtom(highlightedNodeAtom);

	// Verify data integrity
	if (!data || !data.children) {
		return (
			<div className="flex items-center justify-center w-full h-full p-4 bg-surface-0 rounded-lg">
				<div className="text-red">Invalid node data</div>
			</div>
		);
	}

	const summaryNode = Array.isArray(data.children) && data.children[0];
	if (!summaryNode) {
		return (
			<div className="flex items-center justify-center w-full h-full p-4 bg-surface-0 rounded-lg">
				<div className="text-red">Missing summary node</div>
			</div>
		);
	}

	return (
		<ErrorBoundary>
			<button
				className={cn(
					"relative flex flex-col w-full h-full p-2 gap-2 rounded-lg bg-surface-0",
					highlightedNodeId === summaryNode.id &&
						"outline outline-2 outline-mauve",
				)}
				type="button"
				onClick={(e) => {
					setHighlightedNodeId(summaryNode.id);
					// Remove focus from the button after click to prevent orange outline
					if (e.currentTarget) {
						e.currentTarget.blur();
					}
				}}
				style={{ cursor: "pointer" }}
			>
				<div className="flex items-center gap-2 px-2 py-1 rounded-lg h-14 relative w-full">
					{data.parentId !== "root" && (
						<Handle
							type="target"
							position={Position.Left}
							id={data.id}
							style={{
								left: -8,
							}}
						/>
					)}
					<SafeIconRenderer type={data.type} />

					<span className="font-mono text-sm truncate">
						{data.label || "Unnamed Node"}
					</span>
				</div>
				<div className="w-full text-left grid grid-cols-8 justify-between h-36">
					<span className="font-mono text-sm whitespace-pre-wrap col-span-7 truncate">
						{summaryNode.label || "No content"}
					</span>
					{hasItems(summaryNode.children) ? (
						<Button
							variant="outline"
							size="icon"
							className="aspect-square ml-auto mt-[1.6rem]"
							onClick={(e) => {
								e.stopPropagation();
								sendToServer({
									type: "node-toggle",
									nodeId: summaryNode.id,
								});
							}}
						>
							{!summaryNode.expanded ? (
								<ChevronLeft className="w-4 h-4 stroke-text" />
							) : (
								<ChevronRight className="w-4 h-4 stroke-text" />
							)}
						</Button>
					) : summaryNode.refID ? (
						<Button
							variant="outline"
							size="icon"
							className="aspect-square ml-auto mt-[1.6rem]"
							disabled
						>
							<Loader2 className="size-3 animate-spin" />
						</Button>
					) : null}

					{hasItems(summaryNode.children) && (
						<Handle
							type="source"
							position={Position.Right}
							id={`${data.id}-${summaryNode.id}`}
						/>
					)}
				</div>
			</button>
		</ErrorBoundary>
	);
}
