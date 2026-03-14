import { useContext } from "solid-js";
import { Button } from "src/components/ui/button";
import {
	Slider,
	SliderFill,
	SliderThumb,
	SliderTrack,
} from "src/components/ui/slider";
import { TextField, TextFieldInput } from "src/components/ui/text-field";
import { useViewTimeInstant, ViewContext } from "src/context/view";
import { TimeDisplay } from "../time-display";
import { cn } from "src/lib/utils";

export function ViewController(props: { class?: string }) {
	const ctx = useContext(ViewContext);
	const viewInstant = useViewTimeInstant();
	if (!ctx) {
		return <p>ViewContext.Provider is missing</p>;
	}

	return (
		<div
			class={cn(
				"flex flex-wrap gap-1 p-1 bg-background rounded-md",
				props.class,
			)}
		>
			<TextField>
				<TextFieldInput
					class="max-w-[5rem]"
					type="number"
					value={ctx.state.percentile}
					onChange={(e) => {
						const value = parseFloat(e.currentTarget.value);
						ctx.setPercentile(value);
					}}
				/>
			</TextField>
			<div class="flex px-3">
				<Slider
					minValue={0}
					maxValue={100}
					value={[ctx.state.percentile]}
					class="m-auto w-[200px]"
					onChange={(e) => {
						ctx.setPercentile(e[0]);
					}}
				>
					<SliderTrack>
						<SliderFill />
						<SliderThumb />
					</SliderTrack>
				</Slider>
			</div>
			<Button
				class="text-primary/20"
				variant="outline"
				onClick={() => {
					ctx.reset();
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<title>Reset</title>
					<path d="M18.5374 19.5674C16.7844 21.0831 14.4993 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 14.1361 21.3302 16.1158 20.1892 17.7406L17 12H20C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C14.1502 20 16.1022 19.1517 17.5398 17.7716L18.5374 19.5674Z"></path>
				</svg>
			</Button>
			<TimeDisplay
				time={viewInstant()}
				minDuration={Temporal.Duration.from({ seconds: 0 })}
			/>
		</div>
	);
}
