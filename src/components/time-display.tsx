import { Show } from "solid-js";
import { Separator } from "./ui/separator";

export function TimeDisplay(props: {
	time: Temporal.ZonedDateTime;
	minDuration: Temporal.Duration;
}) {
	return (
		<div class="flex px-2 text-sm">
			<div class="my-auto flex gap-2">
				<span class="m-0">{props.time.year}</span>
				<Show
					when={
						Temporal.Duration.compare(
							props.minDuration,
							{ years: 1 },
							{ relativeTo: props.time },
						) < 0
					}
				>
					<Separator class="h-5" orientation="vertical" />
					<span class="m-0">
						{Intl.DateTimeFormat(undefined, { month: "long" }).format(
							new Date(props.time.toInstant().toString()),
						)}
					</span>
				</Show>
				<Show
					when={
						Temporal.Duration.compare(
							props.minDuration,
							{ weeks: 1 },
							{ relativeTo: props.time },
						) < 0
					}
				>
					<Separator class="h-5" orientation="vertical" />
					<span class="m-0">{props.time.day}</span>
				</Show>
				<Show
					when={
						Temporal.Duration.compare(
							props.minDuration,
							{ days: 1 },
							{ relativeTo: props.time },
						) < 0
					}
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
