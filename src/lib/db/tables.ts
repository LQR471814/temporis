import { executors, tasks, timescales } from "../query";
import { publicExecutorRowSchema, publicTaskRowSchema, publicTimescaleRowSchema } from "../supabase";
import { tableQueryCollection } from "./utils";

export const tasksCollection = tableQueryCollection(tasks, (i) => i.id, publicTaskRowSchema);
export const executorsCollection = tableQueryCollection(executors, (i) => i.id, publicExecutorRowSchema);
export const timescaleCollection = tableQueryCollection(timescales, (i) => i.id, publicTimescaleRowSchema);
