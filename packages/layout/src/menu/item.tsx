import {AnimatePresence, motion} from "framer-motion";
import {action, toJS} from "mobx";
import {useLocalStore, useObserver} from "mobx-react";
import {useCallback, useContext, useEffect, useRef} from "react";

import {CSSProp, defaultTransition, useTheme} from "@focus4/styling";
import {Button, ButtonProps, IconButton} from "@focus4/toolbox";

import {MenuContext} from "./context";
import {MainMenuList} from "./list";
import {mainMenuCss, MainMenuCss} from "./style";

/** Props du MenuItem. */
export interface MainMenuItemProps extends Omit<ButtonProps, "theme"> {
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
        action(() => {
            if (children) {
                const liRect = li.current!.getBoundingClientRect();
                state.hasSubMenu = !state.hasSubMenu;
                state.top = liRect.top;
                state.left = liRect.left + liRect.width;
            }
            if (onClick) {
                onClick();
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
                    <Button {...otherProps} icon={icon} label={label} onClick={onItemClick} theme={theme} />
                ) : (
                    <IconButton {...otherProps} icon={icon} onClick={onItemClick} theme={theme} />
                )}
            </li>
            {context.renderSubMenu(
                <AnimatePresence>
                    {state.hasSubMenu && (
                        <motion.div
                            ref={panel}
                            className={theme.panel()}
                            style={toJS(state)}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={defaultTransition}
                            variants={{
                                visible: {
                                    width: "auto",
                                    opacity: 1
                                },
                                hidden: {
                                    width: 0,
                                    opacity: 0.7
                                }
                            }}
                        >
                            <MainMenuList
                                activeRoute={context.activeRoute}
                                closePanel={() => (state.hasSubMenu = false)}
                                theme={theme}
                            >
                                {children}
                            </MainMenuList>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </>
    ));
}
