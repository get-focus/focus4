import {action, toJS} from "mobx";
import {useLocalStore, useObserver} from "mobx-react";
import {MouseEvent as RMouseEvent, useCallback, useContext, useEffect, useRef} from "react";
import posed, {Transition} from "react-pose";

import {CSSProp, defaultPose, useTheme} from "@focus4/styling";
import {Button, ButtonCss, ButtonProps, IconButton, IconButtonCss, IconButtonProps, RippleProps} from "@focus4/toolbox";

import {MenuContext} from "./context";
import {MainMenuList} from "./list";
import {mainMenuCss, MainMenuCss} from "./style";

/** Props du MenuItem. */
export interface MainMenuItemProps extends Omit<ButtonProps & IconButtonProps & RippleProps, "theme"> {
    /** La route associée, pour comparaison avec la route active. */
    route?: string;
    /** CSS. */
    theme?: CSSProp<MainMenuCss>;
}

/** Elément de menu. */
export function MainMenuItem({label, icon, onClick, route, children, theme: pTheme, ...otherProps}: MainMenuItemProps) {
    const theme = useTheme<MainMenuCss>("mainMenu", mainMenuCss, pTheme);
    const context = useContext(MenuContext);
    const state = useLocalStore(() => ({hasSubMenu: false, top: 0, left: 0}));

    const li = useRef<HTMLLIElement>(null);
    const panel = useRef<HTMLDivElement>(null);

    const onItemClick = useCallback(
        action((event: RMouseEvent<HTMLLinkElement | HTMLButtonElement>) => {
            if (children) {
                const liRect = li.current!.getBoundingClientRect();
                state.hasSubMenu = !state.hasSubMenu;
                state.top = liRect.top;
                state.left = liRect.left + liRect.width;
            }
            if (onClick) {
                onClick(event);
                context.closePanel();
            }
        }),
        []
    );

    const onDocumentClick = useCallback((e: MouseEvent) => {
        if (panel.current && li.current) {
            if (!panel.current.contains(e.target as Node) && !li.current.contains(e.target as Node)) {
                state.hasSubMenu = false;
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mouseup", onDocumentClick);
        return () => document.removeEventListener("mouseup", onDocumentClick);
    }, []);

    return useObserver(() => (
        <>
            <li ref={li} className={theme.item({active: route === context.activeRoute})}>
                {label ? (
                    <Button
                        {...otherProps}
                        icon={icon}
                        label={label}
                        onClick={onItemClick}
                        theme={theme as CSSProp<ButtonCss>}
                    />
                ) : (
                    <IconButton
                        {...otherProps}
                        icon={icon}
                        onClick={onItemClick}
                        rippleTheme={theme}
                        theme={theme as CSSProp<IconButtonCss>}
                    />
                )}
            </li>
            {context.renderSubMenu(
                <Transition>
                    {state.hasSubMenu && (
                        <PosedDiv key="panel" ref={panel} className={theme.panel()} style={toJS(state)}>
                            <MainMenuList
                                activeRoute={context.activeRoute}
                                closePanel={() => (state.hasSubMenu = false)}
                                theme={theme}
                            >
                                {children}
                            </MainMenuList>
                        </PosedDiv>
                    )}
                </Transition>
            )}
        </>
    ));
}

const PosedDiv = posed.div({
    enter: {
        width: "auto",
        opacity: 1,
        ...defaultPose
    },
    exit: {
        width: 0,
        opacity: 0.7,
        ...defaultPose
    }
});
