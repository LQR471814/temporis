import { randomBeta } from "d3-random";
import { Digest } from "tdigest";

export type PERTParams = {
	optimistic: number;
	expected: number;
	pessimistic: number;
};

export type Task = {
	pert: PERTParams;
	children: number[];
};

function pertGenerator(params: PERTParams) {
	const r =
		(params.expected - params.optimistic) /
		(params.pessimistic - params.optimistic);
	const alpha = 1 + 4 * r;
	const beta = 1 + 4 * (1 - r);
	const proportion = randomBeta(alpha, beta);
	const range = params.pessimistic - params.optimistic;
	return () => {
		return params.optimistic + range * proportion();
	};
}

function sample(
	buffer: number[],
	generators: (() => number)[],
	tasks: Task[],
): number {
	for (let i = 0; i < tasks.length; i++) {
		buffer[i] = generators[i]();
	}
	for (let i = tasks.length - 1; i >= 0; i--) {
		const t = tasks[i];
		if (t.children.length === 0) {
			continue;
		}
		const proportion = buffer[i];
		let sum = 0;
		for (const child of t.children) {
			sum += buffer[child];
		}
		buffer[i] = sum / proportion;
	}
	return buffer[0];
}

function simulate(digest: Digest, trials: number, tasks: Task[]) {
	const generators = new Array(tasks.length);
	for (let i = 0; i < tasks.length; i++) {
		generators[i] = pertGenerator(tasks[i].pert);
	}
	const buffer = new Array<number>(tasks.length).fill(0);
	for (let i = 0; i < trials; i++) {
		const value = sample(buffer, generators, tasks);
		digest.push(value);
	}
}

// computes the task time for the task based on its children. (or lack thereof)
//
// NOTE: you pass in a BFS queue of the task and its children, it should start
// with the first level, then go down 1 level at a time.
export function taskTimeDigest(tasks: Task[]) {
	const digest = new Digest();
	simulate(digest, 10000, tasks);
	return digest;
}
