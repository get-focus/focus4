import {MouseEventHandler, TouchEventHandler, useCallback, useMemo} from "react";

import {ToBem} from "@focus4/styling";
import {ClockCss} from "../__style__/clock.css";

export interface FaceProps {
    active: number;
    numbers: number[];
    onMouseDown?: MouseEventHandler<HTMLDivElement>;
    onTouchStart?: TouchEventHandler<HTMLDivElement>;
    radius: number;
    spacing: number;
    theme: ToBem<ClockCss>;
    twoDigits?: boolean;
}

export function Face({
    active,
    numbers,
    onMouseDown,
    onTouchStart,
    radius,
    spacing,
    theme,
    twoDigits = false
}: FaceProps) {
    const numberStyle = useCallback(
        (rad: number, num: number) => ({
            position: "absolute" as const,
            left: rad + rad * Math.sin((((Math.PI / 180) * 360) / 12) * (num - 1)) + spacing,
            top: rad - rad * Math.cos((((Math.PI / 180) * 360) / 12) * (num - 1)) + spacing
        }),
        [spacing]
    );

    const faceStyle = useMemo(
        () => ({
            height: radius * 2,
            width: radius * 2
        }),
        [radius]
    );

    const renderNumber = useCallback(
        (n: number, idx: number) => (
            <span
                className={theme.number({active: n === active})}
                style={numberStyle(radius - spacing, idx + 1)}
                key={n}
            >
                {twoDigits ? `0${n}`.slice(-2) : n}
            </span>
        ),
        [active, numberStyle, radius, spacing, theme, twoDigits]
    );

    return (
        <div className={theme.face()} onTouchStart={onTouchStart} onMouseDown={onMouseDown} style={faceStyle}>
            {numbers.map(renderNumber)}
        </div>
    );
}
