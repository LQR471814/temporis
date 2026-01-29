// biome-ignore-all lint/suspicious/noExplicitAny: lots of typescript shenanigans happening here

import { createFilter } from "@kobalte/core";
import type { Fn, Pipe, Tuples, Unions } from "hotscript";
import { createSignal } from "solid-js";
import {
	Combobox,
	ComboboxContent,
	ComboboxInput,
	ComboboxItem,
	ComboboxTrigger,
} from "~/components/ui/combobox";

interface IsValidLabel<T extends Record<string, unknown>> extends Fn {
	return: T[this["arg0"]] extends string | number | Element ? true : false;
}

export function Search<
	T extends Record<string, unknown>,
	IDField extends keyof T,
	LabelField extends Pipe<
		keyof T,
		[Unions.ToTuple, Tuples.Filter<IsValidLabel<T>>, Tuples.ToUnion]
	>,
>(props: {
	name: string;
	selected: T;
	options: T[];
	idField: IDField;
	labelField: LabelField;
	onChange(result: T | null): void;
}) {
	const filter = createFilter({ sensitivity: "base", ignorePunctuation: true });
	const [options, setOptions] = createSignal(props.options);
	const onInputChange = (value: string) => {
		setOptions(
			props.options.filter((option) =>
				filter.contains(option[props.labelField as any] as any, value),
			),
		);
	};
	return (
		<Combobox
			name={props.name}
			value={props.selected}
			options={options()}
			optionValue={props.idField}
			optionLabel={props.labelField as any}
			onInputChange={onInputChange}
			onChange={props.onChange}
			itemComponent={(p) => (
				<ComboboxItem item={p.item}>
					{p.item.rawValue[props.labelField as any] as any}
				</ComboboxItem>
			)}
		>
			<ComboboxTrigger>
				<ComboboxInput />
			</ComboboxTrigger>
			<ComboboxContent />
		</Combobox>
	);
}
