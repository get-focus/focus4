import classNames from "classnames";
import {toPairs} from "lodash";
import {
    FocusEventHandler,
    FormEvent,
    ForwardedRef,
    forwardRef,
    KeyboardEvent,
    KeyboardEventHandler,
    ReactEventHandler,
    SyntheticEvent,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import autocompleteCss, {AutocompleteCss} from "./__style__/autocomplete.css";
export {autocompleteCss, AutocompleteCss};

import {Chip} from "./chip";
import {Input, InputCss, InputProps} from "./input";

export interface AutocompleteProps extends Omit<InputProps, "autoComplete" | "theme" | "value"> {
    /** Determines if user can create a new option with the current typed value. */
    allowCreate?: boolean;
    /** Determines the opening direction. It can be auto, up or down. */
    direction?: "auto" | "up" | "down";
    /** Whether component should keep focus after value change. */
    keepFocusOnChange?: boolean;
    /** If true, component can hold multiple values. */
    multiple?: boolean;
    onChange?: (
        value: string | string[],
        event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLLIElement>
    ) => void;
    /** Callback function that is fired when the components's query value changes. */
    onQueryChange?: (text: string) => void;
    /** Overrides the inner query. */
    query?: string;
    /** Determines if the selected list is shown above or below input. It can be above or below. */
    selectedPosition?: "above" | "below" | "none";
    /** If true, the list of suggestions will not be filtered when a value is selected. */
    showSuggestionsWhenValueIsSet?: boolean;
    /** Object of key/values or array representing all items suggested. */
    source?: Record<string, string>;
    /** Determines how suggestions are supplied. */
    suggestionMatch?: "disabled" | "start" | "anywhere" | "word";
    theme?: CSSProp<AutocompleteCss & InputCss>;
    value?: string | string[];
}

export const Autocomplete = forwardRef(function RTAutocomplete(
    {
        allowCreate = false,
        className,
        children,
        direction: pDirection = "auto",
        disabled,
        error,
        floating,
        hint,
        icon,
        id,
        keepFocusOnChange = false,
        label,
        maxLength,
        multiline,
        multiple = true,
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
        onQueryChange,
        query: pQuery,
        required,
        rows,
        selectedPosition = "above",
        showSuggestionsWhenValueIsSet = false,
        source = {},
        suggestionMatch = "start",
        style,
        theme: pTheme,
        type,
        value
    }: AutocompleteProps,
    ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
    /** Détermine la query à partir de la valeur. */
    const getQuery = useCallback(
        (v?: string | string[]) => (!multiple && v ? source[v as string] || (v as string) : ""),
        [multiple, source]
    );

    const theme = useTheme("RTAutocomplete", autocompleteCss, pTheme);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => inputRef.current!, []);

    const [active, setActive] = useState<string | null>();
    const [direction, setDirection] = useState(pDirection);
    const [focus, setFocus] = useState(false);
    const [showAllSuggestions, setShowAllSuggestions] = useState(showSuggestionsWhenValueIsSet);
    const [query, setQuery] = useState(pQuery ?? getQuery(value));

    const values = useMemo(() => {
        let vals = multiple ? (value as string[]) : [value as string];
        if (!vals) {
            vals = [];
        }

        const res: Record<string, string> = {};
        Object.keys(source).forEach(key => {
            if (vals.includes(key)) {
                res[key] = source[key];
            }
        });

        return res;
    }, [multiple, source, value]);

    const suggestions = useMemo(() => {
        let suggest: Record<string, string> = {};
        const rawQuery = query || (multiple ? "" : value);
        const newQuery = normalise(`${rawQuery}`);

        /** Détermine si la valeur est une match pour la requête.  */
        function isMatch(v: string, q: string) {
            switch (suggestionMatch) {
                case "disabled":
                    return true;
                case "start":
                    return v.startsWith(q);
                case "anywhere":
                    return v.includes(q);
                case "word":
                    const re = new RegExp(`\\b${q}`, "g");
                    return re.test(v);
                default:
                    return false;
            }
        }

        if (multiple) {
            // Suggest any non-set value which matches the query
            Object.keys(source).forEach(key => {
                if (!values[key] && isMatch(normalise(source[key]), newQuery)) {
                    suggest[key] = source[key];
                }
            });
        } else if (newQuery && !showAllSuggestions) {
            // When multiple is false, suggest any value which matches the query if showAllSuggestions is false
            Object.keys(source).forEach(key => {
                if (isMatch(normalise(source[key]), newQuery)) {
                    suggest[key] = source[key];
                }
            });
        } else {
            // When multiple is false, suggest all values when showAllSuggestions is true
            suggest = source;
        }

        return suggest;
    }, [multiple, query, source, showAllSuggestions, suggestionMatch, value, values]);

    const updateQuery = useCallback(
        (newQuery: string, notify: boolean) => {
            if (notify && onQueryChange) {
                onQueryChange(newQuery);
            }
            setQuery(newQuery);
        },
        [onQueryChange]
    );

    // Met à jour `query` quand les props changent.
    useEffect(() => {
        if (!multiple) {
            const q = pQuery ? pQuery : getQuery(value);
            updateQuery(q, false);
        }
    }, [getQuery, multiple, pQuery, updateQuery, value]);

    // Recalcule la position de la sélection quand elle est automatique.
    useEffect(() => {
        if (focus && direction === "auto") {
            const client = inputRef.current?.getBoundingClientRect() ?? {top: 0, height: 0};
            const screen_height = window.innerHeight || document.documentElement.offsetHeight;
            const up = client.top > screen_height / 2 + client.height;
            setDirection(up ? "up" : "down");
        }
    }, [direction, focus]);

    // Appelé à la sélection d'une valeur.
    const handleChange = useCallback(
        (vals: string[], event: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLLIElement>) => {
            const newValue = multiple ? vals : vals[0];
            const newQuery = getQuery(newValue);
            onChange?.(newValue, event);
            setShowAllSuggestions(showSuggestionsWhenValueIsSet);
            if (!keepFocusOnChange) {
                setFocus(false);
                inputRef.current?.blur();
            }
            updateQuery(newQuery, !!pQuery);
        },
        [getQuery, keepFocusOnChange, multiple, onChange, pQuery, showSuggestionsWhenValueIsSet, updateQuery]
    );

    const select = useCallback(
        (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement | HTMLLIElement>, target: string) => {
            event.stopPropagation();
            event.preventDefault();
            handleChange([target, ...Object.keys(values)], event);
        },
        [handleChange, values]
    );

    const selectOrCreateActiveItem: ReactEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLLIElement> =
        useCallback(
            event => {
                let target = active;
                if (!target) {
                    target = allowCreate ? query : Object.keys(suggestions)[0];
                    setActive(target);
                }
                select(event, target);
            },
            [active, allowCreate, query, select, suggestions]
        );

    const unselect = useCallback(
        (key: string, event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (!disabled) {
                handleChange(
                    Object.keys(values).filter(k => k !== key),
                    event
                );
            }
        },
        [disabled, handleChange, values]
    );

    const handleQueryBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
        event => {
            if (focus) {
                setFocus(false);
            }
            onBlur?.(event);
        },
        [active, focus, onBlur]
    );

    const clearQuery = useRef<boolean>(false);

    const handleQueryChange = useCallback(
        (newValue: string) => {
            const newQuery = clearQuery.current ? "" : newValue;
            clearQuery.current = false;
            updateQuery(newQuery, true);
            setShowAllSuggestions(newQuery ? false : showSuggestionsWhenValueIsSet);
            setActive(null);
        },
        [updateQuery]
    );

    const handleQueryFocus: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
        event => {
            event.target.scrollTop = 0;
            setActive("");
            setFocus(true);
            onFocus?.(event);
        },
        [onFocus]
    );

    const handleQueryKeyDown: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
        event => {
            // Mark query for clearing in handleQueryChange when pressing backspace and showing all suggestions.
            clearQuery.current = event.key === "Backspace" && showSuggestionsWhenValueIsSet && showAllSuggestions;

            if (event.key === "Enter" || event.key === "Tab") {
                selectOrCreateActiveItem(event);
            }

            onKeyDown?.(event);
        },
        [onKeyDown, selectOrCreateActiveItem, showSuggestionsWhenValueIsSet, showAllSuggestions]
    );

    const handleQueryKeyUp: KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
        event => {
            if (event.key === "Escape") {
                inputRef.current?.blur();
            }

            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                const suggestionsKeys = Object.keys(suggestions);
                let index = suggestionsKeys.indexOf(active!) + (event.key === "ArrowDown" ? +1 : -1);
                if (index < 0) {
                    index = suggestionsKeys.length - 1;
                }
                if (index >= suggestionsKeys.length) {
                    index = 0;
                }
                setActive(suggestionsKeys[index]);
            }

            onKeyUp?.(event);
        },
        [active, onKeyUp, suggestions]
    );

    const renderSelected = useCallback(() => {
        if (multiple) {
            const selectedItems = toPairs(suggestions).map(([key, val]) => (
                <Chip key={key} className={theme.value()} deletable onDeleteClick={(e: any) => unselect(key, e)}>
                    {val}
                </Chip>
            ));

            return <ul className={theme.values()}>{selectedItems}</ul>;
        }
    }, [multiple, unselect, theme, values]);

    return (
        <div data-react-toolbox="autocomplete" className={classNames(theme.autocomplete({focus}), className)}>
            {selectedPosition === "above" ? renderSelected() : null}
            <Input
                ref={inputRef}
                autoComplete="off"
                children={children}
                className={theme.input()}
                disabled={disabled}
                error={error}
                floating={floating}
                label={label}
                hint={hint}
                icon={icon}
                id={id}
                maxLength={maxLength}
                multiline={multiline}
                name={name}
                onBlur={handleQueryBlur}
                onChange={handleQueryChange}
                onClick={onClick}
                onContextMenu={onContextMenu}
                onDoubleClick={onDoubleClick}
                onFocus={handleQueryFocus}
                onKeyDown={handleQueryKeyDown}
                onKeyPress={onKeyPress}
                onKeyUp={handleQueryKeyUp}
                onMouseDown={onMouseDown}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseMove={onMouseMove}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
                onMouseUp={onMouseUp}
                onTouchStart={onTouchStart}
                required={required}
                rows={rows}
                style={style}
                type={type}
                theme={theme as CSSProp<InputCss>}
                value={query}
            />
            <ul className={theme.suggestions({up: direction === "up"})}>
                {toPairs(suggestions).map(([key, val]) => (
                    <li
                        id={key}
                        key={key}
                        className={theme.suggestion({active: active === key})}
                        onMouseDown={selectOrCreateActiveItem}
                        onMouseOver={event => setActive(event.currentTarget.id)}
                    >
                        {val}
                    </li>
                ))}
            </ul>
            {selectedPosition === "below" ? renderSelected() : null}
        </div>
    );
});

function normalise(value: string) {
    const sdiak =
        "áâäąáâäąččććççĉĉďđďđééěëēėęéěëēėęĝĝğğġġģģĥĥħħíîíîĩĩīīĭĭįįi̇ıĵĵķķĸĺĺļļŀŀłłĺľĺľňńņŋŋņňńŉóöôőøōōóöőôøřřŕŕŗŗššśśŝŝşşţţťťŧŧũũūūŭŭůůűűúüúüűųųŵŵýyŷŷýyžžźźżżß";
    const bdiak =
        "AAAAAAAACCCCCCCCDDDDEEEEEEEEEEEEEGGGGGGGGHHHHIIIIIIIIIIIIIIJJKKKLLLLLLLLLLLLNNNNNNNNNOOOOOOOOOOOORRRRRRSSSSSSSSTTTTTTUUUUUUUUUUUUUUUUUWWYYYYYYZZZZZZS";

    let normalised = "";
    for (let p = 0; p < value.length; p++) {
        if (sdiak.indexOf(value.charAt(p)) !== -1) {
            normalised += bdiak.charAt(sdiak.indexOf(value.charAt(p)));
        } else {
            normalised += value.charAt(p);
        }
    }

    return normalised.toLowerCase().trim();
}
