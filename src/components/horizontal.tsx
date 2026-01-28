import { createMemo, For } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import { childInstancesOf, type Timescale } from "~/lib/timescales";
import { cn } from "~/lib/utils";

export function Horizontal(props: {
	parent: Timescale;
	child: Timescale;
	now: Temporal.ZonedDateTime;
	class?: string;
}) {
	const instances = createMemo(() => [
		...childInstancesOf(props.parent, props.child, props.now),
	]);
	return (
		<div class={cn("flex gap-1 h-full w-full", props.class)}>
			<For each={instances()}>
				{(start) => (
					<Timeframe class="flex-1" timescale={props.child} time={start} />
				)}
			</For>
		</div>
	);
}
