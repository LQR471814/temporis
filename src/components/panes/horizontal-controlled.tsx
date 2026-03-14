import { For, createMemo, useContext } from "solid-js";
import { TaskChipContext } from "src/context/task-chip";
import { useViewTimeInstant, ViewContext } from "src/context/view";
import * as timescales from "src/lib/timescales";
import { Horizontal } from "../horizontal";
import { useBottomScrollRef } from "src/lib/utils";

export function HorizontalControlled() {
	const ctx = useContext(ViewContext);
	if (!ctx) {
		return <p>ViewContext.Provider is missing</p>;
	}
	const viewInstant = useViewTimeInstant();
	const scrollRef = useBottomScrollRef();
	return (
		<TaskChipContext.Provider value={{ namespace: "horizontal" }}>
			<div class="flex-1 flex flex-col overflow-y-auto pt-16" ref={scrollRef}>
				<For each={timescales.hierarchy}>
					{(scale, i) => {
						const parent = createMemo(() => {
							if (i() - 1 < 0) {
								return timescales.ninety;
							}
							return timescales.hierarchy[i() - 1];
						});
						return (
							<Horizontal
								class="p-1 max-h-[300px]"
								parent={parent()}
								child={scale}
								now={viewInstant()}
							/>
						);
					}}
				</For>
			</div>
		</TaskChipContext.Provider>
	);
}
