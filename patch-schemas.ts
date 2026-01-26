import { readFileSync, writeFileSync } from "node:fs";

const contents = readFileSync("./src/lib/supabase/schemas.gen.ts", "utf8");
const newContents = contents.replaceAll(
	"timeframe_start: z.string()",
	"timeframe_start: z.string().transform((v) => Temporal.Instant.from(v).toZonedDateTimeISO(Intl.DateTimeFormat().resolvedOptions().timeZone))",
);
writeFileSync("./src/lib/supabase/schemas.gen.ts", newContents);
