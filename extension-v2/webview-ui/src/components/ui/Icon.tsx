import {
	Book,
	FileText,
	LogIn,
	Play,
	Settings,
	Unplug,
	Webhook,
	CheckCircle2,
	BarChart3,
	Wrench,
	ShieldCheck,
	Code2,
	Layout,
	Terminal,
	Bell,
	Power,
	Package,
	MessageSquare,
	AlertTriangle,
	Database,
	GitBranch,
	FileSearch,
	Loader,
	Folder,
	Cpu,
	Network,
} from "lucide-react";
import { cn } from "../../utils/cn";

// Core icon definitions - around 25 base icons
const CoreIcons = {
	main: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<LogIn className="size-5" />
		</div>
	),
	documentation: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Book className="size-5" />
		</div>
	),
	utility: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Unplug className="size-5" />
		</div>
	),
	data: () => (
		<div className={cn("p-2 rounded-lg bg-flamingo [&>*]:stroke-mantle")}>
			<Database className="size-5" />
		</div>
	),
	initialization: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Settings className="size-5" />
		</div>
	),
	execution: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Play className="size-5" />
		</div>
	),
	callback: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Webhook className="size-5" />
		</div>
	),
	validation: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<CheckCircle2 className="size-5" />
		</div>
	),
	visualization: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<BarChart3 className="size-5" />
		</div>
	),
	configuration: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Settings className="size-5" />
		</div>
	),
	processing: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Wrench className="size-5" />
		</div>
	),
	security: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<ShieldCheck className="size-5" />
		</div>
	),
	display: () => (
		<div className={cn("p-2 rounded-lg bg-sky [&>*]:stroke-mantle")}>
			<Layout className="size-5" />
		</div>
	),
	terminal: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<Terminal className="size-5" />
		</div>
	),
	notification: () => (
		<div className={cn("p-2 rounded-lg bg-pink [&>*]:stroke-mantle")}>
			<Bell className="size-5" />
		</div>
	),
	termination: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<Power className="size-5" />
		</div>
	),
	package: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Package className="size-5" />
		</div>
	),
	messaging: () => (
		<div className={cn("p-2 rounded-lg bg-sky [&>*]:stroke-mantle")}>
			<MessageSquare className="size-5" />
		</div>
	),
	error: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<AlertTriangle className="size-5" />
		</div>
	),
	file: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	search: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<FileSearch className="size-5" />
		</div>
	),
	loading: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Loader className="size-5" />
		</div>
	),
	folder: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Folder className="size-5" />
		</div>
	),
	conditional: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<GitBranch className="size-5" />
		</div>
	),
	hardware: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Cpu className="size-5" />
		</div>
	),
	network: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<Network className="size-5" />
		</div>
	),
};

// Mapping other terms to core icons
const IconTypeMapping: Record<string, keyof typeof CoreIcons> = {
	// Direct mappings (same name as core)
	main: "main",
	documentation: "documentation",
	utility: "utility",
	initialization: "initialization",
	execution: "execution",
	callback: "callback",
	validation: "validation",
	visualization: "visualization",
	configuration: "configuration",
	processing: "processing",
	security: "security",
	display: "display",
	terminal: "terminal",
	notification: "notification",
	termination: "termination",
	package: "package",
	messaging: "messaging",
	error: "error",
	file: "file",
	search: "search",
	loading: "loading",
	folder: "folder",
	conditional: "conditional",
	hardware: "hardware",
	network: "network",

	// Additional terms mapped to core icons
	constructor: "initialization" as keyof typeof CoreIcons,
	code: "execution",
	data_processor: "processing",
	data_validation: "validation",
	preparation: "processing",
	data_initialization: "data",
	dataset_initialization: "data",
	data_loading: "data",
	setup: "initialization",
	type_management: "processing",
	exit_code_processor: "processing",
	build_processor: "processing",
	build_process: "processing",
	build_execution: "processing",
	exit_code_logic: "terminal",
	process_termination: "termination",
	package_management: "package",
	stream_handler: "data",
	statistics: "visualization",
	post_processing: "processing",
	message_display: "messaging",
	exit: "termination",
	argument_handler: "processing",
	profiling: "visualization",
	network_call: "network",
	http_request: "network",
	api_call: "network",
	web_request: "network",
	internet: "network",
	server_connection: "network",
	socket: "network",
	remote_call: "network",
	return: "execution",
	summary: "documentation",
	finalization: "validation",
	callback_setup: "callback",
	model_initialization: "initialization",
	model_training: "processing",
	dataset_preparation: "data",
	configuration_setup: "configuration",
	execution_flow: "conditional",
	callback_method: "callback",
	callback_function: "callback",
	block_management: "utility",
	config_retrieval: "search",
	config_update: "configuration",
	logging_setup: "terminal",
	file_reading: "file",
	seed_management: "initialization",
	training_execution: "execution",
	trainer_initialization: "initialization",
	model_setup: "initialization",
	configuration_management: "configuration",
	model_architecture: "hardware",
	parameter_management: "configuration",
	vocabulary_management: "data",
	checkpointing: "data",
	training_control: "execution",
	model_management: "hardware",
	weight_initialization: "initialization",
	argument_definition: "processing",
	option_processing: "processing",
	option_handling: "processing",
	argument_parsing: "processing",
	file_operation: "file",
	reporting: "documentation",
	error_handling: "error",
	user_input: "terminal",
	argument_group: "folder",
	file_management: "file",
	conflict_resolution: "error",
	exception_handling: "error",
	file_system: "folder",
	output: "display",
	data_parsing: "data",
	return_statement: "execution",
	training_loop: "execution",
	batch_fetching: "data",
	batch_processing: "processing",
	iteration_tracking: "validation",
	file_processing: "file",
	data_aggregation: "data",
	conditional_logic: "conditional",
	recursive_call: "callback",
	logging: "terminal",
	data_structure: "data",
	data_retrieval: "search",
	sorting: "processing",
	conditional_check: "conditional",
	type_conversion: "processing",
	data_loader: "data",
	data_storage: "data",
	performance: "visualization",
	data_processing: "processing",
	cache_initialization: "initialization",
	module_update: "configuration",
	semantic_analysis: "processing",
	error_checking: "validation",
	cache_update: "data",
	iteration: "execution",
	decision_logic: "conditional",
	loop: "execution",
	counter: "validation",
	"user-interaction": "terminal",
	data_assignment: "data",
	cache_check: "validation",
	cache_retrieval: "data",
	conditional_modification: "conditional",
	return_value: "execution",
	directory_listing: "folder",
	try_block: "error",
	hashing: "security",
	filter: "processing",
	fallback_logic: "conditional",
	list_operation: "processing",

	// New mappings (3rd batch)
	assignment: "data",
	filesystem_operation: "file",
	path_processing: "file",
	error_caching: "error",
	control_flow: "execution",
	mapping: "processing",
	file_io: "file",
	file_handling: "file",
	file_check: "validation",
	cache_handling: "data",
	cache_management: "configuration",
	data_management: "data",
	data_preparation: "processing",
	object_creation: "initialization",
	error_reporting: "error",

	// New mappings (4th batch)
	recursion: "callback",
	data_tracking: "validation",
	dependency_management: "package",
	data_filtering: "processing",
	plugin_management: "package",
	flag: "configuration",
	path_construction: "file",
	method_call: "execution",
	module_search: "search",
	namespace_check: "validation",
	directory_iteration: "folder",
	data_field: "data",
	system_call: "hardware",
	config_setup: "configuration",
	error_generation: "error",
	dependency_verification: "validation",
	fallback_operation: "conditional",
	serialization: "data",
	data_population: "data",

	// New mappings (5th batch)
	directory_check: "validation",
	directory_search: "search",
	stub_check: "validation",
	state_retrieval: "data",
	plugin: "package",
	module_management: "package",
	function_call: "execution",
	calculation: "processing",
	path_setup: "initialization",
	decision: "conditional",
	variable_initialization: "initialization",
	condition_check: "conditional",
};

// Export a combined TypeIconMap that uses the mapping to redirect to core icons
export const TypeIconMap: Record<string, () => JSX.Element> = new Proxy(
	{} as Record<string, () => JSX.Element>,
	{
		get: (target, prop: string) => {
			// Get the core icon this type maps to
			const coreType = IconTypeMapping[prop];

			// If there's a mapping, use the core icon
			if (coreType) {
				return CoreIcons[coreType];
			}

			// Default to 'utility' if no mapping exists
			console.warn(`No icon mapping found for type: ${prop}`);
			return CoreIcons.utility;
		},
	},
);
