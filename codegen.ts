import { writeFile } from "node:fs/promises";
import { type } from "arktype";

const property = type({
	type: "'string' | 'number' | 'integer'",
});

const jsonSchema = type({
	type: "'object'",
	properties: type({ "[string]": property }),
	required: "string[]",
});

function transformTable(
	schema: typeof jsonSchema.infer,
): Record<string, unknown> {
	if (schema.type !== "object") {
		throw new Error("root schema type is not object");
	}
	const out: Record<string, unknown> = {};
	for (const [key, { type: propType }] of Object.entries(schema.properties)) {
		let arktype: string = propType;
		if (propType === "integer") {
			if (key === "id" || key === "parent_id" || key === "assigned_to") {
				arktype = "bigint";
			} else {
				arktype = "number";
			}
		}
		const required = schema.required.indexOf(key) >= 0 || key === "id";
		out[key] = arktype + (!required ? " | undefined" : "");
	}
	return out;
}

async function genRecord(name: string) {
	const res = await fetch(
		`http://localhost:4000/api/records/v1/${name}/schema`,
	);

	const schema = jsonSchema(await res.json());
	if (schema instanceof type.errors) {
		throw new Error(schema.summary);
	} else {
	}

	const code = transformTable(schema as typeof jsonSchema.infer);

	const file = `import { type } from "arktype"
export const schema = type(${JSON.stringify(code)})`;
	await writeFile(`./src/lib/trailbase/${name}.gen.ts`, file, "utf8");
}

genRecord("task");
genRecord("executor");
genRecord("executor_occupied");
