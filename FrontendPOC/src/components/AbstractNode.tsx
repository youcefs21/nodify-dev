import { Handle, Position } from "@xyflow/react";
import {
	ChevronLeft,
	ChevronRight,
	XIcon,
	type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import type { CustomData } from "./nodes.schema";

interface EdgeButtonProps {
	direction: "left" | "right";
	index: number;
	id: string;
	active?: boolean | undefined;
	disabled?: boolean | undefined;
}

export function EdgeButton({ direction, active, disabled }: EdgeButtonProps) {
	// if direction is left, swap the index
	return (
		<button
			className="w-[10px] border border-border bg-white flex items-center justify-center"
			type="button"
			disabled={disabled}
		>
			{active === false ? (
				<XIcon className="w-5 h-5 text-red-500 stroke-2" />
			) : direction === "left" ? (
				<ChevronLeft className="w-4 h-4" />
			) : (
				<ChevronRight className="w-4 h-4" />
			)}
		</button>
	);
}

interface NodeProps {
	data: CustomData;
	Icon: LucideIcon;
	className: string;
	children?: JSX.Element;
	totalWidth?: number;
}

export function AbstractNode({
	data: { label, id, active, disabled, reversed: reverse },
	Icon,
	className,
	children,
	totalWidth = 260,
}: NodeProps) {
	return (
		<div className="bg-white font-mono text-xs">
			<div
				className={cn(
					"flex w-fit relative rounded-none outline outline-1",
					reverse ? "flex-row-reverse" : "",
				)}
			>
				<Handle
					type="target"
					position={reverse ? Position.Right : Position.Left}
					style={{
						background: "none",
						borderRadius: 0,
						borderWidth: 0,
						left: 10,
					}}
				/>
				<EdgeButton
					direction={reverse ? "left" : "right"}
					index={0}
					id={id}
					disabled={true}
				/>
				<div className="w-10 h-[39px] border bg-white flex items-center justify-center">
					<div
						className={cn(
							"rounded  w-[30px] h-[30px] flex items-center justify-center p-1",
							className,
						)}
					>
						<Icon className="text-white" />
					</div>
				</div>

				<EdgeButton
					direction={reverse ? "left" : "right"}
					index={1}
					id={id}
					active={active}
					disabled={disabled}
				/>
				<Handle
					type="source"
					position={reverse ? Position.Left : Position.Right}
					id="a"
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
