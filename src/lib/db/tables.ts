import { executors, tasks, timescales } from "../query";
import { tableQueryCollection } from "./utils";

export const tasksCollection = tableQueryCollection(tasks, (i) => i.id);
export const executor = tableQueryCollection(executors, (i) => i.id);
export const timescale = tableQueryCollection(timescales, (i) => i.id);
