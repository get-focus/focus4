import {CSSProperties, MouseEventHandler, ReactNode, TouchEventHandler} from "react";

import {ToBem} from "@focus4/styling";
import {CheckboxCss} from "../__style__/checkbox.css";

import {rippleFactory} from "../ripple";

export interface CheckProps {
    children?: ReactNode;
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    style?: CSSProperties;
    theme: ToBem<CheckboxCss>;
    value: boolean;
}

export const Check = rippleFactory({rippleCentered: true, rippleSpread: 2.6})(function RTCheck({
    children,
    onMouseDown,
    onTouchStart,
    style,
    theme,
    value
}: CheckProps) {
    return (
        <div
            data-react-toolbox="check"
            className={theme.check({checked: value})}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={style}
        >
            {children}
        </div>
    );
});
