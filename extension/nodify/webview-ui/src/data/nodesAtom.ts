import { atom } from "jotai";
import type { output } from "../components/nodes.schema";
import { Map as ImMap } from "immutable";

export const astAtom = atom<output[]>([]);

export const astExpandedAtom = atom<ImMap<string, boolean>>(
	ImMap<string, boolean>({
		"-1": true,
		"-2": true,
	}),
);

export const nodesAtom = atom((get) => {
	return [];
});

export const edgesAtom = atom((get) => {
	return [];
});
