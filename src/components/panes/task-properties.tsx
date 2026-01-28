// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { eq, useLiveQuery } from "@tanstack/solid-db";
import type { AnyFieldApi, FieldApi } from "@tanstack/solid-form";
import { createEffect, createMemo, Match, Switch, useContext } from "solid-js";
import { tasksCollection } from "src/lib/db";
import { type Timescale, timescaleFromType } from "src/lib/timescales";
import {
	CurrentTaskContext,
	type CurrentTaskValue,
} from "~/context/current-task";
import { FieldInfo } from "../field-info";
import { TimeDisplay } from "../time-display";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Search } from "../ui/search";
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
				value={
					Number.isNaN(props.field.state.value) ? "" : props.field.state.value
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

			<form.Field
				name="parent_id"
				children={(field) => {
					const parentOptions = useLiveQuery((q) =>
						q.from({ tasks: tasksCollection }),
					);
					const parentQuery = useLiveQuery((q) =>
						q
							.from({ tasks: tasksCollection })
							.where(({ tasks }) => eq(tasks.id, field().state.value)),
					);
					const parent = createMemo(() => parentQuery()[0]);
					createEffect(() => {
						console.log(parentOptions());
					});
					return (
						<div class="max-w-[220px]">
							<label class="text-sm font-medium" for={field().name}>
								Parent
							</label>
							<Search
								name={field().name}
								options={parentOptions()}
								selected={parent()}
								idField="id"
								labelField="name"
								onChange={(newParent) => {
									if (!newParent) {
										// root id
										field().handleChange(1);
										return;
									}
									field().handleChange(newParent.id);
								}}
							/>
						</div>
					);
				}}
			/>
		</>
	);
}

function Header(props: {
	title: string;
	start: Temporal.ZonedDateTime;
	duration: Temporal.Duration;
	timescale: Timescale;
}) {
	return (
		<>
			<h1 class="text-lg">{props.title}</h1>
			<div class="flex items-center">
				<Badge variant="secondary">{props.timescale.name}</Badge>
				<TimeDisplay time={props.start} minDuration={props.duration} />
			</div>
			<Separator />
		</>
	);
}

function Form(props: {
	title: string;
	actionTitle: string;
	key: keyof CurrentTaskValue["forms"];
}) {
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
				selector={(state) => {
					const timescale = timescaleFromType(state.values.timescale);
					return {
						start: state.values.timeframe_start,
						end: timescale.instance(state.values.timeframe_start).end,
						timescale,
					};
				}}
				children={(selected) => (
					<Header
						title={props.title}
						start={selected().start}
						timescale={selected().timescale}
						duration={selected().end.since(selected().start)}
					/>
				)}
			/>
			<FormFields form={form} />
			<Button
				class="w-min"
				onClick={() => {
					form.validateAllFields("submit");
					console.log("submitted");
				}}
			>
				{props.actionTitle}
			</Button>
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
					<Form title="Creating task..." actionTitle="Create" key="creation" />
				</Match>
				<Match when={taskCtx.shown() === "selected"}>
					<Form title="Editing task..." actionTitle="Save" key="edit" />
				</Match>
				<Match when={taskCtx.shown() === "none"}>
					<p class="m-auto">No task selected.</p>
				</Match>
			</Switch>
		</div>
	);
}
