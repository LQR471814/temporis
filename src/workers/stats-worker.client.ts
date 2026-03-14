import { tasksCollection } from "src/lib/collections";
import { ImplementationType } from "src/lib/constants";
import type { Task } from "src/lib/stats";
import type { Action, Request } from "./stats-worker";

function getTaskBFS(result: Task[], ids: string[]) {
	const queue: string[] = [...ids];
	if (ids.length > 1) {
		result.push({
			pert: {
				optimistic: 1,
				expected: 1,
				pessimistic: 1,
			},
			children: ids.map((_, i) => i + 1),
		});
	}
	while (true) {
		const id = queue.pop();
		if (id === undefined) {
			break;
		}
		const task = tasksCollection.get(id.toString());
		if (!task) {
			throw new Error(`could not find task: ${id}`);
		}
		const resultTask: Task = {
			pert:
				task.implementation === ImplementationType.hours
					? {
						pessimistic: task.pessimistic,
						expected: task.expected,
						optimistic: task.optimistic,
					}
					: // convert percentage to proportion
					{
						pessimistic: task.pessimistic / 100,
						expected: task.expected / 100,
						optimistic: task.optimistic / 100,
					},
			children: [],
		};
		for (const [, row] of tasksCollection.entries()) {
			if (row.parent_id === id) {
				queue.push(row.id);
				// every task popped off the queue will certainly be pushed to
				// the result stack without any tasks being pushed to the
				// result before it
				//
				// this means that if you push elements to the queue in some
				// order, those elements will eventually end up in the stack in
				// the exact same order
				//
				// this means that if you want to compute what the
				// corresponding index of an element on the queue is on the
				// stack, you would simply do:
				//
				// # of additional elements on the stack if all elements in
				// queue up to and including the queue element were added to
				// the stack = queue index + 1
				//
				// stack index = current last stack index + (queue index + 1)
				//
				// queue index + 1 = current queue length - 1 + 1 = current queue length
				resultTask.children.push(result.length + queue.length);
			}
		}
		result.push(resultTask);
	}
}

class RequestQueue {
	pending: Map<
		string,
		{
			resolve: (n: number) => void;
			reject: (err: Error) => void;
		}
	>;
	queue: {
		id: string;
		action: Action;
		tasks: Task[];
	}[];

	constructor() {
		this.pending = new Map();
		this.queue = [];
	}

	push(taskIds: string[], action: Action): Promise<number> {
		const tasks: Task[] = [];
		getTaskBFS(tasks, taskIds);

		const reqId = taskIds.join(",");

		this.queue.push({
			id: reqId,
			action,
			tasks,
		});
		return new Promise<number>((res, rej) => {
			this.pending.set(reqId, {
				resolve: res,
				reject: rej,
			});
		});
	}

	pop(): Request | undefined {
		if (this.queue.length === 0) {
			return;
		}
		return this.queue.splice(0, 1)[0];
	}

	resolve(id: string, result: number) {
		const value = this.pending.get(id);
		if (!value) {
			throw new Error(`unknown id: ${id}`);
		}
		value.resolve(result);
	}

	reject(id: string, err: Error) {
		const value = this.pending.get(id);
		if (!value) {
			throw new Error(`unknown id: ${id}`);
		}
		value.reject(err);
	}
}

class WorkerConnection {
	webworker: Worker;
	queue: RequestQueue;

	constructor(queue: RequestQueue) {
		this.queue = queue;
		this.webworker = new Worker(new URL("./stats-worker.ts", import.meta.url), {
			type: "module",
		});
		this.webworker.onmessage = (e) => {
			if ("error" in e.data) {
				const data = e.data as { id: string; error: Error };
				this.queue.reject(data.id, data.error);
				return;
			}
			const data = e.data as { id: string; value: number };
			this.queue.resolve(data.id, data.value);
		};
	}

	runFromQueue() {
		const req = this.queue.pop();
		if (!req) {
			return;
		}
		this.webworker.postMessage(req);
	}
}

// simple round-robin load balancing
class WorkerPool {
	workers: WorkerConnection[];
	queue: RequestQueue;
	cursor: number;

	constructor(size: number) {
		this.queue = new RequestQueue();
		this.workers = [];
		for (let i = 0; i < size; i++) {
			this.workers.push(new WorkerConnection(this.queue));
		}
		this.cursor = 0;
	}

	evalStats(taskIds: string[], action: Action) {
		const promise = this.queue.push(taskIds, action);
		const target = this.workers[this.cursor];
		target.runFromQueue();
		this.cursor++;
		if (this.cursor >= this.workers.length) {
			this.cursor = 0;
		}
		return promise;
	}
}

const pool = new WorkerPool(4);

export function evalStats(taskIds: string[], action: Action) {
	return pool.evalStats(taskIds, action);
}
