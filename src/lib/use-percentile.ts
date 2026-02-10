import { debounce } from "@tanstack/pacer";
import { type Accessor, createEffect, createSignal } from "solid-js";
import { evalStats } from "src/workers/stats-worker.client";

const cachedPercentiles = new Map<string, number | Promise<number>>();

export function usePercentileDuration(
	percentile: Accessor<number>,
	tasks: Accessor<
		{
			id: string;
			optimistic: number;
			expected: number;
			pessimistic: number;
		}[]
	>,
	dependencies: Accessor<
		{
			id: string;
			optimistic: number;
			expected: number;
			pessimistic: number;
		}[]
	>,
) {
	const [state, setState] = createSignal<
		{ duration: number; error: null } | { duration: null; error: Error } | null
	>(null);

	const calculate = debounce(
		(
			tasks: {
				id: string;
				optimistic: number;
				expected: number;
				pessimistic: number;
			}[],
			dependencies: {
				id: string;
				optimistic: number;
				expected: number;
				pessimistic: number;
			}[],
			p: number,
		) => {
			let hash = "";
			for (const t of tasks) {
				hash += `${p}|${t.optimistic}:${t.expected}:${t.pessimistic},`;
			}
			for (const t of dependencies) {
				hash += `|${t.optimistic}:${t.expected}:${t.pessimistic},`;
			}
			const cached = cachedPercentiles.get(hash);
			if (typeof cached === "number") {
				setState({ duration: cached, error: null });
				return;
			}

			setState(null);

			const promise =
				cached instanceof Promise
					? cached
					: evalStats(
							tasks.map((t) => t.id),
							{
								type: "percentile",
								percentile: p,
							},
						);

			cachedPercentiles.set(hash, promise);

			promise
				.then((dur) => {
					setState({ duration: dur, error: null });
					cachedPercentiles.set(hash, dur);
				})
				.catch((err) => {
					console.error(err);
					setState({ duration: null, error: err });
				});
		},
		{ wait: 100 },
	);

	createEffect(() => {
		calculate(tasks(), dependencies(), percentile());
	});

	return state;
}
