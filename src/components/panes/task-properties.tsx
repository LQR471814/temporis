// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import type { AnyFieldApi, FieldApi } from "@tanstack/solid-form";
import { Match, Switch, useContext } from "solid-js";
import { timescaleFromType } from "src/lib/timescales";
import {
	CurrentTaskContext,
	type CurrentTaskValue,
} from "~/context/current-task";
import { FieldInfo } from "../field-info";
import { TimeDisplay } from "../time-display";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	TextField,
	TextFieldInput,
	type TextFieldInputProps,
	TextFieldLabel,
	TextFieldTextArea,
} from "../ui/text-field";

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
	class?: string;
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
				class={props.class}
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
	class?: string;
}) {
	return (
		<TextField>
			<TextFieldLabel for={props.field.name}>{props.label}</TextFieldLabel>
			<TextFieldInput
				class={props.class}
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

function FormFields(props: {
	form: CurrentTaskValue["forms"][keyof CurrentTaskValue["forms"]];
}) {
	const form = props.form;
	return (
		<>
			<form.Field
				name="name"
				validators={{
					onChange: ({ value }) => (!value ? "Name is required" : undefined),
				}}
				children={(field) => (
					<FormTextField
						class="max-w-[180px]"
						field={field()}
						transform={(v) => v}
						label="Name"
						type="text"
						placeholder="Task 1"
					/>
				)}
			/>
			<form.Field
				name="comments"
				children={(field) => (
					<FormMultilineText
						class="max-w-[400px]"
						field={field()}
						label="Comments"
						placeholder="Comments..."
					/>
				)}
			/>

			<form.Field
				name="implementation"
				children={(field) => (
					<div>
						<p class="text-sm font-medium">Estimate</p>
						<Tabs
							onChange={(value) => {
								switch (value) {
									case "hours":
									case "children":
										field().handleChange(value);
								}
							}}
							defaultValue={field().state.value}
							class="w-[400px]"
						>
							<TabsList class="grid w-full grid-cols-2">
								<TabsTrigger value="hours">Hours</TabsTrigger>
								<TabsTrigger value="children">Children</TabsTrigger>
							</TabsList>
							<TabsContent class="flex gap-2" value="hours">
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
											label="Optimistic"
											type="text"
											placeholder="Hours"
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
											label="Expected"
											type="text"
											placeholder="Hours"
										/>
									)}
								/>
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
											label="Pessimistic"
											type="text"
											placeholder="Hours"
										/>
									)}
								/>
							</TabsContent>

							<TabsContent class="flex gap-2" value="children">
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
											label="Least %"
											type="text"
											placeholder="Percentage"
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
											label="Average %"
											type="text"
											placeholder="Percentage"
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
											label="Most %"
											type="text"
											placeholder="Percentage"
										/>
									)}
								/>
							</TabsContent>
						</Tabs>
					</div>
				)}
			/>
		</>
	);
}

function Header(props: {
	title: string;
	start: Temporal.ZonedDateTime;
	end: Temporal.ZonedDateTime;
	duration: Temporal.Duration;
}) {
	return (
		<>
			<h1 class="text-lg">{props.title}</h1>
			<div class="flex items-center">
				<TimeDisplay
					class="pl-0"
					time={props.start}
					minDuration={props.duration}
				/>
				<svg
					class="h-3"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<title>Forward Arrow</title>
					<path d="M1.99974 13.0001L1.9996 11.0002L18.1715 11.0002L14.2218 7.05044L15.636 5.63623L22 12.0002L15.636 18.3642L14.2218 16.9499L18.1716 13.0002L1.99974 13.0001Z"></path>
				</svg>
				<TimeDisplay time={props.end} minDuration={props.duration} />
			</div>
			<Separator />
		</>
	);
}

function Form(props: { key: keyof CurrentTaskValue["forms"] }) {
	const taskCtx = useContext(CurrentTaskContext);
	if (!taskCtx) {
		return (
			<p class="m-auto">
				CurrentTaskContext.Provider has not been initialized.
			</p>
		);
	}
	const form = taskCtx.forms[props.key];
	return (
		<>
			<form.Subscribe
				selector={(state) => ({
					start: state.values.timeframe_start,
					end: timescaleFromType(state.values.timescale).instance(
						state.values.timeframe_start,
					).end,
				})}
				children={(selected) => (
					<Header
						title="Creating"
						start={selected().start}
						end={selected().end}
						duration={selected().end.since(selected().start)}
					/>
				)}
			/>
			<FormFields form={form} />
		</>
	);
}

export function TaskProperties() {
	const taskCtx = useContext(CurrentTaskContext);
	if (!taskCtx) {
		return (
			<div class="flex w-full h-full">
				<p class="m-auto">
					CurrentTaskContext.Provider has not been initialized.
				</p>
			</div>
		);
	}

	return (
		<div class="flex flex-col gap-2 w-full h-full p-2">
			<Switch>
				<Match when={taskCtx.shown() === "new_child"}>
					<Form key="creation" />
				</Match>
				<Match when={taskCtx.shown() === "selected"}>
					<Form key="edit" />
				</Match>
				<Match when={taskCtx.shown() === "none"}>
					<p class="m-auto">No task selected.</p>
				</Match>
			</Switch>
		</div>
	);
}
