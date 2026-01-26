import { executors, tasks } from "../query";
import { publicExecutorRowSchema, publicTaskRowSchema } from "../supabase";
import { tableQueryCollection } from "./utils";

export const tasksCollection = tableQueryCollection(tasks, (i) => i.id, publicTaskRowSchema);
export const executorsCollection = tableQueryCollection(
	executors,
	(i) => i.id,
	publicExecutorRowSchema,
);
