import React from "react";
import {
	Panel,
	useReactFlow,
	getNodesBounds,
	getViewportForBounds,
	type Node,
	type Edge,
} from "@xyflow/react";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

const imageWidth = 3840;
const imageHeight = 2160;

function downloadImage(dataUrl: string): void {
	const a = document.createElement("a");
	a.setAttribute("download", "flow-visualization.png");
	a.setAttribute("href", dataUrl);
	a.click();
}

function downloadJson(nodes: Node[], edges: Edge[]): void {
	const data = JSON.stringify({ nodes, edges }, null, 2);
	const blob = new Blob([data], { type: "application/json" });
	saveAs(blob, "flow-data.json");
}

export function ExportButtons(): JSX.Element {
	const { getNodes, getEdges } = useReactFlow();

	const handleExportImage = (): void => {
		try {
			const nodesBounds = getNodesBounds(getNodes());
			const viewport = getViewportForBounds(
				nodesBounds,
				imageWidth,
				imageHeight,
				0.01,
				5,
				0.1, // padding
			);

			// Create and apply temporary styles to hide buttons during export
			const styleElement = document.createElement("style");
			styleElement.textContent = `
				button.h-7.w-7 {
					display: none !important;
				}
			`;
			document.head.appendChild(styleElement);

			toPng(document.querySelector(".react-flow__viewport") as HTMLElement, {
				backgroundColor: "#1e1e2e", // Matches mocha background
				width: imageWidth,
				height: imageHeight,
				style: {
					width: `${imageWidth}px`,
					height: `${imageHeight}px`,
					transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
				},
			})
				.then((dataUrl) => {
					// Remove temporary styles after image is generated
					document.head.removeChild(styleElement);
					downloadImage(dataUrl);
				})
				.catch((err: Error) => {
					// Ensure styles are removed even if there's an error
					document.head.removeChild(styleElement);
					console.error("Error exporting image:", err);
				});
		} catch (error) {
			console.error("Failed to export image:", error);
		}
	};

	const handleExportJson = (): void => {
		try {
			const nodes = getNodes();
			const edges = getEdges();
			downloadJson(nodes, edges);
		} catch (error) {
			console.error("Failed to export JSON:", error);
		}
	};

	return (
		<Panel position="top-right" className="flex gap-2">
			<button
				type="button"
				className="bg-surface-0 text-text-0 hover:bg-surface-1 px-3 py-2 rounded-md font-medium text-sm shadow-md"
				onClick={handleExportImage}
			>
				Export as Image
			</button>
			<button
				type="button"
				className="bg-surface-0 text-text-0 hover:bg-surface-1 px-3 py-2 rounded-md font-medium text-sm shadow-md"
				onClick={handleExportJson}
			>
				Export as JSON
			</button>
		</Panel>
	);
}
