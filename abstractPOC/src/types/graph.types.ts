import type { SgNode, Range } from "@ast-grep/napi";

/**
 * Incremental ID tracker to collect useful information on chunks of Python code for displaying within the graph.
 */
type ID = number;

/**
 * Source code location for a particular block/definition
 */
interface Location {
	filename: string;
	start: Range;
	end: Range;
}

/**
 * Base class for all graph definitions.
 *
 * Basically, this is our interpretation of the python AST for a particular chunk of code, better suited to displaying on a graph
 */
interface GraphAST {
	id: ID;
	location: Location;
}

/**
 * Privacy level for a particular variable, function, method, or class
 *
 * In Python, privacy is not enforced, but it is a convention to use underscores to denote private/hidden variables.
 */
type Privacy = "private" | "hidden" | "public";

/**
 * Significant content from a variable/function argument definition
 */
interface Var {
	name: string;
	type: string | null;
	value: string | null;
	docstr: string | null;
	privacy: Privacy;
}

/**
 * Collection of function arguments. Python allows for a variety of argument types, including positional, keyword, and variadic arguments.
 */
interface Args {
	/** Arguments before a `/` arg. */
	pos_only_args: Var[];
	/** Default argument type (does not fall in one of the other categories). */
	pos_or_kw_args: Var[];
	/** Arguments after a `*` arg. */
	kw_only_args: Var[];
	/** Covers `*arg`. */
	pos_remainder_arg: Var | null;
	/** Covers `**kwargs`. */
	kw_remainder_arg: Var | null;
}

/**
 * Function definition in Python.
 */
interface Func extends GraphAST {
	name: string;
	return_type: string | null;
	args: Args;
	decorators: string[];
	modifier: "async" | null;
	docstr: string | null;
	body: SgNode;
}

/**
 * Method kind in Python.
 *
 * These can be combined (eg a classmethod can also be abstract or final).
 * Some combinations are invalid, but that is the responsibility of the language itself.
 */
type MethodKind =
	| "static"
	| "class"
	| "instance"
	| "final"
	| "abstract"
	| "property_setter"
	| "property_getter"
	| "property_deleter";

/**
 * Methods are just functions within a class.
 */
interface Method extends Func {
	privacy: Privacy;
	kind: MethodKind[];
}

type ClassKind = "abstract" | "interface" | "concrete" | "final" | "enum";

/**
 * Class definition in Python.
 */
interface Class extends GraphAST {
	name: string;
	privacy: Privacy;

	kind: ClassKind;
	bases: string[];
	decorators: string[];

	/** Defined for the entire class (outside of __init__) */
	class_vars: Var[];
	/** Defined through __init__, changes only affect one instance of the class */
	instance_vars: Var[];
	methods: Method[];

	docstr: string | null;
}

type InModuleDef = Func | Class | Var;

/**
 * Module definition in Python. Intended for one file.
 */
interface Module extends GraphAST {
	// global_vars: Var[];
	definitions: InModuleDef[];
	docstr: string[];
}
type Def = Func | Class | Var | Module;

export type {
	ID,
	Location,
	Privacy,
	Var,
	Args,
	Func,
	Method,
	MethodKind,
	Class,
	ClassKind,
	InModuleDef,
	Def,
	Module,
	GraphAST,
};

export function isFunc(def: Def): def is Func {
	return (def as Func).args !== undefined;
}
export function isVar(def: Def): def is Var {
	return (def as Var).privacy !== undefined;
}
export function isClass(def: Def): def is Class {
	return (def as Class).methods !== undefined;
}
