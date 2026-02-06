import { initClient } from "trailbase";

export const trailBaseClient = initClient(
	import.meta.env.VITE_TRAILBASE_URL ?? "http://localhost:4000",
);

export * as executor from "./executor.gen";
export * as executor_occupied from "./executor_occupied.gen";
export * as task from "./task.gen";
