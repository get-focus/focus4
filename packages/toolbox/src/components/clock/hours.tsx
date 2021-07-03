import {range} from "lodash";
import {useCallback, useRef, useState} from "react";

import {ToBem} from "@focus4/styling";
import {ClockCss} from "../__style__/clock.css";

import {Face} from "./face";
import {Hand, HandRef} from "./hand";

const outerNumbers = [0, ...range(13, 24)];
const innerNumbers = [12, ...range(1, 12)];
const innerSpacing = 1.7;
const step = 360 / 12;

export interface HoursProps {
    center: {
        x: number;
        y: number;
    };
    format: "24hr" | "ampm";
    onChange: (value: number) => void;
    onHandMoved?: () => void;
    radius: number;
    selected: number;
    spacing: number;
    theme: ToBem<ClockCss>;
}

export function Hours({center, format, onChange, onHandMoved, radius, selected, spacing, theme}: HoursProps) {
    const [inner, setInner] = useState(format === "24hr" && selected > 0 && selected <= 12);
    const handNode = useRef<HandRef | null>(null);

    const valueFromDegrees = useCallback(
        (degrees: number) => {
            if (format === "ampm" || (format === "24hr" && inner)) {
                return innerNumbers[degrees / step];
            }
            return outerNumbers[degrees / step];
        },
        [format, inner]
    );

    const handleHandMove = useCallback(
        (degrees: number, r: number) => {
            const currentInner = r < radius - spacing * innerSpacing;
            if (format === "24hr" && inner !== currentInner) {
                setInner(currentInner);
                onChange(valueFromDegrees(degrees));
            } else {
                onChange(valueFromDegrees(degrees));
            }
        },
        [format, inner, onChange, radius, spacing, valueFromDegrees]
    );

    const handleMouseDown = useCallback(event => {
        handNode.current?.mouseStart(event);
    }, []);

    const handleTouchStart = useCallback(event => {
        handNode.current?.touchStart(event);
    }, []);

    const is24hr = format === "24hr";
    return (
        <div>
            <Face
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}
                numbers={is24hr ? outerNumbers : innerNumbers}
                spacing={spacing}
                radius={radius}
                twoDigits={is24hr}
                active={is24hr ? selected : selected % 12 || 12}
                theme={theme}
            />
            {format !== "24hr" ? null : (
                <Face
                    active={selected}
                    onTouchStart={handleTouchStart}
                    onMouseDown={handleMouseDown}
                    numbers={innerNumbers}
                    radius={radius - spacing * innerSpacing}
                    spacing={spacing}
                    theme={theme}
                />
            )}
            <Hand
                ref={handNode}
                angle={selected * step}
                length={(inner ? radius - spacing * innerSpacing : radius) - spacing}
                onMove={handleHandMove}
                onMoved={onHandMoved}
                origin={center}
                step={step}
                theme={theme}
            />
        </div>
    );
}
