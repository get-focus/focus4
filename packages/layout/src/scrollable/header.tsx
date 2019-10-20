import {motion} from "framer-motion";
import {HTMLProps, useLayoutEffect, useState} from "react";

import {springTransition} from "@focus4/styling";

interface HeaderProps extends HTMLProps<HTMLElement> {
    onHeightChange: (height: number) => void;
    animated: boolean;
}

export function Header({onHeightChange, animated, ...props}: HeaderProps) {
    const [ref, setRef] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        if (ref) {
            const marginBottom = window.getComputedStyle(ref).marginBottom || "0px";
            onHeightChange(ref.clientHeight + +marginBottom.substring(0, marginBottom.length - 2));
        } else {
            onHeightChange(0);
        }
    });

    return (
        <motion.header
            ref={setRef as any}
            initial={animated ? "hidden" : false}
            animate="visible"
            exit={animated ? "hidden" : {display: "none"}}
            transition={springTransition}
            variants={{visible: {y: "0%"}, hidden: {y: "-105%"}}}
            {...(props as any)}
        />
    );
}
