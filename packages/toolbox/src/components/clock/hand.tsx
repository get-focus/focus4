import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react";

import {ToBem} from "@focus4/styling";
import {ClockCss} from "../__style__/clock.css";

export interface HandProps {
    angle: number;
    length: number;
    onMove: (angle: number, radius: number) => void;
    onMoved?: () => void;
    origin: {
        x: number;
        y: number;
    };
    small?: boolean;
    step: number;
    theme: ToBem<ClockCss>;
}

export interface HandRef {
    mouseStart(event: MouseEvent): void;
    touchStart(event: TouchEvent): void;
}

export const Hand = forwardRef<HandRef, HandProps>(function RTHand(
    {angle, length = 0, onMove, onMoved, origin, small, step, theme},
    ref
) {
    const [knobWidth, setKnobWidth] = useState(0);
    const knobNode = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        setTimeout(() => setKnobWidth(knobNode.current!.offsetWidth));
    }, []);

    const move = useCallback(
        position => {
            const degrees = step * Math.round(angle360FromPositions(origin.x, origin.y, position.x, position.y) / step);
            const x = origin.x - position.x;
            const y = origin.y - position.y;
            const radius = Math.sqrt(x * x + y * y);
            onMove?.(degrees === 360 ? 0 : degrees, radius);
        },
        [onMove, origin, step]
    );

    const [moused, setMoused] = useState(false);
    const [touched, setTouched] = useState(false);
    useImperativeHandle(
        ref,
        () => ({
            mouseStart(event) {
                setMoused(true);
                move({
                    x: event.pageX - (window.scrollX || window.pageXOffset),
                    y: event.pageY - (window.scrollY || window.pageYOffset)
                });
            },
            touchStart(event) {
                setTouched(true);
                move({
                    x: event.touches[0].pageX - (window.scrollX || window.pageXOffset),
                    y: event.touches[0].pageY - (window.scrollY || window.pageYOffset)
                });
                event.stopPropagation();
                event.preventDefault();
            }
        }),
        [move]
    );

    useEffect(() => {
        if (moused) {
            const onMouseMove = (event: MouseEvent) => {
                move({
                    x: event.pageX - (window.scrollX || window.pageXOffset),
                    y: event.pageY - (window.scrollY || window.pageYOffset)
                });
            };
            const onMouseUp = () => {
                setMoused(false);
                onMoved?.();
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
            return () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };
        }
    }, [moused, move, onMoved]);

    useEffect(() => {
        if (touched) {
            const onTouchMove = (event: TouchEvent) => {
                move({
                    x: event.touches[0].pageX - (window.scrollX || window.pageXOffset),
                    y: event.touches[0].pageY - (window.scrollY || window.pageYOffset)
                });
            };
            const onTouchEnd = () => {
                setTouched(false);
                onMoved?.();
            };
            document.addEventListener("touchmove", onTouchMove);
            document.addEventListener("touchend", onTouchEnd);
            return () => {
                document.removeEventListener("touchmove", onTouchMove);
                document.removeEventListener("touchend", onTouchEnd);
            };
        }
    }, [move, onMoved, touched]);

    const handStyle = {
        height: length - knobWidth / 2,
        transform: `rotate(${angle}deg)`
    };

    return (
        <div className={theme.hand({small})} style={handStyle}>
            <div ref={knobNode} className={theme.knob()} />
        </div>
    );
});

function angle360FromPositions(cx: number, cy: number, ex: number, ey: number) {
    const angle = angleFromPositions(cx, cy, ex, ey);
    return angle < 0 ? 360 + angle : angle;
}

function angleFromPositions(cx: number, cy: number, ex: number, ey: number) {
    const theta = Math.atan2(ey - cy, ex - cx) + Math.PI / 2;
    return (theta * 180) / Math.PI;
}
