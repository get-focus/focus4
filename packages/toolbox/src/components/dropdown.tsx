import classNames from "classnames";
import {
    FocusEvent,
    FocusEventHandler,
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import dropdownCss, {DropdownCss} from "./__style__/dropdown.css";
export {dropdownCss, DropdownCss};

import {Input} from "./input";

export interface DropdownProps<
    T,
    VK extends string = "value",
    LK extends string = "label",
    S extends {[P in VK]?: T} & {[P in LK]?: string} = any
> {
    /** If true the dropdown will preselect the first item if the supplied value matches none of the options' values. */
    allowBlank?: boolean;
    /** If true, the dropdown will open up or down depending on the position in the screen. */
    auto?: boolean;
    /** CSS class for the root component. */
    className?: string;
    /** If true, component will be disabled. */
    disabled?: boolean;
    /** Give an error node to display under the field. */
    error?: ReactNode;
    /** Used for setting the label from source */
    labelKey?: LK;
    /** Id for the input field. */
    id?: string;
    /** The text string to use for the floating label element. */
    label?: ReactNode;
    /** Name for the input field. */
    name?: string;
    onBlur?: (
        event: FocusEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement> | MouseEvent<HTMLLIElement>
    ) => void;
    onChange?: (value: T, event: MouseEvent<HTMLLIElement>) => void;
    onClick?: MouseEventHandler<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>;
    onFocus?: FocusEventHandler<HTMLDivElement>;
    /** If true, the html input has a required attribute. */
    required?: boolean;
    /** Array of data objects with the data to represent in the dropdown. */
    source: S[];
    /** Callback function that returns a JSX template to represent the element. */
    template?: (item: S) => JSX.Element;
    /** Classnames object defining the component style. */
    theme?: CSSProp<DropdownCss>;
    /** Current value of the dropdown element. */
    value?: T;
    /** Used for setting the value from source */
    valueKey?: VK;
}

export function Dropdown<
    T,
    VK extends string = "value",
    LK extends string = "label",
    S extends {[P in VK]?: T} & {[P in LK]?: string} = any
>({
    allowBlank = true,
    auto = true,
    className,
    disabled = false,
    error,
    id,
    label,
    labelKey = "label" as LK,
    name,
    onBlur,
    onChange,
    onClick,
    onFocus,
    required = false,
    source,
    template,
    value,
    valueKey = "value" as VK,
    theme: pTheme
}: DropdownProps<T, VK, LK, S>) {
    const theme = useTheme("RTDropdown", dropdownCss, pTheme);

    const domNode = useRef<HTMLDivElement | null>(null);
    const [active, setActive] = useState(false);
    const [up, setUp] = useState(false);

    useEffect(() => {
        function handleDocumentClick(event: Event) {
            if (!targetIsDescendant(event, domNode.current)) {
                setActive(false);
            }
        }
        if (active) {
            document.addEventListener("click", handleDocumentClick);
            document.addEventListener("touchend", handleDocumentClick);
        }
        return () => {
            if (active) {
                document.removeEventListener("click", handleDocumentClick);
                document.removeEventListener("touchend", handleDocumentClick);
            }
        };
    }, [active]);

    const open = useCallback(
        (event: SyntheticEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>) => {
            if (active) {
                return;
            }
            setActive(true);
            const client = event.currentTarget.getBoundingClientRect();
            const screenHeight = window.innerHeight || document.documentElement.offsetHeight;
            setUp(auto ? client.top > screenHeight / 2 + client.height : false);
        },
        [active, auto]
    );

    const handleBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            event.stopPropagation();
            setActive(false);
            onBlur?.(event);
        },
        [onBlur]
    );

    const handleClick = useCallback(
        (event: MouseEvent<HTMLDivElement | HTMLInputElement | HTMLTextAreaElement>) => {
            open(event);
            event.stopPropagation();
            event.preventDefault();
            onClick?.(event);
        },
        [onClick, open]
    );

    const handleFocus = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            event.stopPropagation();
            if (!disabled) {
                open(event);
            }
            onFocus?.(event);
        },
        [disabled, onFocus, open]
    );

    const handleSelect = useCallback(
        (item: T, event: MouseEvent<HTMLLIElement>) => {
            event.stopPropagation();
            event.preventDefault();
            onBlur?.(event);
            if (!disabled && onChange) {
                onChange(item, event);
                setActive(false);
            }
        },
        [disabled, onBlur, onChange]
    );

    const renderTemplateValue = useCallback(
        (sel: S) => {
            return (
                <div className={theme.field({disabled, errored: !!error})} onClick={handleClick}>
                    <div className={`${theme.templateValue()} ${theme.value()}`}>{template!(sel)}</div>
                    {label ? (
                        <label className={theme.label()}>
                            {label}
                            {required ? <span className={theme.required()}> * </span> : null}
                        </label>
                    ) : null}
                    {error ? <span className={theme.error()}>{error}</span> : null}
                </div>
            );
        },
        [disabled, error, handleClick, label, required, template, theme]
    );

    const renderValue = useCallback(
        (item: S, idx: number) => {
            return (
                <li
                    key={idx}
                    className={theme.value({disabled: (item as any).disabled, selected: item[valueKey] === value})}
                    onMouseDown={!(item as any).disabled ? event => handleSelect(item[valueKey]!, event) : undefined}
                >
                    {template ? template(item) : item[labelKey]}
                </li>
            );
        },
        [labelKey, template, theme, value, valueKey]
    );

    const selected = useMemo(() => {
        for (const item of source) {
            if (item[valueKey] === value) {
                return item;
            }
        }
        return !allowBlank ? source[0] : undefined;
    }, [allowBlank, source, value]);

    return (
        <div
            ref={domNode}
            className={classNames(theme.dropdown({active, disabled, up}), className)}
            data-react-toolbox="dropdown"
            onBlur={handleBlur}
            onFocus={handleFocus}
            tabIndex={-1}
        >
            <Input
                className={theme.input()}
                id={id}
                name={name}
                onClick={handleClick}
                readOnly
                required={required}
                tabIndex={0}
                type={template && selected ? "hidden" : undefined}
                value={selected && selected[labelKey] ? selected[labelKey] : ""}
            />
            {template && selected ? renderTemplateValue(selected) : null}
            <ul className={theme.values()}>{source.map(renderValue)}</ul>
        </div>
    );
}

function targetIsDescendant(event: Event, parent: Element | null) {
    var node = event.target;
    while (node !== null) {
        if (node === parent) return true;
        node = (node as Element).parentNode;
    }
    return false;
}
