import classNames from "classnames";
import {Children, MouseEventHandler, TouchEventHandler} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import chipCss, {ChipCss} from "./__style__/chip.css";
export {chipCss, ChipCss};

import {Avatar} from "./avatar";

export interface ChipProps {
    className?: string;
    /** Children to pass through the component. */
    children?: React.ReactNode;
    /** If true, the chip will be rendered with a delete icon. */
    deletable?: boolean;
    onClick?: MouseEventHandler<HTMLDivElement>;
    /** Callback to be invoked when the delete icon is clicked. */
    onDeleteClick?: MouseEventHandler<HTMLSpanElement>;
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    /** Classnames object defining the component style. */
    theme?: CSSProp<ChipCss>;
}

export function Chip({
    className = "",
    children,
    deletable,
    onClick,
    onDeleteClick,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
    theme: pTheme
}: ChipProps) {
    const theme = useTheme("RTChip", chipCss, pTheme);

    let avatar = false;
    if (Children.count(children)) {
        const flatChildren = Children.toArray(children);
        const firstChild = flatChildren[0];
        avatar = (firstChild as any)?.type === Avatar;
    }

    return (
        <div
            data-react-toolbox="chip"
            className={classNames(theme.chip({avatar, deletable}), className)}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
        >
            {typeof children === "string" ? <span>{children}</span> : children}
            {deletable ? (
                <span className={theme.delete()} onClick={onDeleteClick}>
                    <svg viewBox="0 0 40 40" className={theme.deleteIcon()}>
                        <path className={theme.deleteX()} d="M 12,12 L 28,28 M 28,12 L 12,28" />
                    </svg>
                </span>
            ) : null}
        </div>
    );
}
