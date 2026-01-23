import type { QueryOptions } from "@tanstack/solid-query";
import { supabase } from "../supabase";

export const tasksQuery = {
	queryKey: ["supabase", "tasks"],
	queryFn: async () => {
		const { data, error } = await supabase.from("task").select();
		if (error) throw error;
		return data;
	},
} satisfies QueryOptions;
