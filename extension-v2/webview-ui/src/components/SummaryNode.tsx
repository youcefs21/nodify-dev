import { type NodeProps, Position, Handle } from "@xyflow/react";
import type { CustomNode } from "../../../src/shared-types";
import { cn } from "../utils/cn";
import { TypeIconMap } from "./ui/Icon";
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

// 8px of padding around the whole thing, 8px gaps between nodes
// 32px total added because of padding
// 56px per node + 8px gap so 64px per node
export function SummaryNode({ data }: NodeProps<CustomNode>) {
	const CustomIcon = TypeIconMap[data.type as keyof typeof TypeIconMap];
	const [highlightedNodeId, setHighlightedNodeId] =
		useAtom(highlightedNodeAtom);

	return (
		<div className="relative flex flex-col w-full h-full gap-2 p-2 rounded-lg bg-surface-0">
			<div className="flex items-center gap-2 px-2 py-1 rounded-lg h-14 relative">
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
				{CustomIcon ? (
					<CustomIcon />
				) : (
					<div className={cn("p-2 rounded-lg", "bg-blue [&>*]:stroke-mantle")}>
						<Cpu className="size-5" />
					</div>
				)}

				<span className="font-mono text-sm">{data.label}</span>
				{(data.refID || data.parentId === "root") && (
					<Button
						variant="outline"
						size="icon"
						className="p-1 h-fit w-fit ml-auto mb-auto"
					>
						<RefreshCcw className="size-3" />
					</Button>
				)}
			</div>

			<div className="flex flex-col gap-2 px-3 py-2">
				{data.children.map((child) => {
					const CustomChildIcon =
						TypeIconMap[child.type as keyof typeof TypeIconMap];
					return (
						<button
							key={child.id}
							type="button"
							className={cn(
								"w-full text-left grid grid-cols-6 justify-between items-center px-2 py-1 rounded-lg h-14 bg-surface-2 relative",
								highlightedNodeId === child.id &&
									"outline outline-2 outline-mauve",
								"focus:outline-none focus-visible:outline-2 focus-visible:outline-blue",
							)}
							onClick={(e) => {
								setHighlightedNodeId(child.id);
								// Remove focus from the button after click to prevent orange outline
								if (e.currentTarget) {
									e.currentTarget.blur();
								}
							}}
							style={{ cursor: "pointer" }}
						>
							{child.children.length > 0 && (
								<Handle
									type="source"
									position={Position.Right}
									style={{
										right: -16,
									}}
									id={`${data.id}-${child.id}`}
								/>
							)}
							<div className="flex items-center gap-2 col-span-5">
								{CustomChildIcon ? (
									<CustomChildIcon />
								) : (
									<div
										className={cn(
											"p-2 rounded-lg",
											"bg-blue [&>*]:stroke-mantle",
										)}
									>
										<Cpu className="size-5" />
									</div>
								)}
								<span className="font-mono text-sm">{child.label}</span>
							</div>
							{child.children.length > 0 ? (
								<Button
									variant="outline"
									size="icon"
									className="aspect-square ml-auto"
									onClick={(e) => {
										e.stopPropagation();
										sendToServer({
											type: "node-toggle",
											nodeId: child.id,
										});
									}}
								>
									{!child.expanded ? (
										<ChevronLeft className="w-4 h-4 stroke-text" />
									) : (
										<ChevronRight className="w-4 h-4 stroke-text" />
									)}
								</Button>
							) : child.refID ? (
								<Button
									variant="outline"
									size="icon"
									className="aspect-square ml-auto"
									disabled
								>
									<Loader2 className="size-3 animate-spin" />
								</Button>
							) : null}
						</button>
					);
				})}
			</div>
		</div>
	);
}
