import { debounce } from "@tanstack/pacer";
import {
	BaseQueryBuilder,
	type Context,
	createLiveQueryCollection,
	type GetResult,
	type InitialQueryBuilder,
	type QueryBuilder,
} from "@tanstack/solid-db";
import { type ClassValue, clsx } from "clsx";
import {
	type Accessor,
	onMount,
	createEffect,
	createMemo,
	onCleanup,
} from "solid-js";
import { createStore } from "solid-js/store";
import { twMerge } from "tailwind-merge";
import { v7 as uuidv7 } from "uuid";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

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

export function generateID() {
	return uuidv7();
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

export function useBottomScrollRef() {
	let scrollEl!: HTMLDivElement;
	onMount(() => {
		setTimeout(() => {
			scrollEl.scrollTop = scrollEl.scrollHeight;
		}, 500);
	});
	return (el: HTMLDivElement) => {
		scrollEl = el;
	};
}
