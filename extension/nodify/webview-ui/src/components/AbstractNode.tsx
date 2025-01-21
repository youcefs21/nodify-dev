import { Handle, Position } from "@xyflow/react";
import {
	ChevronLeft,
	ChevronRight,
	Minus,
	type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { astExpandedAtom } from "../data/nodesAtom";
import { useAtom } from "jotai";
import { useMemo } from "react";
import type { CustomData } from "@nodify/schema";
import type dynamicIconImports from "lucide-react/dynamicIconImports";
import { Icon } from "./Icon";

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
			return isExpanded ? "left" : "right";
		}
		return isExpanded ? "right" : "left";
	}, [expanded, id, direction]);
	// if direction is left, swap the index
	return (
		<button
			className="w-[20px] box-border border border-border bg-white flex items-center justify-center"
			type="button"
			disabled={!hasChildren}
			onClick={() => {
				setExpanded((expanded) => expanded.set(id, !expanded.get(id)));
			}}
		>
			{hasChildren === false ? (
				<Minus className="w-4 h-4 text-gray-400 rotate-90" />
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
	iconName: keyof typeof dynamicIconImports;
	iconBackgroundColor: string;
	children?: JSX.Element;
}

export function AbstractNode({
	data: { label, id, hasChildren, disabled, reversed: reverse },
	iconName,
	iconBackgroundColor,
}: NodeProps) {
	return (
		<div
			className={cn(
				"bg-white font-mono text-xs flex-1 max-h-[40px] min-h-[40px] max-w-[260px]",
				"flex w-full relative rounded-none box-border border-x border-b border-black",
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
			<div className="w-10 h-[40px] p-1 flex items-center justify-center">
				<div
					className={cn(
						"rounded  w-[30px] h-[30px] flex items-center justify-center p-1",
					)}
					style={{ backgroundColor: iconBackgroundColor }}
				>
					<Icon name={iconName} className="text-white" />
				</div>
			</div>
			<div className="h-[40px] w-full flex items-center justify-center p-2">
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
	);
}
