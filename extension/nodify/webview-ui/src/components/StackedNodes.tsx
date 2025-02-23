import type { CustomData } from "../../../src/types";
import { AbstractNode } from "./AbstractNode";
import type * as vscode from "vscode";
import type { AstLocation } from "../../../src/vsc-commands/analyze-document";

// export function StackedNodes(data: any) {
// console.log(data);

// biome-ignore lint/suspicious/noExplicitAny: TODO REMOVE, JUST FOR TESTING PASSING OF CURSOR POSITION INFO
export function StackedNodes(customNode: any) {
	console.log("STACKEDNODES TEST");
	console.log(customNode);
	const data = customNode.data;
	// export function StackedNodes({ data }: { data: CustomData }) {
	return (
		<div className="p-3 bg-transparent rounded-lg">
			{(() => {
				if (data.id === "-2") return null;

				return (
					<div
						key={`${data.children[0].id}-root`}
						className="box-border border-t border-crust"
					>
						<AbstractNode
							data={{
								...data,
								id: `${data.children[0].id}-root`,
							}}
							iconName={data.icon}
							iconBackgroundColor={data.iconBackgroundColor}
						/>
					</div>
				);
			})()}
			{data.children.map((n: CustomData) => {
				return (
					<div key={n.id} className="pl-4">
						<AbstractNode
							data={n}
							iconName={n.icon}
							iconBackgroundColor={n.iconBackgroundColor}
						/>
					</div>
				);
			})}
		</div>
	);
}
