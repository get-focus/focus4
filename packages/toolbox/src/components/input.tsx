import classNames from "classnames";
import {
    CSSProperties,
    FocusEventHandler,
    FormEvent,
    ForwardedRef,
    forwardRef,
    KeyboardEventHandler,
    MouseEventHandler,
    ReactNode,
    TouchEventHandler,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import inputCss, {InputCss} from "./__style__/input.css";
export {inputCss, InputCss};

import {FontIcon} from "./font-icon";

export interface InputProps {
    autoComplete?: string;
    className?: string;
    /** Children to pass through the component. */
    children?: ReactNode;
    /** If true, component will be disabled. */
    disabled?: boolean;
    /** Give an error node to display under the field. */
    error?: ReactNode;
    /** Indicates if the label is floating in the input field or not. */
    floating?: boolean;
    /** The text string to use for hint text element. */
    hint?: ReactNode;
    /** Name of an icon to use as a label for the input. */
    icon?: ReactNode;
    /** Id for the input field. */
    id?: string;
    /** The text string to use for the floating label element. */
    label?: ReactNode;
    /** Specifies the maximum number of characters allowed in the component. */
    maxLength?: number;
    /** If true, a textarea element will be rendered. The textarea also grows and shrinks according to the number of lines. */
    multiline?: boolean;
    /** Name for the input field. */
    name?: string;
    onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onClick?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onChange?: (value: string, event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onContextMenu?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onDoubleClick?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onKeyDown?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onKeyPress?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onKeyUp?: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseDown?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseEnter?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseLeave?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseMove?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseOut?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseOver?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onMouseUp?: MouseEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    onTouchStart?: TouchEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    /** If true, input is readonly. */
    readOnly?: boolean;
    /** If true, the html input has a required attribute. */
    required?: boolean;
    /** The number of rows the multiline input field has. */
    rows?: number;
    /** TabIndex. */
    tabIndex?: number;
    /** Classnames object defining the component style. */
    theme?: CSSProp<InputCss>;
    /** Type of the input element. It can be a valid HTML5 input type. */
    type?: string;
    /** Current value of the input element. */
    value?: string;
    style?: CSSProperties;
}

export const Input = forwardRef(function RTInput(
    {
        autoComplete,
        className,
        children,
        disabled = false,
        error,
        floating = true,
        hint = "",
        icon,
        id,
        label: labelText,
        maxLength,
        multiline = false,
        name,
        onBlur,
        onChange,
        onClick,
        onContextMenu,
        onDoubleClick,
        onFocus,
        onKeyDown,
        onKeyPress,
        onKeyUp,
        onMouseDown,
        onMouseEnter,
        onMouseLeave,
        onMouseMove,
        onMouseOut,
        onMouseOver,
        onMouseUp,
        onTouchStart,
        readOnly,
        required = false,
        rows = 1,
        style,
        tabIndex,
        theme: pTheme,
        type = "text",
        value
    }: InputProps,
    ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
    const theme = useTheme("RTInput", inputCss, pTheme);
    const inputNode = useRef<any>(null);

    const handleAutoresize = useCallback(() => {
        if (inputNode.current) {
            if (typeof rows === "number" && !Number.isNaN(rows)) {
                inputNode.current.style.height = "";
            } else {
                // compute the height difference between inner height and outer height
                const inputStyle = getComputedStyle(inputNode.current, null);
                const heightOffset =
                    inputStyle.boxSizing === "content-box"
                        ? -(parseFloat(inputStyle.paddingTop) + parseFloat(inputStyle.paddingBottom))
                        : parseFloat(inputStyle.borderTopWidth) + parseFloat(inputStyle.borderBottomWidth);

                // resize the input to its content size
                inputNode.current.style.height = "auto";
                inputNode.current.style.height = `${inputNode.current.scrollHeight + heightOffset}px`;
            }
        }
    }, [rows]);

    useEffect(() => {
        if (multiline) {
            window.addEventListener("resize", handleAutoresize);
        }
        return () => {
            if (multiline) {
                window.removeEventListener("resize", handleAutoresize);
            }
        };
    }, [multiline, rows]);

    useEffect(() => {
        if (multiline) {
            handleAutoresize();
        }
    });

    useImperativeHandle(ref, () => inputNode.current, []);

    const handleChange = useCallback(
        (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const valueFromEvent = event.currentTarget.value;
            // Trim value to maxLength if that exists (only on multiline inputs).
            // Note that this is still required even tho we have the onKeyPress filter
            // because the user could paste smt in the textarea.
            const haveToTrim = multiline && maxLength && event.currentTarget.value.length > maxLength;
            const newValue = haveToTrim ? valueFromEvent.substr(0, maxLength) : valueFromEvent;

            // propagate to to store and therefore to the input
            onChange?.(newValue, event);
        },
        [onChange, multiline, maxLength]
    );

    const handleKeyPress: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
        event => {
            // prevent insertion of more characters if we're a multiline input
            // and maxLength exists
            if (multiline && maxLength) {
                // check if smt is selected, in which case the newly added charcter would
                // replace the selected characters, so the length of value doesn't actually
                // increase.
                const isReplacing = event.currentTarget.selectionEnd! - event.currentTarget.selectionStart!;
                const {value: newValue} = event.currentTarget;

                if (!isReplacing && newValue.length === maxLength) {
                    event.preventDefault();
                    event.stopPropagation();
                    return undefined;
                }
            }

            onKeyPress?.(event);
        },
        [multiline, maxLength, onKeyPress]
    );

    const length = maxLength && value ? value.length : 0;

    const inputElementProps = {
        autoComplete,
        className: theme.inputElement({filled: !!value}),
        onChange: handleChange,
        ref: inputNode,
        disabled,
        id,
        name,
        onBlur,
        onClick,
        onContextMenu,
        onFocus,
        onKeyDown,
        onDoubleClick,
        onKeyPress: handleKeyPress,
        onKeyUp,
        onMouseDown,
        onMouseEnter,
        onMouseLeave,
        onMouseMove,
        onMouseOut,
        onMouseOver,
        onMouseUp,
        onTouchStart,
        readOnly,
        required,
        style,
        tabIndex,
        type,
        value
    };

    return (
        <div
            data-react-toolbox="input"
            className={classNames(
                theme.input({disabled, errored: !!error, hidden: type === "hidden", withIcon: !!icon}),
                className
            )}
        >
            {multiline ? (
                <textarea {...inputElementProps} rows={rows} />
            ) : (
                <input {...inputElementProps} maxLength={maxLength} />
            )}
            {icon ? <FontIcon className={theme.icon()} value={icon} /> : null}
            <span className={theme.bar()} />
            {labelText ? (
                <label className={theme.label({fixed: !floating})}>
                    {labelText}
                    {required ? <span className={theme.required()}> * </span> : null}
                </label>
            ) : null}
            {hint ? (
                <span hidden={!!labelText} className={theme.hint()}>
                    {hint}
                </span>
            ) : null}
            {error ? <span className={theme.error()}>{error}</span> : null}
            {maxLength ? <span className={theme.counter()}>{`${length}/${maxLength}`}</span> : null}
            {children}
        </div>
    );
});
