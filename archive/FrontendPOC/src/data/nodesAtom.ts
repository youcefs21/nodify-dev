import { atom } from "jotai";
import type { output } from "../components/nodes.schema";
import { abstractSnake } from "./snake";
import {
	createEdges,
	entryNode,
	flattenCustomNodes,
} from "../functions/NodeCreater";
import { AbstractionLevelOneNodeMapper } from "../functions/NodeCreater";
import { Map as ImMap } from "immutable";

export const astAtom = atom<output[]>([
	{
		...entryNode,
		children: [
			{
				// biome-ignore lint/style/noNonNullAssertion: entryNode.children is not null
				...entryNode.children![0],
				children: abstractSnake,
			},
		],
	},
]);

export const astExpandedAtom = atom<ImMap<string, boolean>>(
	ImMap<string, boolean>({
		"-1": true,
		"-2": true,
	}),
);

export const nodesAtom = atom((get) => {
	const abstractSnake = get(astAtom);
	const expanded = get(astExpandedAtom);
	return flattenCustomNodes(
		AbstractionLevelOneNodeMapper(abstractSnake, expanded),
	);
});

export const edgesAtom = atom((get) => {
	const nodes = get(nodesAtom);
	return createEdges(nodes);
});
