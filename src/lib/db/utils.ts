// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, type StandardSchema } from "@tanstack/solid-db";
import type { QueryKey, QueryOptions } from "@tanstack/solid-query";
import { queryClient } from "../query";

export function tableQueryCollection<
	T extends {
		select: Omit<QueryOptions, "queryKey"> & { queryKey: QueryKey };
		insert: { mutationFn: (variables: any) => Promise<void> };
		update: { mutationFn: (variables: any) => Promise<void> };
		delete: { mutationFn: (variables: any) => Promise<void> };
	},
	GetKey extends (i: __Row) => string | number,
	Schema extends StandardSchema<unknown>,
	__Row extends ReturnType<
		T["select"]["queryFn"] extends (variables: any) => any
		? T["select"]["queryFn"]
		: () => never
	> extends Promise<(infer U)[]>
	? U
	: never,
>(table: T, getKey: GetKey, schema: Schema) {
	return createCollection(
		queryCollectionOptions<
			Schema,
			T["select"]["queryFn"],
			T["select"]["queryKey"],
			ReturnType<GetKey>
		>({
			...table.select,
			schema,
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

