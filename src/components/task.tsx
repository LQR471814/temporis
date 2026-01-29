import { createMemo } from "solid-js";

export function Chip(props: {
	name: string;
	blocked: boolean;
	onClick: () => void;
}) {
	const color = createMemo(() => {
		const status = "pending" as string;
		switch (status) {
			case "pending":
				return "bg-gray-500";
			case "completed":
				return "bg-green-500";
			case "dropped":
				return "bg-red-500";
		}
		return ""
	});
	return (
		<div class="flex items-center gap-2 rounded-md border border-muted shadow-sm px-2">
			<div
				classList={{
					"aspect-square": true,
					"p-1": true,
					"rounded-full": true,
					[color()]: true,
				}}
			/>
			{props.name}
		</div>
	);
}
