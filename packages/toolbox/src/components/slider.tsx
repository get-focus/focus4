import classNames from "classnames";
import {range} from "lodash";
import {
    MouseEvent as RMouseEvent,
    MouseEventHandler,
    TouchEvent as RTouchEvent,
    TouchEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import sliderCss, {SliderCss} from "./__style__/slider.css";
export {sliderCss, SliderCss};

import {Input} from "./input";
import {ProgressBar} from "./progress-bar";

export interface SliderProps {
    /** Used to style the ProgressBar element */
    buffer?: number;
    /** CSS class for the root component. */
    className?: string;
    /** If true, an input is shown and the user can set the slider from keyboard value. */
    editable?: boolean;
    /** If true, component will be disabled. */
    disabled?: boolean;
    /** Maximum value permitted. */
    max?: number;
    /** Minimum value permitted. */
    min?: number;
    /** Callback function that will be invoked when the slider value changes. */
    onChange?: (value: number) => void;
    onClick?: MouseEventHandler<HTMLDivElement>;
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    /** If true, a pin with numeric value label is shown when the slider thumb is pressed. Use for settings for which users need to know the exact value of the setting. */
    pinned?: boolean;
    /** If true, the slider thumb snaps to tick marks evenly spaced based on the step property value. */
    snaps?: boolean;
    /** Amount to vary the value when the knob is moved or increase/decrease is called. */
    step?: number;
    /** Classnames object defining the component style. */
    theme?: CSSProp<SliderCss>;
    /** Current value of the slider. */
    value?: number;
}

export function Slider({
    buffer = 0,
    className = "",
    disabled,
    editable = false,
    max = 100,
    min = 0,
    onChange,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
    pinned = false,
    snaps = false,
    step = 0.01,
    theme: pTheme,
    value = 0
}: SliderProps) {
    const theme = useTheme("RTSlider", sliderCss, pTheme);
    const [inputFocused, setInputFocused] = useState(false);
    const [sliderFocused, setSliderFocused] = useState(false);
    const [inputValue, setInputValue] = useState<string>("");
    const [sliderLength, setSliderLength] = useState(0);
    const [sliderStart, setSliderStart] = useState(0);
    const [pressed, setPressed] = useState(false);

    const progressBar = useRef<HTMLDivElement>(null);
    const inputNode = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const handleResize = useCallback(() => {
        const {left = 0, right = 0} = progressBar.current?.getBoundingClientRect() ?? {};
        setSliderStart(left);
        setSliderLength(right - left);
    }, []);

    const stepDecimals = useMemo(() => (step.toString().split(".")[1] || []).length, [step]);

    const valueForInput = useCallback(
        (v: number) => {
            const decimals = stepDecimals;
            return decimals > 0 ? v.toFixed(decimals) : v.toString();
        },
        [stepDecimals]
    );

    const trimValue = useCallback(
        (v: number) => {
            if (v < min) {
                return min;
            }
            if (v > max) {
                return max;
            }
            var decimalPower = Math.pow(10, stepDecimals);
            return Math.round(v * decimalPower) / decimalPower;
        },
        [max, min, stepDecimals]
    );

    const addToValue = useCallback(
        (increment: number) => {
            let newValue = inputFocused ? parseFloat(inputValue) : value;
            newValue = trimValue(value + increment);
            if (newValue !== value) {
                onChange?.(newValue);
            }
        },
        [inputFocused, inputValue, onChange, trimValue, value]
    );

    const positionToValue = useCallback(
        (position: {x: number}) => {
            const pos = ((position.x - sliderStart) / sliderLength) * (max - min);
            return trimValue(Math.round(pos / step) * step + min);
        },
        [max, min, step, sliderStart, sliderLength, trimValue]
    );

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(() => {
        if (inputFocused) {
            setInputValue(valueForInput(value));
        }
    }, [inputFocused, value, valueForInput]);

    const start = useCallback(
        (position: {x: number}) => {
            handleResize();
            setPressed(true);
            onChange?.(positionToValue(position));
        },
        [handleResize, onChange, positionToValue]
    );

    const handleMouseDown = useCallback(
        (event: RMouseEvent<HTMLDivElement>) => {
            if (inputFocused) {
                inputNode.current?.blur();
            }
            start({x: event.pageX - (window.scrollX || window.pageXOffset)});
            event.stopPropagation();
            event.preventDefault();
        },
        [inputFocused, start]
    );

    const handleTouchStart = useCallback(
        (event: RTouchEvent<HTMLDivElement>) => {
            if (inputFocused) {
                inputNode.current?.blur();
            }
            start({x: event.touches[0].pageX - (window.scrollX || window.pageXOffset)});
            event.stopPropagation();
            event.preventDefault();
        },
        [inputFocused, start]
    );

    useEffect(() => {
        if (pressed) {
            const move = (position: {x: number}) => {
                onChange?.(positionToValue(position));
            };

            const handleMouseMove = (event: MouseEvent) => {
                event.stopPropagation();
                event.preventDefault();
                move({x: event.pageX - (window.scrollX || window.pageXOffset)});
            };

            const handleTouchMove = (event: TouchEvent) => {
                move({x: event.touches[0].pageX - (window.scrollX || window.pageXOffset)});
            };

            const end = () => {
                setPressed(false);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("touchmove", handleTouchMove);
            document.addEventListener("mouseup", end);
            document.addEventListener("touchend", end);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("mouseup", end);
                document.removeEventListener("touchend", end);
            };
        }
    }, [positionToValue, pressed]);

    const handleInputFocus = useCallback(() => {
        setInputFocused(true);
        setInputValue(valueForInput(value));
    }, [value, valueForInput]);

    const handleInputChange = useCallback((newValue: string) => {
        setInputValue(newValue);
    }, []);

    const handleInputBlur = useCallback(() => {
        const newValue = +inputValue || 0;
        setInputFocused(false);
        setInputValue("");
        onChange?.(trimValue(newValue));
    }, [inputValue, onChange, trimValue]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (disabled) {
                return;
            }
            if (["Enter", "Escape"].includes(event.code)) {
                inputNode.current?.blur();
            }
            if (event.code === "ArrowUp") {
                addToValue(step);
            }
            if (event.code === "ArrowDown") {
                addToValue(-step);
            }
        },
        [addToValue, disabled, step]
    );

    useEffect(() => {
        if (sliderFocused) {
            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [handleKeyDown, sliderFocused]);

    const knobOffset = useMemo(() => ((value - min) / (max - min)) * 100, [max, min, value]);
    const knobStyles = {left: `${knobOffset}%`};

    return (
        <div
            className={classNames(theme.slider({editable, pinned, pressed, ring: value === min}), className)}
            data-react-toolbox="slider"
            onBlur={() => setSliderFocused(false)}
            onClick={onClick}
            onFocus={() => setSliderFocused(true)}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            tabIndex={0}
        >
            <div className={theme.container()} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
                <div
                    className={theme.knob()}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    style={knobStyles}
                >
                    <div className={theme.innerknob()} data-value={value} />
                </div>

                <div className={theme.progress()}>
                    <ProgressBar
                        ref={progressBar}
                        className={theme.innerprogress()}
                        max={max}
                        min={min}
                        mode="determinate"
                        value={value}
                        buffer={buffer}
                    />
                    {snaps ? (
                        <div className={theme.snaps()}>
                            {range(0, (max - min) / step).map(i => (
                                <div key={`span-${i}`} className={theme.snap()} />
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
            {editable ? (
                <Input
                    ref={inputNode}
                    className={theme.input()}
                    disabled={disabled}
                    onFocus={handleInputFocus}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    value={inputFocused ? inputValue : valueForInput(value)}
                />
            ) : null}
        </div>
    );
}
