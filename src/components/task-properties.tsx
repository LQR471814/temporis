import {
	createCollection,
	useLiveQuery,
	eq,
	liveQueryCollectionOptions,
	type Collection,
} from "@tanstack/solid-db";
import { tasksCollection } from "~/lib/db";
import type { TimescaleInstance } from "~/lib/timescales";
import {
	createForm,
	type AnyFieldApi,
	type FieldApi,
} from "@tanstack/solid-form";
import { FieldInfo } from "./field-info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
	TextField,
	TextFieldInput,
	type TextFieldInputProps,
	TextFieldLabel,
	TextFieldTextArea,
} from "./ui/text-field";

// TODO: improve this hack!
const __collection = createCollection(
	liveQueryCollectionOptions({
		query: (q) => q.from({ task: tasksCollection }),
	}),
);
type TaskFields = Omit<
	typeof __collection extends Collection<infer U> ? U : never,
	"id"
>;

function FormMultilineText(props: {
	field: FieldApi<
		any,
		any,
		string,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any
	>;
	label: string;
	placeholder?: string;
}) {
	return (
		<TextField>
			<TextFieldLabel for={props.field.name}>{props.label}</TextFieldLabel>
			<TextFieldTextArea
				id={props.field.name}
				name={props.field.name}
				placeholder={props.placeholder}
				onBlur={props.field.handleBlur}
				onInput={(e) => props.field.handleChange(e.currentTarget.value)}
			/>
			<FieldInfo field={props.field} />
		</TextField>
	);
}

function FormTextField<
	T extends AnyFieldApi,
	// typescript madness
	__Return extends T extends FieldApi<
		any,
		any,
		infer U,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any,
		any
	>
	? U
	: never,
>(props: {
	field: T;
	transform: (text: string) => __Return;
	type: TextFieldInputProps<"input">["type"];
	label: string;
	placeholder?: string;
}) {
	return (
		<TextField>
			<TextFieldLabel for={props.field.name}>{props.label}</TextFieldLabel>
			<TextFieldInput
				id={props.field.name}
				type={props.type}
				name={props.field.name}
				placeholder={props.placeholder}
				onBlur={props.field.handleBlur}
				onInput={(e) =>
					props.field.handleChange(props.transform(e.currentTarget.value))
				}
			/>
			<FieldInfo field={props.field} />
		</TextField>
	);
}

function Fields(props: {
	task: TaskFields;
	onSubmit: (task: TaskFields) => void;
}) {
	const form = createForm(() => ({
		defaultValues: props.task,
		onSubmit: ({ value }) => {
			props.onSubmit(value);
		},
	}));
	return (
		<div class="flex flex-col flex-wrap">
			<form.Field
				name="name"
				validators={{
					onChange: ({ value }) => (!value ? "Name is required" : undefined),
				}}
				children={(field) => (
					<FormTextField
						field={field()}
						transform={(v) => v}
						label="Name:"
						type="text"
						placeholder="Task 1"
					/>
				)}
			/>
			<form.Field
				name="comments"
				children={(field) => (
					<FormMultilineText
						field={field()}
						label="Comments:"
						placeholder="Comments..."
					/>
				)}
			/>

			<Tabs defaultValue="account" class="w-[400px]">
				<TabsList class="grid w-full grid-cols-2">
					<TabsTrigger value="hours">Hours</TabsTrigger>
					<TabsTrigger value="children">
						Children is how much % of total?
					</TabsTrigger>
				</TabsList>
				<TabsContent value="hours">
					<form.Field
						name="pessimistic"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Pessimistic (hours):"
								type="text"
								placeholder=""
							/>
						)}
					/>
					<form.Field
						name="expected"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Expected (hours):"
								type="text"
								placeholder=""
							/>
						)}
					/>
					<form.Field
						name="optimistic"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Optimistic (hours):"
								type="text"
								placeholder=""
							/>
						)}
					/>
				</TabsContent>

				<TabsContent value="children">
					<form.Field
						name="pessimistic"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Pessimistic (least %):"
								type="text"
								placeholder=""
							/>
						)}
					/>
					<form.Field
						name="expected"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Expected (%):"
								type="text"
								placeholder=""
							/>
						)}
					/>
					<form.Field
						name="optimistic"
						validators={{
							onChange: ({ value }) =>
								Number.isNaN(value) ? "Not a number!" : undefined,
						}}
						children={(field) => (
							<FormTextField
								field={field()}
								transform={(v) => parseFloat(v)}
								label="Optimistic (most %):"
								type="text"
								placeholder=""
							/>
						)}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function Edit(props: { taskId: number }) {
	const collection = createCollection(
		liveQueryCollectionOptions({
			query: (q) =>
				q
					.from({ task: tasksCollection })
					.where(({ task }) => eq(task.id, props.taskId))
					.limit(1),
		}),
	);
	const timeframeTasks = useLiveQuery((q) => q.from({ tasks: collection }));
	return <Fields task={timeframeTasks()[0]} onSubmit={() => { }} />;
}

export function New(props: { timeframe: TimescaleInstance }) {
	return (
		<Fields
			task={{
				name: "",
			}}
			onSubmit={() => { }}
		/>
	);
}
