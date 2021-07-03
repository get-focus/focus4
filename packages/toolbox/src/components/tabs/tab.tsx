import classNames from "classnames";
import {MouseEvent, MouseEventHandler, ReactNode, TouchEventHandler, useCallback, useEffect} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import tabsCss, {TabsCss} from "../__style__/tabs.css";

import {FontIcon} from "../font-icon";
import {rippleFactory} from "../ripple";

export interface TabProps {
    /** If true, the current component is visible. */
    active?: boolean;
    children?: ReactNode;
    className?: string;
    /** If true, the current component is not clickable. */
    disabled?: boolean;
    /** If true, the current component is not visible. */
    hidden?: boolean;
    /** Icon to be used in inner FontIcon. */
    icon?: ReactNode;
    index?: number;
    /** Label text for navigation header. */
    label?: string;
    /** Callback function that is fired when the tab is activated. */
    onActive?: () => void;
    onClick?: (event: MouseEvent<HTMLDivElement>, index: number) => void;
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    /** Classnames object defining the component style. */
    theme?: CSSProp<TabsCss>;
}

export const Tab = rippleFactory({theme: {rippleWrapper: tabsCss.rippleWrapper}})(function RTTab({
    active = false,
    className = "",
    children,
    disabled = false,
    hidden = false,
    icon,
    index = 0,
    label,
    onActive,
    onClick,
    onMouseDown,
    onTouchStart,
    theme: pTheme
}: TabProps) {
    const theme = useTheme("RTTabs", tabsCss, pTheme);

    useEffect(() => {
        if (active) {
            onActive?.();
        }
    }, [active, onActive]);

    const handleClick = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            if (!disabled && onClick) {
                onClick(event, index);
            }
        },
        [disabled, index, onClick]
    );

    return (
        <div
            data-react-toolbox="tab"
            role="tab"
            tabIndex={0}
            className={classNames(theme.label({active, disabled, hidden, withIcon: !!icon}), className)}
            onClick={handleClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {icon && <FontIcon className={(theme as any).icon?.()} value={icon} />}
            {label}
            {children}
        </div>
    );
});
