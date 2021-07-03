import classNames from "classnames";
import {ReactNode} from "react";

import {CSSProp, useTheme} from "@focus4/styling";
import tabsCss, {TabsCss} from "../__style__/tabs.css";

export interface TabContentProps {
    active?: boolean;
    className?: string;
    children?: ReactNode;
    hidden?: boolean;
    /** @internal */
    tabIndex?: number;
    theme?: CSSProp<TabsCss>;
}

export function TabContent({active = false, children, className = "", hidden = true, theme: pTheme}: TabContentProps) {
    const theme = useTheme("RTTabs", tabsCss, pTheme);
    return (
        <section className={classNames(theme.tab({active}), className)} role="tabpanel" aria-expanded={hidden}>
            {children}
        </section>
    );
}
