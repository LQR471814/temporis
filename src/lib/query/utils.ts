// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import type { StandardSchema } from "@tanstack/solid-db";
import type {
	DefaultError,
	MutationOptions,
	QueryOptions,
} from "@tanstack/solid-query";
import { type Database, supabase } from "../supabase";

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

export function tableQueries<
	DBSchema extends keyof DatabaseWithoutInternals,
	TableName extends keyof DatabaseWithoutInternals[DBSchema]["Tables"],
	Schema extends StandardSchema<unknown>,
	__SelectRow extends
	DatabaseWithoutInternals[DBSchema]["Tables"][TableName] extends {
		Row: infer I;
	}
	? I
	: never,
	__InsertRow extends
	DatabaseWithoutInternals[DBSchema]["Tables"][TableName] extends {
		Insert: infer I;
	}
	? I
	: never,
	__UpdateRow extends
	DatabaseWithoutInternals[DBSchema]["Tables"][TableName] extends {
		Update: infer I;
	}
	? I
	: never,
>(schema: DBSchema, table: TableName, validator: Schema) {
	// must validate server data manually since tanstack db doesn't do it
	// automatically
	// https://tanstack.com/db/latest/docs/guides/schemas#core-concepts-tinput-vs-toutput
	const selectQuery = {
		queryKey: ["supabase", table, "select"],
		queryFn: async (): Promise<__SelectRow[]> => {
			const { data, error } = await supabase.from(table as any).select();
			if (error) throw error;
			const result = (
				await Promise.all(data.map((v) => validator["~standard"].validate(v)))
			).map((res) => {
				if (res.issues) {
					throw new Error(
						`Validation errors:
${res.issues.map((i) => i.message).join(", ")}`,
					);
				}
				return res.value;
			});
			return result as any;
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
		mutationFn: async (deletions: string[]) => {
			await supabase.from("task").delete().in("id", deletions);
		},
	} satisfies MutationOptions<void, DefaultError, string[]>;

	return {
		select: selectQuery,
		insert: insertMutation,
		update: updateMutation,
		delete: deleteMutation,
	};
}
