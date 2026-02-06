function record-schema {
	curl "http://localhost:4000/api/records/v1/$1/schema" -o ".schema.$1.json"
	echo ".schema.$1.json"
}

pnpm exec quicktype -o "./src/lib/trailbase/types.gen.ts" \
	"$(record-schema task)" \
	"$(record-schema executor)" \
	"$(record-schema executor_occupied)"

rm .schema.*.json

