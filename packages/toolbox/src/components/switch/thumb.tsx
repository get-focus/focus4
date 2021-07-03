import {MouseEventHandler, ReactNode, TouchEventHandler} from "react";

import {rippleFactory} from "../ripple";

export interface ThumbProps {
    children?: ReactNode;
    className?: string;
    onMouseDown?: MouseEventHandler<HTMLSpanElement>;
    onTouchStart?: TouchEventHandler<HTMLSpanElement>;
}

export const Thumb = rippleFactory({rippleCentered: true, rippleSpread: 2.6})(function RTThumb({
    className,
    children,
    onMouseDown,
    onTouchStart
}: ThumbProps) {
    return (
        <span className={className} onMouseDown={onMouseDown} onTouchStart={onTouchStart}>
            {children}
        </span>
    );
});
