import { Handle, Position } from "@xyflow/react";
import {
	ChevronLeft,
	ChevronRight,
	Minus,
	type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import type { CustomData } from "./nodes.schema";
import { astExpandedAtom } from "../data/nodesAtom";
import { useAtom } from "jotai";
import { useMemo } from "react";

interface EdgeButtonProps {
	direction: "left" | "right";
	index: number;
	id: string;
	hasChildren: boolean;
	disabled?: boolean | undefined;
}

export function EdgeButton({ direction, id, hasChildren }: EdgeButtonProps) {
	const [expanded, setExpanded] = useAtom(astExpandedAtom);
	const realDirection = useMemo(() => {
		const isExpanded = expanded.get(id);
		if (direction === "left") {
			return isExpanded ? "right" : "left";
		}
		return isExpanded ? "left" : "right";
	}, [expanded, id, direction]);
	// if direction is left, swap the index
	return (
		<button
			className="w-[20px] border border-border bg-white flex items-center justify-center"
			type="button"
			disabled={!hasChildren}
			onClick={() => {
				setExpanded((expanded) => expanded.set(id, !expanded.get(id)));
			}}
		>
			{hasChildren === false ? (
				<Minus className="w-4 h-4 rotate-90 text-gray-400" />
			) : realDirection === "left" ? (
				<ChevronLeft className="w-4 h-4 stroke-black" />
			) : (
				<ChevronRight className="w-4 h-4 stroke-black" />
			)}
		</button>
	);
}

interface NodeProps {
	data: CustomData;
	Icon: LucideIcon;
	className: string;
	children?: JSX.Element;
}

export function AbstractNode({
	data: { label, id, hasChildren, disabled, reversed: reverse },
	Icon,
	className,
	children,
}: NodeProps) {
	return (
		<div className="bg-white font-mono text-xs flex-1 max-h-[40px] min-h-[40px] max-w-[260px]">
			<div
				className={cn(
					"flex w-full relative rounded-none outline outline-1",
					reverse ? "flex-row-reverse" : "",
				)}
			>
				<Handle
					type="target"
					position={reverse ? Position.Right : Position.Left}
					id={`${id}-target`}
					style={{
						background: "none",
						borderRadius: 0,
						borderWidth: 0,
						left: 10,
					}}
					isConnectable={false}
				/>
				{/* <EdgeButton
					direction={reverse ? "left" : "right"}
					index={0}
					id={id}
					disabled={true}
				/> */}
				<div className="w-10 h-[40px] p-1 border bg-white flex items-center justify-center">
					<div
						className={cn(
							"rounded  w-[30px] h-[30px] flex items-center justify-center p-1",
							className,
						)}
					>
						<Icon className="text-white" />
					</div>
				</div>
				<div className="h-[40px] w-full border bg-white flex items-center justify-center p-2">
					{label}
				</div>

				<EdgeButton
					direction={reverse ? "left" : "right"}
					index={1}
					id={id}
					disabled={disabled}
					hasChildren={hasChildren}
				/>
				<Handle
					type="source"
					position={reverse ? Position.Left : Position.Right}
					id={`${id}-source`}
					isConnectable={false}
					style={{
						background: "none",
						borderRadius: 0,
						borderWidth: 0,
						right: 10,
					}}
				/>
			</div>
			{children ? <div className="outline outline-1">{children}</div> : null}
		</div>
	);
}
