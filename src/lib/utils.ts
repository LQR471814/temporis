import { type ClassValue, clsx } from "clsx";
import { Generator } from "snowflake-generator";
import {
	createMemo,
	createEffect,
	createRoot,
	createSignal,
	onCleanup,
	type Accessor,
} from "solid-js";
import { createStore } from "solid-js/store";
import { twMerge } from "tailwind-merge";
import {
	createLiveQueryCollection,
	BaseQueryBuilder,
	type Context,
	type InitialQueryBuilder,
	type QueryBuilder,
	type GetResult,
} from "@tanstack/solid-db";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const [now, setNow] = createSignal(Temporal.Now.zonedDateTimeISO());
createRoot(() => {
	createEffect(() => {
		const interval = setInterval(
			() => {
				setNow(Temporal.Now.zonedDateTimeISO());
			},
			60 * 1000 * 1000,
		);
		return () => {
			clearInterval(interval);
		};
	});
});
export { now };

export function currentTz() {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function asInstant(dt: string | Date | number) {
	if (typeof dt === "number") {
		return Temporal.Instant.fromEpochMilliseconds(dt);
	}
	if (dt instanceof Date) {
		return Temporal.Instant.from(dt.toISOString());
	}
	if (dt.endsWith("Z")) {
		return Temporal.Instant.from(dt);
	}
	return Temporal.Instant.from(`${dt}Z`);
}

export function asUTCDate(dt: string | Date) {
	if (dt instanceof Date) {
		return dt;
	}
	if (dt.endsWith("Z")) {
		return new Date(dt);
	}
	return new Date(`${dt}Z`);
}

export function randomSnowflakeID() {
	const generator = new Generator(Temporal.Now.instant().epochMilliseconds);
	return generator.generate() as bigint;
}

// this is because reconcile tends to break things sometimes
export function useLiveQueryNoReconcile<TContext extends Context>(
	queryFn: (q: InitialQueryBuilder) => QueryBuilder<TContext>,
): Accessor<Array<GetResult<TContext>>> {
	const collection = createMemo(() => {
		const queryBuilder = new BaseQueryBuilder() as InitialQueryBuilder;
		return createLiveQueryCollection({
			query: queryFn(queryBuilder),
			startSync: true,
		});
	});
	const [value, setValue] = createStore<unknown[]>([]);
	createEffect(() => {
		setValue(() => Array.from(collection().values()));
		const subscription = collection().subscribeChanges(() => {
			setValue(() => Array.from(collection().values()));
		});
		onCleanup(() => {
			subscription.unsubscribe();
		});
	});
	// biome-ignore lint/suspicious/noExplicitAny: typescript pain
	return () => value as any;
}
