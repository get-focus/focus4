import classNames from "classnames";
import {
    createElement,
    CSSProperties,
    MouseEvent,
    MouseEventHandler,
    ReactNode,
    TouchEventHandler,
    useCallback,
    useRef
} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import iconButtonCss, {IconButtonCss} from "./__style__/icon-button.css";
export {iconButtonCss, IconButtonCss};

import {FontIcon} from "./font-icon";
import {rippleFactory} from "./ripple";

export interface IconButtonProps {
    /** Indicates if the button should have accent color. */
    accent?: boolean;
    /** Children to pass through the component. */
    children?: ReactNode;
    className?: string;
    /** If true, component will be disabled. */
    disabled?: boolean;
    href?: string;
    /** Value of the icon (See Font Icon Component). */
    icon?: ReactNode;
    /** If true, the neutral colors are inverted. Useful to put a button over a dark background. */
    inverse?: boolean;
    onClick?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseDown?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseEnter?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseLeave?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseUp?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onTouchStart?: TouchEventHandler<HTMLLinkElement | HTMLButtonElement>;
    /** Indicates if the button should have primary color. */
    primary?: boolean;
    style?: CSSProperties;
    target?: string;
    theme?: CSSProp<IconButtonCss>;
    /** Component root container type. */
    type?: string;
}

export const IconButton = rippleFactory({rippleCentered: true, theme: {rippleWrapper: iconButtonCss.rippleWrapper}})(
    function RTIconButton({
        accent = false,
        children,
        className = "",
        disabled,
        href,
        icon,
        inverse,
        onClick,
        onMouseDown,
        onMouseEnter,
        onMouseLeave,
        onMouseUp,
        onTouchStart,
        primary = false,
        style,
        target,
        theme: pTheme,
        type = "button"
    }: IconButtonProps) {
        const theme = useTheme("RTIconButton", iconButtonCss, pTheme);
        const buttonNode = useRef<HTMLLinkElement | HTMLButtonElement | null>(null);

        const handleMouseUp = useCallback(
            (event: MouseEvent<HTMLLinkElement | HTMLButtonElement>) => {
                buttonNode.current?.blur();
                onMouseUp?.(event);
            },
            [onMouseUp]
        );

        const handleMouseLeave = useCallback(
            (event: MouseEvent<HTMLLinkElement | HTMLButtonElement>) => {
                buttonNode.current?.blur();
                onMouseLeave?.(event);
            },
            [onMouseLeave]
        );

        const element = href ? "a" : "button";

        const props = {
            ref: buttonNode,
            className: classNames(theme.toggle({accent, inverse, neutral: !primary && !accent, primary}), className),
            disabled,
            href,
            onClick,
            onMouseDown,
            onMouseEnter,
            onMouseLeave: handleMouseLeave,
            onMouseUp: handleMouseUp,
            onTouchStart,
            style,
            target,
            type: !href ? type : null,
            "data-react-toolbox": "button"
        };

        const iconElement = typeof icon === "string" ? <FontIcon className={theme.icon()} value={icon} /> : icon;
        return createElement(element, props, icon && iconElement, children);
    }
);
