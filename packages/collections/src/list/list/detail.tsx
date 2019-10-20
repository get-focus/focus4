import {motion} from "framer-motion";
import {ComponentType} from "react";

import {defaultTransition, ToBem} from "@focus4/styling";
import {IconButton} from "@focus4/toolbox";

import {ListCss} from "../__style__/list.css";

/** Props de base d'un composant de détail. */
export interface DetailProps<T> {
    /** Handler de fermeture du détail. */
    closeDetail: () => void;
    /** Elément de liste sélectionné. */
    data: T;
}

/** Props du composant wrapper du détail. */
export interface DetailWrapperProps {
    displayedIdx: number;
    mode: "list" | "mosaic";
    mosaic: {width: number; height: number};
    isAddItemShown: boolean;
    byLine: number;
    DetailComponent: ComponentType<DetailProps<{}>>;
    closeDetail: () => void;
    item: {};
    theme: ToBem<ListCss>;
}

/** Wrapper pour le composant de détail. */
export function DetailWrapper({
    displayedIdx,
    mode,
    mosaic,
    isAddItemShown,
    byLine,
    DetailComponent,
    closeDetail,
    item,
    theme
}: DetailWrapperProps) {
    return (
        <motion.li
            className={theme.detailWrapper()}
            initial={{overflow: "hidden", height: 0}}
            animate={{overflow: "hidden", height: "auto", transitionEnd: {overflow: "visible"}}}
            exit={{overflow: "hidden", height: 0}}
            transition={defaultTransition}
        >
            {/* Le calcul de la position du triangle en mosaïque n'est pas forcément évident...
                        et il suppose qu'on ne touche pas au marges par défaut entre les mosaïques. */}
            <div
                className={theme.triangle()}
                style={
                    displayedIdx === undefined && mode === "mosaic"
                        ? {left: -1000}
                        : mode === "mosaic"
                        ? {
                              left:
                                  mosaic.width / 2 -
                                  8.25 +
                                  ((displayedIdx! + (isAddItemShown ? 1 : 0)) % byLine) * (mosaic.width + 10)
                          }
                        : {}
                }
            />
            <div className={theme.detail()}>
                <IconButton icon="clear" onClick={closeDetail} />
                <DetailComponent data={item} closeDetail={closeDetail} />
            </div>
        </motion.li>
    );
}
