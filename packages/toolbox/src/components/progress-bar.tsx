import classNames from "classnames";
import {forwardRef, MouseEventHandler, Ref, TouchEventHandler, useCallback, useMemo} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import progressBarCss, {ProgressBarCss} from "./__style__/progress-bar.css";
export {progressBarCss, ProgressBarCss};

export interface ProgressBarProps {
    /** Value of a secondary progress bar useful for buffering. */
    buffer?: number;
    className?: string;
    /** Maximum value permitted. */
    max?: number;
    /** Minimum value permitted. */
    min?: number;
    /** Mode of the progress bar, it can be determinate or indeterminate. */
    mode?: "determinate" | "indeterminate";
    /** If true, the circular progress bar will be changing its color. */
    multicolor?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    /** Classnames object defining the component style. */
    theme?: CSSProp<ProgressBarCss>;
    /** Type of the progress bar, it can be circular or linear. */
    type?: "linear" | "circular";
    /** Value of the current progress. */
    value?: number;
}

export const ProgressBar = forwardRef(function RTProgressBar(
    {
        buffer = 0,
        className = "",
        max = 100,
        min = 0,
        mode = "indeterminate",
        multicolor = false,
        onClick,
        onMouseDown,
        onMouseEnter,
        onMouseLeave,
        onTouchStart,
        type = "linear",
        value = 0,
        theme: pTheme
    }: ProgressBarProps,
    ref: Ref<HTMLDivElement | SVGSVGElement>
) {
    const theme = useTheme("RTProgressBar", progressBarCss, pTheme);

    const calculateRatio = useCallback(
        (v: number) => {
            if (v < min) {
                return 0;
            }
            if (v > max) {
                return 1;
            }
            return (v - min) / (max - min);
        },
        [max, min]
    );

    const circularStyle = useMemo(
        () =>
            mode !== "indeterminate"
                ? {strokeDasharray: `${Math.PI * 2 * 25 * calculateRatio(value)}, 400`}
                : undefined,
        [calculateRatio, mode, value]
    );

    const linearStyle = useMemo(() => {
        if (mode !== "indeterminate") {
            return {
                buffer: {transform: `scaleX(${calculateRatio(buffer)})`},
                value: {transform: `scaleX(${calculateRatio(value)})`}
            };
        }
        return {};
    }, [buffer, calculateRatio, mode, value]);

    return (
        <div
            data-react-toolbox="progress-bar"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            className={classNames(
                theme.progressBar({[type]: true, indeterminate: mode === "indeterminate", multicolor}),
                className
            )}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
        >
            {type === "circular" ? (
                <svg ref={ref as Ref<SVGSVGElement>} className={theme.circle()} viewBox="0 0 60 60">
                    <circle className={theme.path()} style={circularStyle} cx="30" cy="30" r="25" />
                </svg>
            ) : (
                <div ref={ref as Ref<HTMLDivElement>}>
                    <span data-ref="buffer" className={theme.buffer()} style={linearStyle.buffer} />
                    <span data-ref="value" className={theme.value()} style={linearStyle.value} />
                </div>
            )}
        </div>
    );
});
