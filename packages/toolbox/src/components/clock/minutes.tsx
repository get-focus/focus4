import {range} from "lodash";
import {useCallback, useRef} from "react";

import {ToBem} from "@focus4/styling";
import {ClockCss} from "../__style__/clock.css";

import {Face} from "./face";
import {Hand, HandRef} from "./hand";

const minutes = range(0, 12).map(i => i * 5);
const step = 360 / 60;

export interface MinutesProps {
    center: {
        x: number;
        y: number;
    };
    onChange: (value: number) => void;
    onHandMoved?: () => void;
    radius: number;
    selected: number;
    spacing: number;
    theme: ToBem<ClockCss>;
}

export function Minutes({center, onChange, onHandMoved, radius, selected, spacing, theme}: MinutesProps) {
    const handNode = useRef<HandRef | null>(null);

    const handleHandMove = useCallback(
        (degrees: number) => {
            onChange(degrees / step);
        },
        [onChange]
    );

    const handleMouseDown = useCallback(event => {
        handNode.current?.mouseStart(event);
    }, []);

    const handleTouchStart = useCallback(event => {
        handNode.current?.touchStart(event);
    }, []);

    return (
        <div>
            <Face
                onTouchStart={handleTouchStart}
                onMouseDown={handleMouseDown}
                numbers={minutes}
                spacing={spacing}
                radius={radius}
                active={selected}
                theme={theme}
                twoDigits
            />
            <Hand
                ref={handNode}
                angle={selected * step}
                length={radius - spacing}
                onMove={handleHandMove}
                onMoved={onHandMoved}
                origin={center}
                theme={theme}
                small={minutes.indexOf(selected) === -1}
                step={step}
            />
        </div>
    );
}
