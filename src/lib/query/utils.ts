// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import type {
	DefaultError,
	MutationOptions,
	QueryOptions,
} from "@tanstack/solid-query";
import { type Database, supabase } from "../supabase";

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

export function tableQueries<
	Schema extends keyof DatabaseWithoutInternals,
	TableName extends keyof DatabaseWithoutInternals[Schema]["Tables"],
	__SelectRow extends
	DatabaseWithoutInternals[Schema]["Tables"][TableName] extends {
		Row: infer I;
	}
	? I
	: never,
	__InsertRow extends
	DatabaseWithoutInternals[Schema]["Tables"][TableName] extends {
		Insert: infer I;
	}
	? I
	: never,
	__UpdateRow extends
	DatabaseWithoutInternals[Schema]["Tables"][TableName] extends {
		Update: infer I;
	}
	? I
	: never,
>(schema: Schema, table: TableName) {
	const selectQuery = {
		queryKey: ["supabase", table, "select"],
		queryFn: async (): Promise<__SelectRow[]> => {
			const { data, error } = await supabase.from(table as any).select();
			if (error) throw error;
			return data as any;
		},
	} satisfies QueryOptions;

	const insertMutation = {
		mutationKey: ["supabase", table, "insert"],
		mutationFn: async (newtasks: __InsertRow[]) => {
			await supabase
				.schema(schema)
				.from(table as any)
				.insert(newtasks as any);
		},
	} satisfies MutationOptions<void, DefaultError, __InsertRow[]>;

	const updateMutation = {
		mutationKey: ["supabase", table, "update"],
		mutationFn: async ({
			ids,
			updates,
		}: {
			ids: string[] | number[];
			updates: __UpdateRow[];
		}) => {
			await Promise.all(
				updates.map((t, i) => {
					const id = ids[i];
					return supabase
						.from(table as any)
						.update(t as any)
						.eq("id", id);
				}),
			);
		},
	} satisfies MutationOptions<
		void,
		DefaultError,
		{
			ids: string[] | number[];
			updates: __UpdateRow[];
		}
	>;

	const deleteMutation = {
		mutationKey: ["supabase", table, "delete"],
		mutationFn: async (deletions: number[]) => {
			await supabase.from("task").delete().in("id", deletions);
		},
	} satisfies MutationOptions<void, DefaultError, number[]>;

	return {
		select: selectQuery,
		insert: insertMutation,
		update: updateMutation,
		delete: deleteMutation,
	};
}
