function gen-record {
	curl "http://localhost:4000/api/records/v1/$1/schema" | pnpm exec quicktype -o "./src/lib/trailbase/$1.gen.ts"
}

gen-record task
gen-record executor
gen-record executor_occupied

