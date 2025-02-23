import { atom } from "jotai";
import type * as vscode from "vscode";
import type { AstLocation } from "../../../src/vsc-commands/analyze-document";

//TODO eventually refactor this outta here
export const cursorPositionAtom = atom<vscode.Position | null>(null);
export const astLocationsAtom = atom<AstLocation[]>([]);
