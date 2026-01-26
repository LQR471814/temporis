import { createMemo } from "solid-js";
import type { Enums } from "~/lib/supabase/types.gen";

export function Chip(props: {
	name: string;
	status: Enums<"task_status">;
	blocked: boolean;
	onClick: () => void;
}) {
	const color = createMemo(() => {
		switch (props.status) {
			case "pending":
				return "bg-gray-500";
			case "completed":
				return "bg-green-500";
			case "dropped":
				return "bg-red-500";
		}
	});
	return (
		<div class="flex gap-2 rounded-md border border-muted shadow-sm">
			<div
				classList={{
					"p-2": true,
					"rounded-full": true,
					[color()]: true,
				}}
			/>
			{props.name}
		</div>
	);
}
