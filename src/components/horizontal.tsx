import { createMemo, For } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import { childInstancesOf, type Timescale } from "~/lib/timescales";
import { cn, now } from "~/lib/utils";

export function HorizontalTimeframes(props: {
	class?: string;
	parent: Timescale;
	child: Timescale;
}) {
	const instances = createMemo(() => [
		...childInstancesOf(props.parent, props.child, now()),
	]);
	return (
		<div class={cn("flex gap-1 w-full p-1", props.class)}>
			<For each={instances()}>
				{(start) => (
					<Timeframe class="flex-1" timescale={props.child} time={start} />
				)}
			</For>
		</div>
	);
}
