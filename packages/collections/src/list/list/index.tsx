import {AnimatePresence} from "framer-motion";
import {autorun, comparer, observable, reaction} from "mobx";
import {useAsObservableSource, useLocalStore, useObserver} from "mobx-react";
import {ComponentType, useContext, useEffect} from "react";

import {CollectionStore} from "@focus4/stores";
import {CSSProp, useTheme} from "@focus4/styling";

import {OperationListItem} from "../contextual-actions";
import {DndDragLayer, DragLayerCss} from "../drag-layer";
import {ListBaseProps, useListBase} from "../list-base";
import {
    AddItemProps,
    DefaultAddItemComponent,
    DefaultEmptyComponent,
    DefaultLoadingComponent,
    EmptyProps,
    LoadingProps
} from "../shared";
import {ListContext} from "./context";
import {DetailProps, DetailWrapper} from "./detail";
import {LineProps, LineWrapper} from "./line";

export {DetailProps, LineProps, ListContext};

import listCss, {ListCss} from "../__style__/list.css";
export {listCss, ListCss};

/** Props du composant de liste standard. */
export type ListProps<T> = ListBaseProps<T> & {
    /** Composant personnalisé pour le bouton "Ajouter". */
    AddItemComponent?: ComponentType<AddItemProps<T>>;
    /** Handler au clic sur le bouton "Ajouter". */
    addItemHandler?: () => void;
    /** Précise si chaque élément peut ouvrir le détail ou non. Par défaut () => true. */
    canOpenDetail?: (data: T) => boolean;
    /** Composant de détail, à afficher dans un "accordéon" au clic sur un objet. */
    DetailComponent?: ComponentType<DetailProps<T>>;
    /** Nombre d'éléments à partir du quel on n'affiche plus d'animation de drag and drop sur les lignes. */
    disableDragAnimThreshold?: number;
    /** Type de l'item de liste pour le drag and drop. Par défaut : "item". */
    dragItemType?: string;
    /** CSS du DragLayer. */
    dragLayerTheme?: CSSProp<DragLayerCss>;
    /** Component à afficher lorsque la liste est vide. */
    EmptyComponent?: ComponentType<EmptyProps<T>>;
    /** Active le drag and drop. */
    hasDragAndDrop?: boolean;
    /** Affiche la sélection sur les lignes (store uniquement). */
    hasSelection?: boolean;
    /** Cache le bouton "Ajouter" dans la mosaïque et le composant vide. */
    hideAdditionalItems?: boolean;
    /** Composant de ligne. */
    LineComponent?: ComponentType<LineProps<T>>;
    /** Composant à afficher pendant le chargement. */
    LoadingComponent?: ComponentType<LoadingProps<T>>;
    /** Mode des listes dans le wrapper. Par défaut : celui du composant fourni, ou "list". */
    mode?: "list" | "mosaic";
    /** Taille de la mosaïque. */
    mosaic?: {width: number; height: number};
    /** Composant de mosaïque. */
    MosaicComponent?: ComponentType<LineProps<T>>;
    /** La liste des actions sur chaque élément de la liste. */
    operationList?: (data: T) => OperationListItem<T>[];
    /** CSS. */
    theme?: CSSProp<ListCss>;
} & (
        | {
              /** Les données du tableau. */
              data: T[];
          }
        | {
              /** Le store contenant la liste. */
              store: CollectionStore<T>;
          }
    );

/** Composant de liste standard */
export function List<T>({
    AddItemComponent = DefaultAddItemComponent,
    addItemHandler,
    canOpenDetail = () => true,
    DetailComponent,
    disableDragAnimThreshold,
    dragItemType,
    dragLayerTheme,
    EmptyComponent = DefaultEmptyComponent,
    hasDragAndDrop,
    hasSelection,
    hideAdditionalItems,
    LineComponent,
    LoadingComponent = DefaultLoadingComponent,
    mode,
    mosaic = {width: 200, height: 200},
    MosaicComponent,
    operationList,
    theme: pTheme,
    ...baseProps
}: ListProps<T>) {
    const listContext = useContext(ListContext);
    const theme = useTheme("list", listCss, pTheme);
    const oProps = useAsObservableSource({addItemHandler, mode});
    const state = useLocalStore(() => ({
        get addItemHandler() {
            return oProps.addItemHandler ?? listContext.addItemHandler;
        },
        get mode() {
            return oProps.mode ?? listContext.mode ?? (MosaicComponent && !LineComponent ? "mosaic" : "list");
        },

        /** Nombre de mosaïque par ligne, déterminé à la volée. */
        byLine: 0,
        /** Index de l'item sur lequel on doit afficher le détail. */
        displayedIdx: undefined as number | undefined,
        /** Ref vers la liste pour déterminer sa largeur. */
        ulRef: null as HTMLUListElement | null,
        /** Liste des éléments sélectionnés par le drag and drop. */
        draggedItems: observable<T>([]),

        /** Toggle le détail depuis la ligne. */
        async toggleDetail(
            idx: number,
            {onOpen, onClose}: {onOpen?: () => Promise<void> | void; onClose?: () => Promise<void> | void} = {}
        ) {
            const displayedIdx = state.displayedIdx !== idx ? idx : undefined;
            if (displayedIdx !== undefined && onOpen) {
                await onOpen();
            }
            if (displayedIdx === undefined && onClose) {
                await onClose();
            }

            state.displayedIdx = displayedIdx;
        },

        /** Ferme le détail. */
        closeDetail() {
            state.displayedIdx = undefined;
        }
    }));

    /** Met à jour `byLine`. */
    useEffect(() => {
        const updateByLine = () => {
            if (state.ulRef) {
                state.byLine = state.mode === "mosaic" ? Math.floor(state.ulRef.clientWidth / (mosaic!.width + 10)) : 1;
            }
        };

        const disposer = autorun(updateByLine);
        window.addEventListener("resize", updateByLine);

        return () => {
            disposer();
            window.removeEventListener("resize", updateByLine);
        };
    }, []);

    return useObserver(() => {
        const {bottomRow, displayedData, getDomRef, i18nPrefix, isLoading, itemKey, store} = useListBase(baseProps);

        /** Réaction pour fermer le détail si la liste change. */
        useEffect(
            () =>
                reaction(() => displayedData.map(itemKey), state.closeDetail, {
                    fireImmediately: true,
                    equals: comparer.structural
                }),
            []
        );

        /** Affiche ou non l'ajout d'élément dans la liste (en mosaïque). */
        const isAddItemShown = !!(!hideAdditionalItems && state.addItemHandler && state.mode === "mosaic");

        /** Désactive l'animation de drag and drop sur les lignes. */
        const disableDragAnimation =
            disableDragAnimThreshold === undefined ? false : disableDragAnimThreshold <= displayedData.length;

        let Component: ComponentType<LineProps<T>>;
        if (state.mode === "list" && LineComponent) {
            Component = LineComponent;
        } else if (state.mode === "mosaic" && MosaicComponent) {
            Component = MosaicComponent;
        } else {
            throw new Error("Aucun component de ligne ou de mosaïque n'a été précisé.");
        }

        const lines = displayedData.map((item, idx) => (
            <LineWrapper
                key={itemKey(item, idx)}
                data={item}
                domRef={getDomRef(idx)}
                disableDragAnimation={disableDragAnimation}
                dragItemType={dragItemType}
                draggedItems={hasDragAndDrop ? state.draggedItems : undefined}
                hasSelection={store ? hasSelection : undefined}
                i18nPrefix={i18nPrefix}
                mosaic={state.mode === "mosaic" ? mosaic : undefined}
                LineComponent={Component}
                toggleDetail={
                    canOpenDetail(item) && DetailComponent
                        ? (callbacks?: {}) => state.toggleDetail(idx, callbacks)
                        : undefined
                }
                operationList={operationList}
                store={store}
                theme={theme}
            />
        ));

        /* On regarde si le composant de détail doit être ajouté. */
        if (DetailComponent && state.displayedIdx !== undefined) {
            const idx =
                state.mode === "list"
                    ? state.displayedIdx + 1
                    : (Math.floor((state.displayedIdx + (isAddItemShown ? 1 : 0)) / state.byLine) + 1) * state.byLine -
                      (isAddItemShown ? 1 : 0);

            // Puis on ajoute l'élément à sa place dans la liste.
            lines.splice(
                idx,
                0,
                <DetailWrapper
                    displayedIdx={state.displayedIdx}
                    DetailComponent={DetailComponent as any}
                    byLine={state.byLine}
                    closeDetail={state.closeDetail}
                    isAddItemShown={isAddItemShown}
                    item={displayedData[state.displayedIdx]}
                    mode={state.mode}
                    mosaic={mosaic!}
                    theme={theme}
                    key={`detail-${idx}`}
                />
            );
        }

        return (
            <>
                {!navigator.userAgent.match(/Trident/) && hasDragAndDrop ? (
                    <DndDragLayer i18nPrefix={i18nPrefix} theme={dragLayerTheme} />
                ) : null}
                <div className={state.mode === "list" ? theme.list() : theme.mosaic()}>
                    {/* Gestion de l'empty state. */}
                    {!isLoading && !hideAdditionalItems && !displayedData.length ? (
                        <EmptyComponent addItemHandler={state.addItemHandler} i18nPrefix={i18nPrefix} store={store} />
                    ) : (
                        <ul ref={ul => (state.ulRef = ul)}>
                            {/* On regarde si on doit ajouter l'élément d'ajout. */}
                            {isAddItemShown ? (
                                <li
                                    key="mosaic-add"
                                    className={theme.mosaicAdd()}
                                    style={{width: mosaic!.width, height: mosaic!.height}}
                                >
                                    <AddItemComponent
                                        addItemHandler={state.addItemHandler!}
                                        i18nPrefix={i18nPrefix}
                                        mode="mosaic"
                                    />
                                </li>
                            ) : null}
                            {DetailComponent ? <AnimatePresence>{lines}</AnimatePresence> : lines}
                        </ul>
                    )}
                    {/* Gestion de l'affichage du chargement. */}
                    {isLoading ? <LoadingComponent i18nPrefix={i18nPrefix} store={store} /> : null}
                    {bottomRow}
                </div>
            </>
        );
    });
}

/**
 * Crée un composant de liste standard.
 * @param props Les props de la liste.
 */
export function listFor<T>(props: ListProps<T>) {
    return <List<T> {...props} />;
}
