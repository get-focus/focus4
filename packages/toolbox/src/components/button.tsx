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
import buttonCss, {ButtonCss} from "./__style__/button.css";
export {buttonCss, ButtonCss};

import {FontIcon} from "./font-icon";
import {rippleFactory} from "./ripple";

export interface ButtonProps {
    /** Indicates if the button should have accent color. */
    accent?: boolean;
    /** Children to pass through the component. */
    children?: ReactNode;
    className?: string;
    /** If true, component will be disabled. */
    disabled?: boolean;
    /** If true, the button will have a floating look. */
    floating?: boolean;
    /** Creates a link for the button. */
    href?: string;
    /** Value of the icon (See Font Icon Component). */
    icon?: ReactNode;
    /** If true, the neutral colors are inverted. Useful to put a button over a dark background. */
    inverse?: boolean;
    /**  The text string to use for the name of the button. */
    label?: string;
    /** To be used with floating button. If true, the button will be smaller. */
    mini?: boolean;
    onClick?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseDown?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseEnter?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseLeave?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onMouseUp?: MouseEventHandler<HTMLLinkElement | HTMLButtonElement>;
    onTouchStart?: TouchEventHandler<HTMLLinkElement | HTMLButtonElement>;
    /** Indicates if the button should have primary color. */
    primary?: boolean;
    /** If true, the button will have a raised look. */
    raised?: boolean;
    style?: CSSProperties;
    /** Passed down to the root element */
    target?: string;
    /** Classnames object defining the component style. */
    theme?: CSSProp<ButtonCss>;
    /** Component root container type. */
    type?: string;
}

export const Button = rippleFactory({theme: {rippleWrapper: buttonCss.rippleWrapper}})(function RTButton({
    accent = false,
    children,
    className = "",
    disabled,
    floating = false,
    href,
    icon,
    inverse,
    label,
    mini = false,
    onClick,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onMouseUp,
    onTouchStart,
    primary = false,
    raised = false,
    style,
    target,
    theme: pTheme,
    type = "button"
}: ButtonProps) {
    const theme = useTheme("RTButton", buttonCss, pTheme);
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
        className: classNames(
            theme.button({
                accent,
                flat: !raised && !floating,
                floating,
                inverse,
                mini,
                neutral: !primary && !accent,
                primary,
                raised,
                solid: raised || floating,
                squared: !floating
            }),
            className
        ),
        disabled,
        href,
        onClick,
        onMouseDown,
        onMouseEnter,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseLeave,
        onTouchStart,
        style,
        target,
        type: !href ? type : null,
        "data-react-toolbox": "button"
    };

    const buttonElement = createElement(
        element,
        props,
        icon ? <FontIcon className={theme.icon()} value={icon} /> : null,
        label,
        children
    );

    return onMouseEnter && disabled ? (
        <span onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp}>
            {buttonElement}
        </span>
    ) : (
        buttonElement
    );
});
