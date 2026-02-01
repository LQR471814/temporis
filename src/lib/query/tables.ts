import { publicExecutorRowSchema, publicTaskRowSchema } from "../supabase";
import { tableQueries } from "./utils";

export const tasks = tableQueries("public", "task", publicTaskRowSchema);
export const executors = tableQueries(
	"public",
	"executor",
	publicExecutorRowSchema,
);
