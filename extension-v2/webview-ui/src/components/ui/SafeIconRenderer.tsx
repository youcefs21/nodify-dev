import { Cpu } from "lucide-react";
import { cn } from "../../utils/cn";
import { TypeIconMap } from "./Icon";
import { handleError } from "../../utils/errorHandling";

interface SafeIconRendererProps {
	type: string | undefined;
	fallbackIcon?: React.ReactNode;
	className?: string;
}

/**
 * A component that safely renders an icon from TypeIconMap
 * Falls back to a default icon if the type is invalid or rendering fails
 */
export function SafeIconRenderer({
	type,
	fallbackIcon,
	className,
}: SafeIconRendererProps) {
	if (!type) {
		return (
			<div
				className={cn(
					"p-2 rounded-lg",
					"bg-blue [&>*]:stroke-mantle",
					className,
				)}
			>
				{fallbackIcon || <Cpu className="size-5" />}
			</div>
		);
	}

	try {
		const CustomIcon = TypeIconMap[type as keyof typeof TypeIconMap];
		if (!CustomIcon) {
			console.error(`Type is not in TypeIconMap: ${type}`);
			return (
				<div
					className={cn(
						"p-2 rounded-lg",
						"bg-blue [&>*]:stroke-mantle",
						className,
					)}
				>
					{fallbackIcon || <Cpu className="size-5" />}
				</div>
			);
		}

		return <CustomIcon />;
	} catch (error) {
		handleError(error, "SafeIconRenderer");
		return (
			<div
				className={cn(
					"p-2 rounded-lg",
					"bg-blue [&>*]:stroke-mantle",
					className,
				)}
			>
				{fallbackIcon || <Cpu className="size-5" />}
			</div>
		);
	}
}
