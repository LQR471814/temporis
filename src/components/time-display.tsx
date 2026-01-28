import { createMemo, Show } from "solid-js";
import { cn } from "src/lib/utils";
import { Separator } from "./ui/separator";

export function TimeDisplay(props: {
	class?: string;
	time: Temporal.ZonedDateTime;
	minDuration: Temporal.Duration;
	includeMin?: boolean;
}) {
	const test = createMemo(() => {
		return (comparisonResult: number) => {
			if (props.includeMin) {
				return comparisonResult <= 0;
			}
			return comparisonResult < 0;
		};
	});
	return (
		<div class={cn("flex px-2 text-sm", props.class)}>
			<div class="my-auto flex gap-2">
				<span class="m-0">{props.time.year}</span>
				<Show
					when={test()(
						Temporal.Duration.compare(
							props.minDuration,
							{ years: 1 },
							{ relativeTo: props.time },
						),
					)}
				>
					<Separator class="h-5" orientation="vertical" />
					<span class="m-0">
						{Intl.DateTimeFormat(undefined, { month: "long" }).format(
							new Date(props.time.toInstant().toString()),
						)}
					</span>
				</Show>
				<Show
					when={test()(
						Temporal.Duration.compare(
							props.minDuration,
							{ weeks: 1 },
							{ relativeTo: props.time },
						),
					)}
				>
					<Separator class="h-5" orientation="vertical" />
					<span class="m-0">{props.time.day}</span>
				</Show>
				<Show
					when={test()(
						Temporal.Duration.compare(
							props.minDuration,
							{ days: 1 },
							{ relativeTo: props.time },
						),
					)}
				>
					<Separator class="h-5" orientation="vertical" />
					<span class="m-0">
						{props.time.hour}:{props.time.minute}
					</span>
				</Show>
			</div>
		</div>
	);
}
