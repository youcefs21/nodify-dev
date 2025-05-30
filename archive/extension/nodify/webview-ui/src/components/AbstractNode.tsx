import { Handle, Position } from "@xyflow/react";
import {
	ChevronLeft,
	ChevronRight,
	Minus,
	type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useMemo } from "react";
import type { CustomData, CustomNode } from "../../../src/types";
import type dynamicIconImports from "lucide-react/dynamicIconImports";
import { Icon } from "./Icon";
import { sendToServer } from "../utils/sendToServer";
import { astLocationsAtom, cursorPositionAtom } from "../atoms/cursorAtoms";
import { useAtom } from "jotai";

interface EdgeButtonProps {
	direction: "left" | "right";
	index: number;
	id: string;
	hasChildren: boolean;
	isExpanded: boolean;
	disabled?: boolean | undefined;
}

export function EdgeButton({
	direction,
	id,
	hasChildren,
	isExpanded,
}: EdgeButtonProps) {
	const realDirection = useMemo(() => {
		if (direction === "left") {
			return isExpanded ? "left" : "right";
		}
		return isExpanded ? "right" : "left";
	}, [isExpanded, direction]);
	// if direction is left, swap the index
	return (
		<button
			className="w-[20px] box-border border border-crust bg-mantle flex items-center justify-center"
			type="button"
			disabled={!hasChildren}
			onClick={() => {
				sendToServer({
					type: "node-toggle",
					nodeId: id,
				});
			}}
		>
			{hasChildren === false ? (
				<Minus className="w-4 h-4 rotate-90 text-text" />
			) : realDirection === "left" ? (
				<ChevronLeft className="w-4 h-4 stroke-text" />
			) : (
				<ChevronRight className="w-4 h-4 stroke-text" />
			)}
		</button>
	);
}

const onNodeClick = (event: React.MouseEvent, idRange: [number, number]) => {
	console.log("Clicked on node", idRange);
	sendToServer({
		type: "highlight-node-source",
		idRange: idRange,
	});
};

interface NodeProps {
	data: CustomData;
	iconName: keyof typeof dynamicIconImports;
	iconBackgroundColor: string;
	children?: JSX.Element;
}

export function AbstractNode({
	data: {
		label,
		id,
		hasChildren,
		disabled,
		reversed: reverse,
		expanded: isExpanded,
		idRange,
	},
	iconName,
	iconBackgroundColor,
}: NodeProps) {
	const [cursorPosition, setCursorPosition] = useAtom(cursorPositionAtom);
	const [astLocations, setAstLocations] = useAtom(astLocationsAtom);
	let cursorPositionedNodes: number[] = [];

	if (cursorPosition !== null) {
		const cursorPositionedAstLocations = astLocations.filter((astLocation) => {
			// These are supposed to be vscode ranges but the types like - see AstLocation.ts:13
			// return astLocation.location.contains(cursorPosition);
			return (
				astLocation.location[0].line <= cursorPosition.line &&
				cursorPosition.line <= astLocation.location[1].line
			);
		});
		cursorPositionedNodes = cursorPositionedAstLocations.map((astLocation) => {
			return astLocation.id;
		});
	}
	let isCursorOverNode = false;
	if (!id.endsWith("-root")) {
		for (const cursorPositionedNode of cursorPositionedNodes) {
			if (
				idRange[0] <= cursorPositionedNode &&
				cursorPositionedNode <= idRange[1]
			) {
				isCursorOverNode = true;
				break;
			}
		}
	}
	// const isCursorOverNode = cursorPositionedNodes.includes(Number.parseInt(id));

	console.log("handle id", id);
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: No real way to navigate this without a mouse, unless we use tabs or arrow keys or smth
		<div
			className={cn(
				"bg-mantle font-mono text-xs flex-1 max-h-[40px] min-h-[40px] max-w-[260px]",
				"flex w-full relative rounded-none box-border border-x border-b",
				isCursorOverNode ? "border-white" : "border-black",
				// "border-black",
				reverse ? "flex-row-reverse" : "",
			)}
			onClick={(event) => {
				onNodeClick(event, idRange);
			}}
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
					<Icon name={iconName} className="text-text" />
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
				isExpanded={isExpanded}
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
