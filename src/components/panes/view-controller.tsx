import { createMemo, Show, useContext } from "solid-js";
import { Button } from "~/components/ui/button";
import * as Select from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useCurrentTime, ViewContext } from "~/context/view";
import * as timescales from "~/lib/timescales";

const options = timescales.hierarchy
	.slice(0, timescales.hierarchy.length - 1)
	.map((h) => h.name);

export function ViewController() {
	const ctx = useContext(ViewContext);
	const currentTime = useCurrentTime();
	const startOfYear = createMemo(() =>
		currentTime().with({ month: 1, day: 1 }),
	);
	if (!ctx) {
		return <p>ViewContext.Provider is missing</p>;
	}
	return (
		<div class="flex flex-wrap gap-1 p-1">
			<Select.Select
				value={ctx.state.timescale.name}
				onChange={(value) => {
					const found = timescales.hierarchy.find((h) => h.name === value);
					if (!found) {
						return;
					}
					ctx.setTimescale(found);
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
			<div class="flex gap-1">
				<Button
					class="text-primary/20"
					variant="outline"
					onClick={() => {
						ctx.backward();
					}}
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
					onClick={() => {
						ctx.forward();
					}}
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
			</div>
			<Button
				class="text-primary/20"
				variant="outline"
				onClick={() => {
					ctx.reset();
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
			<div class="flex px-2 text-sm">
				<div class="my-auto flex gap-2">
					<span class="m-0">{currentTime().year}</span>
					<Show
						when={
							Temporal.Duration.compare(
								ctx.timescaleDuration(),
								{ years: 1 },
								{ relativeTo: startOfYear() },
							) < 0
						}
					>
						<Separator class="h-5" orientation="vertical" />
						<span class="m-0">
							{Intl.DateTimeFormat(undefined, { month: "long" }).format(
								new Date(currentTime().toInstant().toString()),
							)}
						</span>
					</Show>
					<Show
						when={
							Temporal.Duration.compare(
								ctx.timescaleDuration(),
								{ weeks: 1 },
								{ relativeTo: startOfYear() },
							) < 0
						}
					>
						<Separator class="h-5" orientation="vertical" />
						<span class="m-0">{currentTime().day}</span>
					</Show>
					<Show
						when={
							Temporal.Duration.compare(
								ctx.timescaleDuration(),
								{ days: 1 },
								{ relativeTo: startOfYear() },
							) < 0
						}
					>
						<Separator class="h-5" orientation="vertical" />
						<span class="m-0">
							{currentTime().hour}:{currentTime().minute}
						</span>
					</Show>
				</div>
			</div>
		</div>
	);
}
