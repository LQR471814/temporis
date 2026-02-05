import { createMemo, For } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import { childInstancesOf, type Timescale } from "~/lib/timescales";
import { cn, now } from "~/lib/utils";

export function Horizontal(props: {
	parent: Timescale;
	child: Timescale;
	now: Temporal.ZonedDateTime;
	class?: string;
}) {
	const currentInstance = createMemo(() => props.child.instance(now()));
	const instances = createMemo(() => [
		...childInstancesOf(props.parent, props.child, props.now),
	]);
	return (
		<div class={cn("flex gap-1 h-full w-full overflow-y-auto", props.class)}>
			<For each={instances()}>
				{(start) => (
					<Timeframe
						class="flex-1"
						timescale={props.child}
						time={start}
						accented={
							Temporal.ZonedDateTime.compare(start, currentInstance().start) >=
								0 &&
							Temporal.ZonedDateTime.compare(start, currentInstance().end) < 0
						}
					/>
				)}
			</For>
		</div>
	);
}
