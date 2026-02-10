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
	onClickStatus: () => void;
	ref?: HTMLDivElement | ((el: HTMLDivElement) => void);
}) {
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: need to nest buttons
		// biome-ignore lint/a11y/useKeyWithClickEvents: no keyboard method of input
		<div
			class={cn(
				"flex items-center gap-2 max-w-[300px]",
				"rounded-md border shadow-sm px-2 hover:bg-primary/5 transition-colors bg-background",
				"cursor-default touch-none text-sm",
				props.class,
			)}
			onClick={props.onClick}
			ref={props.ref}
		>
			<button
				type="button"
				classList={{
					"aspect-square p-1 rounded-full": true,
					[props.color]: true,
				}}
				onClick={props.onClickStatus}
			></button>
			<p class="text-start overflow-hidden line-clamp-2 text-ellipsis">
				{props.name}
			</p>
		</div>
	);
}

export function TaskChip(props: {
	id: string;
	name: string;
	status: StatusType;
	onClick: () => void;
	onClickStatus: () => void;
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
				return "bg-primary";
			case StatusType.completed:
				return "bg-green-600";
			case StatusType.fixed:
				return "bg-gray-300";
		}
	});
	const textColor = createMemo(() => {
		switch (props.status) {
			case StatusType.pending:
				return "text-primary";
			case StatusType.completed:
				return "text-green-600";
			case StatusType.fixed:
				return "text-gray-300";
		}
	});
	return (
		<Display
			class={cn("draggable", props.class, textColor())}
			name={props.name}
			color={color()}
			onClick={props.onClick}
			onClickStatus={props.onClickStatus}
			ref={draggable()}
		/>
	);
}
