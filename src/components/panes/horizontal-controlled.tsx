import { createMemo, useContext } from "solid-js";
import { TaskChipContext } from "~/context/task-chip";
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
	return (
		<TaskChipContext.Provider value={{ namespace: "horizontal" }}>
			<Horizontal
				class="p-1"
				parent={ctx.state.timescale}
				child={child()}
				now={currentTime()}
			/>
		</TaskChipContext.Provider>
	);
}
