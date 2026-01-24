// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/solid-db";
import type { QueryOptions } from "@tanstack/solid-query";
import { queryClient } from "../query";

export function tableQueryCollection<
	T extends {
		select: QueryOptions;
		insert: { mutationFn: (variables: any) => Promise<void> };
		update: { mutationFn: (variables: any) => Promise<void> };
		delete: { mutationFn: (variables: any) => Promise<void> };
	},
	__Row extends ReturnType<
		T["select"]["queryFn"] extends (variables: any) => any
		? T["select"]["queryFn"]
		: () => never
	> extends Promise<(infer U)[]>
	? U
	: never,
>(table: T, getKey: (i: __Row) => string | number) {
	return createCollection(
		queryCollectionOptions({
			...table.select,
			getKey,
			queryClient,
			onInsert: async ({ transaction }: any) => {
				await table.insert.mutationFn(
					transaction.mutations.map((m: any) => m.modified),
				);
			},
			onUpdate: async ({ transaction }: any) => {
				await table.update.mutationFn(
					transaction.mutations.map((m: any) => ({
						...m.changes,
						id: m.key,
					})),
				);
			},
			onDelete: async ({ transaction }: any) => {
				await table.delete.mutationFn(
					transaction.mutations.map((m: any) => m.key),
				);
			},
		} as any),
	);
}
