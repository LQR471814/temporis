import { createMemo, useContext } from "solid-js";
import { useCurrentTime, ViewContext } from "~/context/view";
import * as timescales from "~/lib/timescales";
import { Horizontal } from "../horizontal";

export function HorizontalControlled() {
	const ctx = useContext(ViewContext);
	if (!ctx) {
		return <p>ViewContext.Provider is missing</p>;
	}
	const child = createMemo(() => {
		const p = ctx.state.timescale;
		for (let i = 0; i < timescales.hierarchy.length; i++) {
			if (p === timescales.hierarchy[i]) {
				return timescales.hierarchy[i + 1];
			}
		}
		throw new Error("no child found");
	});
	const currentTime = useCurrentTime();
	// const coarseTime = useCurrentTime();
	// const [fineOffset, setFineOffset] = createSignal(0);
	// const currentTime = createMemo(() => {
	// 	let cursor = coarseTime();
	// 	for (let i = 0; i < fineOffset(); i++) {
	// 		const instance = child().instance(cursor);
	// 		cursor = instance.end;
	// 	}
	// 	return cursor;
	// });
	return (
		<Horizontal
			class="p-1"
			parent={ctx.state.timescale}
			child={child()}
			now={currentTime()}
		/>
	);
	// return (
	// 	<div class="relative h-full p-1">
	// 		<div class="absolute left-2 bottom-2 w-[calc(100%-1rem)] flex justify-between gap-1">
	// 			<Button
	// 				class="p-1 w-6 h-6 text-primary/30"
	// 				variant="ghost"
	// 				onClick={() => {
	// 					setFineOffset((prev) => prev - 1);
	// 				}}
	// 			>
	// 				<svg
	// 					xmlns="http://www.w3.org/2000/svg"
	// 					viewBox="0 0 24 24"
	// 					fill="currentColor"
	// 				>
	// 					<title>Arrow Left</title>
	// 					<path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z"></path>
	// 				</svg>
	// 			</Button>
	// 			<Button
	// 				class="p-1 w-6 h-6 text-primary/30"
	// 				variant="ghost"
	// 				onClick={() => {
	// 					setFineOffset((prev) => prev + 1);
	// 				}}
	// 			>
	// 				<svg
	// 					xmlns="http://www.w3.org/2000/svg"
	// 					viewBox="0 0 24 24"
	// 					fill="currentColor"
	// 				>
	// 					<title>Arrow Right</title>
	// 					<path d="M13.1717 12.0007L8.22192 7.05093L9.63614 5.63672L16.0001 12.0007L9.63614 18.3646L8.22192 16.9504L13.1717 12.0007Z"></path>
	// 				</svg>
	// 			</Button>
	// 		</div>
	// 	</div>
	// );
}
