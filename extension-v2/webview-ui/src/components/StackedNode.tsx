import { type NodeProps, Position, Handle } from "@xyflow/react";
import type { CustomNode } from "../../../src/shared-types";
import { cn } from "../utils/cn";
import { TypeIconMap } from "./Icon";
import { Cpu, Tags } from "lucide-react";

// 8px of padding around the whole thing, 8px gaps between nodes
// 32px total added because of padding
// 56px per node + 8px gap so 64px per node
export function StackedNodes({ data }: NodeProps<CustomNode>) {
	const CustomIcon = TypeIconMap[data.type as keyof typeof TypeIconMap];
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
			</div>

			<div className="flex flex-col gap-2 px-3 py-2">
				{data.children.map((child) => {
					const CustomChildIcon =
						TypeIconMap[child.type as keyof typeof TypeIconMap];
					return (
						<div
							key={child.id}
							className="flex items-center gap-2 px-2 py-1 rounded-lg h-14 bg-surface-2 relative"
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
					);
				})}
			</div>
		</div>
	);
}
