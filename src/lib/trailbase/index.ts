import { initClient } from "trailbase";

export const trailBaseClient = initClient(
	import.meta.env.VITE_TRAILBASE_URL ?? "http://localhost:4000",
);

export * from "./types.gen";
