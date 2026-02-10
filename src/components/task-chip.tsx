import { createDraggable } from "@thisbeyond/solid-dnd";
import { createMemo, useContext } from "solid-js";
import type { DragData } from "src/context/current-task";
import { TaskChipContext } from "src/context/task-chip";
import { StatusType } from "src/lib/constants";
import { cn } from "src/lib/utils";

function Display(props: {
	class?: string;
	name: string;
	color: string;
	onClick: () => void;
	ref?: HTMLButtonElement | ((el: HTMLButtonElement) => void);
}) {
	return (
		<button
			type="button"
			class={cn(
				"flex items-center gap-2 max-w-[300px]",
				"rounded-md border shadow-sm px-2 hover:bg-primary/5 transition-colors bg-background",
				"cursor-default touch-none text-sm",
				props.class,
			)}
			onClick={props.onClick}
			ref={props.ref}
		>
			<div
				classList={{
					"aspect-square": true,
					"p-1": true,
					"rounded-full": true,
					[props.color]: true,
				}}
			/>
			<p class="text-start overflow-hidden line-clamp-2 text-ellipsis">
				{props.name}
			</p>
		</button>
	);
}

export function TaskChip(props: {
	id: string;
	name: string;
	status: StatusType;
	onClick: () => void;
	class?: string;
}) {
	const ctx = useContext(TaskChipContext);
	const dragId = createMemo(() =>
		ctx?.namespace ? `${ctx.namespace}:${props.id}` : props.id.toString(),
	);
	const draggable = createMemo(() =>
		createDraggable(dragId(), { taskId: props.id } satisfies DragData),
	);
	const color = createMemo(() => {
		switch (props.status) {
			case StatusType.pending:
				return "bg-gray-500";
			case StatusType.completed:
				return "bg-green-500";
			case StatusType.fixed:
				return "bg-gray-300";
		}
	});
	return (
		<Display
			class={cn("draggable", props.class)}
			name={props.name}
			color={color()}
			onClick={props.onClick}
			ref={draggable()}
		/>
	);
}
