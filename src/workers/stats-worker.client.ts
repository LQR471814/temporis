import { tasksCollection } from "src/lib/db";
import type { Task } from "src/lib/stats";
import type { Action, Request } from "./stats-worker";

const worker = new Worker(new URL("./stats-worker.ts", import.meta.url), {
	type: "module",
});

const pending: {
	id: string;
	resolve: (n: number) => void;
	reject: (err: Error) => void;
}[] = [];

worker.onmessage = (e) => {
	if ("error" in e.data) {
		const data = e.data as { id: string; error: Error };
		for (let i = 0; i < pending.length; i++) {
			const { id, reject } = pending[i];
			if (id === data.id) {
				pending.splice(i, 1);
				reject(data.error);
				return;
			}
		}
		return;
	}
	const data = e.data as { id: string; value: number };
	for (let i = 0; i < pending.length; i++) {
		const { id, resolve } = pending[i];
		if (id === data.id) {
			pending.splice(i, 1);
			resolve(data.value);
			return;
		}
	}
};

export function evalStats(taskIds: string[], action: Action) {
	const tasks: Task[] = [];
	getTaskBFS(tasks, taskIds);

	if (taskIds.length > 1) {
		const rootChildren: number[] = [];
		for (let i = 0; i < taskIds.length; i++) {
			rootChildren.push(i + 1);
		}
		tasks.splice(0, 0, {
			pert: {
				optimistic: 0.99,
				expected: 0.999,
				pessimistic: 1,
			},
			children: rootChildren,
		});
	}

	const reqId = taskIds.join(",");
	return new Promise<number>((res, rej) => {
		pending.push({
			id: reqId,
			resolve: res,
			reject: rej,
		});
		worker.postMessage({ id: reqId, action, tasks } satisfies Request);
	});
}

function getTaskBFS(result: Task[], ids: string[]) {
	const queue: string[] = [...ids];
	while (true) {
		const id = queue.pop();
		if (id === undefined) {
			break;
		}
		const task = tasksCollection.get(id);
		if (!task) {
			throw new Error(`could not find task: ${id}`);
		}
		const resultTask: Task = {
			pert: {
				pessimistic: task.pessimistic,
				expected: task.expected,
				optimistic: task.optimistic,
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
