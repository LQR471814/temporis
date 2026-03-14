import { useContext, createMemo, For } from "solid-js";
import { Timeframe } from "src/components/timeframe";
import { useViewTimeInstant, ViewContext } from "src/context/view";
import { childInstancesOf, type Timescale } from "src/lib/timescales";
import { cn } from "src/lib/utils";

export function Horizontal(props: {
	parent: Timescale;
	child: Timescale;
	now: Temporal.ZonedDateTime;
	class?: string;
}) {
	const viewTime = useViewTimeInstant();
	const instances = createMemo(() => [
		...childInstancesOf(props.parent, props.child, props.now),
	]);
	return (
		<div class={cn("flex gap-1", props.class)}>
			<For each={instances()}>
				{(start) => {
					const instance = props.child.instance(start);
					return (
						<Timeframe
							class="flex-1"
							timescale={props.child}
							time={start}
							accented={
								Temporal.ZonedDateTime.compare(viewTime(), instance.start) >=
								0 &&
								Temporal.ZonedDateTime.compare(viewTime(), instance.end) < 0
							}
						/>
					);
				}}
			</For>
		</div>
	);
}
