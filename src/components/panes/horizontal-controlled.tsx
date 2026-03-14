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
			<div class="h-[100vh] overflow-y-auto" ref={scrollRef}>
				<div class="flex-1 flex flex-col gap-1 pt-16">
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
									parent={parent()}
									child={scale}
									now={viewInstant()}
								/>
							);
						}}
					</For>
				</div>
			</div>
		</TaskChipContext.Provider>
	);
}
