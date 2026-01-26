import { createEffect, createMemo, createSignal, For } from "solid-js";
import { Timeframe } from "~/components/timeframe";
import * as timescales from "~/lib/timescales";
import { cn, now } from "~/lib/utils";
import * as Select from "./ui/select";
import { Button } from "./ui/button";

const hierarchy = [
	timescales.decade,
	timescales.fiveyear,
	timescales.year,
	timescales.semester,
	timescales.quarter,
	timescales.month,
	timescales.week,
	timescales.day,
	timescales.daypart,
];
const options = hierarchy.slice(0, hierarchy.length - 1).map((h) => h.name);

export function Display(props: {
	parent: timescales.Timescale;
	child: timescales.Timescale;
	now: Temporal.ZonedDateTime;
	class?: string;
}) {
	const instances = createMemo(() => [
		...timescales.childInstancesOf(props.parent, props.child, props.now),
	]);
	return (
		<div class={cn("flex gap-1 h-full w-full p-1", props.class)}>
			<For each={instances()}>
				{(start) => (
					<Timeframe class="flex-1" timescale={props.child} time={start} />
				)}
			</For>
		</div>
	);
}

export function Control() {
	const [offset, setOffset] = createSignal<Temporal.Duration>(
		Temporal.Duration.from({ seconds: 0 }),
	);
	const currentTime = createMemo(() => now().add(offset()));

	const [parent, setParent] = createSignal(timescales.week);
	const child = createMemo(() => {
		const p = parent();
		for (let i = 0; i < hierarchy.length; i++) {
			if (p === hierarchy[i]) {
				return hierarchy[i + 1];
			}
		}
		throw new Error("no child found");
	});
	const parentDuration = createMemo(() => {
		const instance = parent().instance(currentTime());
		return instance.end.since(instance.start);
	});

	return (
		<div class="flex flex-col h-full w-full">
			<div class="flex gap-1 px-1 pt-1">
				<Select.Select
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
						<Select.SelectItem item={props.item}>
							{props.item.rawValue}
						</Select.SelectItem>
					)}
				>
					<Select.SelectTrigger aria-label="Fruit" class="w-[180px] px-3 py-0">
						<Select.SelectValue<string>>
							{(state) => state.selectedOption()}
						</Select.SelectValue>
					</Select.SelectTrigger>
					<Select.SelectContent />
				</Select.Select>
				<Button
					class="text-primary/20"
					variant="outline"
					onClick={[
						(duration: Temporal.Duration) => {
							setOffset((prev) => prev.subtract(duration));
						},
						parentDuration(),
					]}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<title>Left Arrow</title>
						<path d="M7.82843 10.9999H20V12.9999H7.82843L13.1924 18.3638L11.7782 19.778L4 11.9999L11.7782 4.22168L13.1924 5.63589L7.82843 10.9999Z"></path>
					</svg>
				</Button>
				<Button
					class="text-primary/20"
					variant="outline"
					onClick={[
						(duration: Temporal.Duration) => {
							setOffset((prev) => prev.add(duration));
						},
						parentDuration(),
					]}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<title>Right Arrow</title>
						<path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
					</svg>
				</Button>
				<Button
					class="text-primary/20"
					variant="outline"
					onClick={() => {
						setOffset(Temporal.Duration.from({ seconds: 0 }));
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<title>Reset</title>
						<path d="M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"></path>
					</svg>
				</Button>
			</div>
			<Display parent={parent()} child={child()} now={currentTime()} />
		</div>
	);
}
