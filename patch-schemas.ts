import { readFileSync, writeFileSync } from "node:fs";

const contents = readFileSync("./src/lib/supabase/schemas.gen.ts", "utf8");
const newContents = contents
	.replaceAll(
		"timeframe_start: z.string()",
		"timeframe_start: z.union([z.string(), z.date()]).transform((v) => asUTCDate(v + \"Z\"))",
	)
	.replaceAll(
		"id: z.string()",
		"id: z.string().default(() => crypto.randomUUID())",
	);
writeFileSync("./src/lib/supabase/schemas.gen.ts", `import { asUTCDate } from "~/lib/utils"
${newContents}`);
