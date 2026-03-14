import { createContext, type ParentComponent, useContext } from "solid-js";
import { cn } from "src/lib/utils";

export type ScrollerValue = {
	persistScroll(stateChange: () => void): void;
	setOnChange(listener: (change: () => void) => void): void;
};

export const ScrollerContext = createContext<ScrollerValue>();

export const ScrollerContainer: ParentComponent<{ class?: string }> = (
	props,
) => {
	const ctx = useContext(ScrollerContext);
	if (!ctx)
		throw new Error("ScrollerContainer must be used under a ScrollerContext");
	let container!: HTMLDivElement;
	ctx.setOnChange((change) => {
		const scrollTop = container.scrollTop;
		requestAnimationFrame(() => {
			container.scrollTop = scrollTop;
		});
		change();
	});
	return (
		<div class={cn("overflow-y-auto", props.class)} ref={container}>
			{props.children}
		</div>
	);
};

export const ScrollerProvider: ParentComponent = (props) => {
	let onChange: ((change: () => void) => void) | undefined;
	const value: ScrollerValue = {
		persistScroll(stateChange) {
			onChange?.(stateChange);
		},
		setOnChange(listener) {
			onChange = listener;
		},
	};
	return (
		<ScrollerContext.Provider value={value}>
			{props.children}
		</ScrollerContext.Provider>
	);
};
