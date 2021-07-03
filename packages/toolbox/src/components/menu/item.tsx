import classNames from "classnames";
import {MouseEvent, MouseEventHandler, ReactNode, TouchEventHandler, useCallback} from "react";

import {FontIcon} from "../font-icon";
import {rippleFactory} from "../ripple";

import {CSSProp, useTheme} from "@focus4/styling";
import menuCss, {MenuCss} from "../__style__/menu.css";

export interface MenuItemProps {
    /** The text to include in the menu item. Required. */
    caption: string;
    className?: string;
    /** Children to pass through the component. */
    children?: ReactNode;
    /** If true, the item will be displayed as disabled and is not selectable. */
    disabled?: boolean;
    /** Icon font key string or Element to display in the right side of the option. */
    icon?: ReactNode;
    onClick?: MouseEventHandler<HTMLLIElement>;
    onMouseDown?: MouseEventHandler<HTMLLIElement>;
    onTouchStart?: TouchEventHandler<HTMLLIElement>;
    /** @internal */
    selected?: boolean;
    /** Displays shortcut text on the right side of the caption attribute. */
    shortcut?: string;
    /** Classnames object defining the component style. */
    theme?: CSSProp<MenuCss>;
    /** Passed down to the root element. */
    value?: string;
}

export const MenuItem = rippleFactory({})(function RTMenuItem({
    caption,
    children,
    className = "",
    disabled = false,
    icon,
    onClick,
    onMouseDown,
    onTouchStart,
    selected = false,
    shortcut,
    theme: pTheme
}: MenuItemProps) {
    const theme = useTheme("RTMenu", menuCss, pTheme);

    const handleClick = useCallback(
        (event: MouseEvent<HTMLLIElement>) => {
            if (onClick && !disabled) {
                onClick(event);
            }
        },
        [disabled, onClick]
    );

    return (
        <li
            data-react-toolbox="menu-item"
            className={classNames(theme.menuItem({disabled, selected}), className)}
            onClick={handleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {icon ? <FontIcon value={icon} className={theme.icon()} /> : null}
            <span className={theme.caption()}>{caption}</span>
            {shortcut ? <small className={theme.shortcut()}>{shortcut}</small> : null}
            {children}
        </li>
    );
});
