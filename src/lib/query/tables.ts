import { tableQueries } from "./utils";

export const tasks = tableQueries("public", "task")
export const executors = tableQueries("public", "executor")
export const timescales = tableQueries("public", "timescale")

