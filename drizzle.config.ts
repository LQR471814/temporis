// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./schema/schema.ts",
	dbCredentials: {
		url: process.env.DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
	},
});
