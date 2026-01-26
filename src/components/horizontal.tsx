import { createMemo, createSignal, For } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import {
	childInstancesOf,
	day,
	daypart,
	decade,
	fiveyear,
	month,
	quarter,
	semester,
	week,
	year,
} from "~/lib/timescales";
import { cn, now } from "~/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const hierarchy = [
	decade,
	fiveyear,
	year,
	semester,
	quarter,
	month,
	week,
	day,
	daypart,
];
const options = hierarchy.slice(0, hierarchy.length - 1).map((h) => h.name);

export function HorizontalTimeframes(props: { class?: string }) {
	const [parent, setParent] = createSignal(week);
	const child = createMemo(() => {
		const p = parent();
		for (let i = 0; i < hierarchy.length; i++) {
			if (p === hierarchy[i]) {
				return hierarchy[i + 1];
			}
		}
		throw new Error("no child found");
	});
	const instances = createMemo(() => [
		...childInstancesOf(parent(), child(), now()),
	]);

	return (
		<div class="flex flex-col h-full w-full">
			<div class="px-1 pt-1">
				<Select
					value={parent().name}
					onChange={(value) => {
						const found = hierarchy.find((h) => h.name === value);
						if (!found) {
							return;
						}
						setParent(found);
					}}
					options={options}
					placeholder="Select a timescale…"
					itemComponent={(props) => (
						<SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
					)}
				>
					<SelectTrigger aria-label="Fruit" class="w-[180px] px-3 py-0">
						<SelectValue<string>>
							{(state) => state.selectedOption()}
						</SelectValue>
					</SelectTrigger>
					<SelectContent />
				</Select>
			</div>
			<div class={cn("flex gap-1 w-full p-1", props.class)}>
				<For each={instances()}>
					{(start) => (
						<Timeframe class="flex-1" timescale={child()} time={start} />
					)}
				</For>
			</div>
		</div>
	);
}
