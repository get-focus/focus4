import classNames from "classnames";
import {
    Children,
    cloneElement,
    MouseEvent,
    ReactElement,
    ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import menuCss, {MenuCss} from "../__style__/menu.css";
export {menuCss, MenuCss};

import {RippleProps} from "../ripple";
import {MenuItem, MenuItemProps} from "./item";

export interface MenuProps {
    /** If true, the menu will be displayed as opened by default. */
    active?: boolean;
    className?: string;
    /** Children to pass through the component. */
    children?: ReactNode;
    /** Callback that will be called when the menu is being hidden. */
    onHide?: () => void;
    /** Callback that will be invoked when a menu item is selected. */
    onSelect?: (value?: string) => void;
    /** Callback that will be invoked when the menu is being shown. */
    onShow?: () => void;
    /** If true the menu wrapper will show an outline with a soft shadow. */
    outline?: boolean;
    /** Determine the position of the menu. With static value the menu will be always shown, auto means that the it will decide the opening direction based on the current position. To force a position use topLeft, topRight, bottomLeft, bottomRight. */
    position?: "auto" | "static" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
    /** If true, the menu items will show a ripple effect on click. */
    ripple?: boolean;
    /** If true, the menu will keep a value to highlight the active child item. */
    selectable?: boolean;
    /** Used for selectable menus. Indicates the current selected value so the child item with this value can be highlighted. */
    selected?: string;
    /** Classnames object defining the component style. */
    theme?: CSSProp<MenuCss>;
}

export function Menu({
    active: pActive = false,
    children,
    className = "",
    onHide,
    onSelect,
    onShow,
    outline = true,
    position: pPosition = "static",
    ripple = true,
    selected,
    selectable = true,
    theme: pTheme
}: MenuProps) {
    const theme = useTheme("RTMenu", menuCss, pTheme);

    const rootNode = useRef<HTMLDivElement | null>(null);
    const menuNode = useRef<HTMLUListElement | null>(null);

    const [active, setActive] = useState(pActive);
    const [rippled, setRippled] = useState(false);
    const [position, setPosition] = useState(pPosition === "auto" ? "topLeft" : pPosition);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (pActive) {
            if (pPosition === "auto") {
                const parentNode = rootNode.current?.parentNode;
                if (parentNode) {
                    const {top, left, height: ph, width: pw} = (parentNode as HTMLElement).getBoundingClientRect();
                    const ww = window.innerWidth || document.documentElement.offsetWidth;
                    const wh = window.innerHeight || document.documentElement.offsetHeight;
                    const toTop = top < wh / 2 - ph / 2;
                    const toLeft = left < ww / 2 - pw / 2;
                    setPosition(`${toTop ? "top" : "bottom"}${toLeft ? "Left" : "Right"}` as const);
                }
            }

            const {height: ch, width: cw} = menuNode.current!.getBoundingClientRect();
            setActive(false);
            setWidth(cw);
            setHeight(ch);
            const timeout = setTimeout(() => setActive(true), 20);
            onShow?.();
            return () => {
                clearTimeout(timeout);
            };
        } else {
            setActive(false);
            onHide?.();
        }
    }, [pActive, pPosition, onHide, onShow]);

    useEffect(() => {
        function handleDocumentClick(event: Event) {
            if (!targetIsDescendant(event, rootNode.current)) {
                setActive(false);
                setRippled(false);
                onHide?.();
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
    }, [active, onHide]);

    const handleSelect = useCallback(
        (item: ReactElement<MenuItemProps & RippleProps>, event: MouseEvent<HTMLLIElement>) => {
            const {value, onClick} = item.props;
            if (onClick) {
                event.persist();
            }
            setActive(false);
            setRippled(ripple);
            onClick?.(event);
            onSelect?.(value);
            onHide?.();
        },
        [onSelect, ripple]
    );

    const menuStyle = useMemo(() => {
        if (position !== "static") {
            if (active) {
                return {clip: `rect(0 ${width}px ${height}px 0)`};
            } else {
                switch (position) {
                    case "bottomLeft":
                        return {clip: `rect(${height}px 0 ${height}px 0)`};
                    case "bottomRight":
                        return {clip: `rect(${height}px ${width}px ${height}px ${width}px)`};
                    case "topLeft":
                        return {clip: "rect(0 0 0 0)"};
                    case "topRight":
                        return {clip: `rect(0 ${width}px 0 ${width}px)`};
                }
            }
        }

        return undefined;
    }, [active, height, position, width]);

    const rootStyle = useMemo(() => (position !== "static" ? {width, height} : undefined), [height, position, width]);

    const outlineStyle = {width, height};

    const items = useMemo(
        () =>
            Children.map(children, item => {
                if (!item) {
                    return item;
                }

                const item2 = item as ReactElement<MenuItemProps & RippleProps>;
                if (item2.type === MenuItem) {
                    return cloneElement(item2, {
                        ripple: item2.props.ripple || ripple,
                        selected:
                            typeof item2.props.value !== "undefined" && selectable && item2.props.value === selected,
                        onClick: (e: MouseEvent<HTMLLIElement>) => handleSelect(item2, e)
                    });
                }

                return cloneElement(item2);
            }),
        [children, handleSelect, ripple, selectable, selected]
    );

    return (
        <div
            ref={rootNode}
            data-react-toolbox="menu"
            className={classNames(theme.menu({[position]: true, active, rippled}), className)}
            style={rootStyle}
        >
            {outline ? <div className={theme.outline()} style={outlineStyle} /> : null}
            <ul ref={menuNode} className={theme.menuInner()} style={menuStyle}>
                {items}
            </ul>
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
