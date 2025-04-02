import {
	Book,
	FileText,
	LogIn,
	Play,
	Settings2,
	Unplug,
	Webhook,
	CheckCircle2,
	BarChart3,
	Settings,
	Wrench,
	ShieldCheck,
	Type,
	Code2,
	Hammer,
	Layout,
	Terminal,
	Bell,
	Power,
	Package,
	Waves,
	LineChart,
	FileCheck,
	MessageSquare,
	XCircle,
	Sliders,
	Activity,
	Network,
	LogOut,
	CheckCircle,
	ArrowLeft,
	ClipboardList,
	Brain,
	Database,
	GitBranch,
	FileSearch,
	HardDrive,
	Loader,
	Pencil,
	Blocks,
	Cpu,
	Cog,
	Grid,
	Save,
	BookOpen,
	Upload,
	PlaySquare,
	Boxes,
	Scale,
	FileInput,
	FileOutput,
	FileEdit,
	FileSpreadsheet,
	AlertTriangle,
	Keyboard,
} from "lucide-react";
import { cn } from "../../utils/cn";

export const TypeIconMap = {
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
	data_processor: () => (
		<div className={cn("p-2 rounded-lg bg-flamingo [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	initialization: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Settings2 className="size-5" />
		</div>
	),
	preparation: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
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
	data_validation: () => (
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
	setup: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<Wrench className="size-5" />
		</div>
	),
	validation: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<ShieldCheck className="size-5" />
		</div>
	),
	type_management: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Type className="size-5" />
		</div>
	),
	exit_code_processor: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<Code2 className="size-5" />
		</div>
	),
	build_processor: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Hammer className="size-5" />
		</div>
	),
	build_process: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Hammer className="size-5" />
		</div>
	),
	display: () => (
		<div className={cn("p-2 rounded-lg bg-sky [&>*]:stroke-mantle")}>
			<Layout className="size-5" />
		</div>
	),
	exit_code_logic: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<Terminal className="size-5" />
		</div>
	),
	notification: () => (
		<div className={cn("p-2 rounded-lg bg-pink [&>*]:stroke-mantle")}>
			<Bell className="size-5" />
		</div>
	),
	process_termination: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<Power className="size-5" />
		</div>
	),
	package_management: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Package className="size-5" />
		</div>
	),
	stream_handler: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<Waves className="size-5" />
		</div>
	),
	statistics: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<LineChart className="size-5" />
		</div>
	),
	post_processing: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<FileCheck className="size-5" />
		</div>
	),
	message_display: () => (
		<div className={cn("p-2 rounded-lg bg-sky [&>*]:stroke-mantle")}>
			<MessageSquare className="size-5" />
		</div>
	),
	termination: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<XCircle className="size-5" />
		</div>
	),
	argument_handler: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Sliders className="size-5" />
		</div>
	),
	profiling: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<Activity className="size-5" />
		</div>
	),
	network_call: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<Network className="size-5" />
		</div>
	),
	return: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<ArrowLeft className="size-5" />
		</div>
	),
	summary: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<ClipboardList className="size-5" />
		</div>
	),
	exit: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<LogOut className="size-5" />
		</div>
	),
	finalization: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<CheckCircle className="size-5" />
		</div>
	),
	callback_setup: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Webhook className="size-5" />
		</div>
	),
	model_initialization: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Brain className="size-5" />
		</div>
	),
	model_training: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Activity className="size-5" />
		</div>
	),
	dataset_preparation: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Database className="size-5" />
		</div>
	),
	configuration_setup: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Settings className="size-5" />
		</div>
	),
	execution_flow: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<GitBranch className="size-5" />
		</div>
	),
	callback_method: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<Webhook className="size-5" />
		</div>
	),
	callback_function: () => (
		<div className={cn("p-2 rounded-lg bg-pink [&>*]:stroke-mantle")}>
			<Webhook className="size-5" />
		</div>
	),
	block_management: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<Blocks className="size-5" />
		</div>
	),
	config_retrieval: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<FileSearch className="size-5" />
		</div>
	),
	config_update: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Pencil className="size-5" />
		</div>
	),
	logging_setup: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<Terminal className="size-5" />
		</div>
	),
	file_reading: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	seed_management: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<HardDrive className="size-5" />
		</div>
	),
	training_execution: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Play className="size-5" />
		</div>
	),
	trainer_initialization: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Loader className="size-5" />
		</div>
	),
	model_setup: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Cpu className="size-5" />
		</div>
	),
	configuration_management: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<Cog className="size-5" />
		</div>
	),
	model_architecture: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<Grid className="size-5" />
		</div>
	),
	parameter_management: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Sliders className="size-5" />
		</div>
	),
	vocabulary_management: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<BookOpen className="size-5" />
		</div>
	),
	checkpointing: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Save className="size-5" />
		</div>
	),
	dataset_initialization: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<Database className="size-5" />
		</div>
	),
	data_loading: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<Upload className="size-5" />
		</div>
	),
	training_control: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<PlaySquare className="size-5" />
		</div>
	),
	model_management: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<Boxes className="size-5" />
		</div>
	),
	weight_initialization: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<Scale className="size-5" />
		</div>
	),
	argument_definition: () => (
		<div className={cn("p-2 rounded-lg bg-mauve [&>*]:stroke-mantle")}>
			<FileInput className="size-5" />
		</div>
	),
	option_processing: () => (
		<div className={cn("p-2 rounded-lg bg-yellow [&>*]:stroke-mantle")}>
			<FileOutput className="size-5" />
		</div>
	),
	option_handling: () => (
		<div className={cn("p-2 rounded-lg bg-teal [&>*]:stroke-mantle")}>
			<FileEdit className="size-5" />
		</div>
	),
	argument_parsing: () => (
		<div className={cn("p-2 rounded-lg bg-peach [&>*]:stroke-mantle")}>
			<FileInput className="size-5" />
		</div>
	),
	file_operation: () => (
		<div className={cn("p-2 rounded-lg bg-blue [&>*]:stroke-mantle")}>
			<FileText className="size-5" />
		</div>
	),
	reporting: () => (
		<div className={cn("p-2 rounded-lg bg-sapphire [&>*]:stroke-mantle")}>
			<FileSpreadsheet className="size-5" />
		</div>
	),
	error_handling: () => (
		<div className={cn("p-2 rounded-lg bg-red [&>*]:stroke-mantle")}>
			<AlertTriangle className="size-5" />
		</div>
	),
	user_input: () => (
		<div className={cn("p-2 rounded-lg bg-green [&>*]:stroke-mantle")}>
			<Keyboard className="size-5" />
		</div>
	),
};
