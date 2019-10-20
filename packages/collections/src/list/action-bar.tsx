import {AnimatePresence, motion} from "framer-motion";
import i18next from "i18next";
import {reduce} from "lodash";
import {action, reaction} from "mobx";
import {useObserver} from "mobx-react";
import {useEffect, useState} from "react";

import {CollectionStore} from "@focus4/stores";
import {CSSProp, defaultTransition, getIcon, useTheme} from "@focus4/styling";
import {Button, ButtonMenu, IconButton, Input, MenuItem} from "@focus4/toolbox";

import {AdditionalFacet, FacetBox, shouldDisplayFacet} from "../search";
import {ContextualActions, OperationListItem} from "./contextual-actions";

import actionBarCss, {ActionBarCss} from "./__style__/action-bar.css";
export {actionBarCss, ActionBarCss};

/** Props de l'ActionBar. */
export interface ActionBarProps<T> {
    /** Composants additionnels à afficher dans la FacetBox, pour y intégrer des filtres par exemple.  */
    additionalFacets?: {
        [facet: string]: AdditionalFacet;
    };
    /** Constitution de l'éventuel groupe auquel est lié l'ActionBar */
    group?: {code: string; label: string; totalCount: number};
    /** Si renseignée, seules les facettes de cette liste pourront être sélectionnées comme groupingKey. */
    groupableFacets?: string[];
    /** Contient une FacetBox. */
    hasFacetBox?: boolean;
    /** Affiche le bouton de groupe. */
    hasGrouping?: boolean;
    /** Affiche la barre de recherche. */
    hasSearchBar?: boolean;
    /** Affiche la case pour la sélection. */
    hasSelection?: boolean;
    /** Préfixe i18n pour les libellés. Par défaut : "focus". */
    i18nPrefix?: string;
    /** Nombre de valeurs de facettes affichées. Par défaut : 6 */
    nbDefaultDataListFacet?: number;
    /** Liste des colonnes sur lesquels on peut trier. */
    orderableColumnList?: {key: string; label: string; order: boolean}[];
    /** Actions sur les éléments sélectionnés. */
    operationList?: OperationListItem<T[]>[];
    /** Placeholder pour la barre de recherche. */
    searchBarPlaceholder?: string;
    /** Affiche les facettes qui n'ont qu'une seule valeur. */
    showSingleValuedFacets?: boolean;
    /** Store associé. */
    store: CollectionStore<T>;
    /** CSS. */
    theme?: CSSProp<ActionBarCss>;
}

/** Barre d'actions pour une liste ou un groupe de recherche. Permet le tri, le grouping, la recherche et la sélection + actions en masse. */
export function ActionBar<T>({
    additionalFacets,
    group,
    groupableFacets,
    hasFacetBox,
    hasGrouping,
    hasSearchBar,
    hasSelection,
    i18nPrefix = "focus",
    nbDefaultDataListFacet = 6,
    operationList,
    orderableColumnList,
    searchBarPlaceholder,
    showSingleValuedFacets,
    store,
    theme: pTheme
}: ActionBarProps<T>) {
    /** Affiche la FacetBox. */
    const [displayFacetBox, setDisplayFacetBox] = useState(false);

    const theme = useTheme("actionBar", actionBarCss, pTheme);

    function groupButton() {
        if (hasGrouping && !store.selectedItems.size && !store.groupingKey) {
            const groupableColumnList = store.facets
                ? store.facets.reduce((result, facet) => {
                      if (
                          // On ne peut pas grouper sur des facettes avec une seule valeur (qui sont d'ailleurs masquées par défaut).
                          facet.values.length > 1 &&
                          // Ni sur une facette sélectionnée.
                          !Object.keys(store.inputFacets).includes(facet.code) &&
                          // Et on ne garde que les facettes demandées dans la liste.
                          (!groupableFacets || groupableFacets.find(code => code === facet.code))
                      ) {
                          return {...result, [facet.code]: facet.label};
                      }
                      return result;
                  }, {})
                : {};

            const menuItems = reduce(
                groupableColumnList,
                (oL, label, key) => [
                    ...oL,
                    <MenuItem key={key} onClick={() => (store.groupingKey = key)} caption={i18next.t(label)} />
                ],
                [] as JSX.Element[]
            );

            if (menuItems.length) {
                return (
                    <ButtonMenu
                        button={{
                            label: i18next.t(`${i18nPrefix}.search.action.group`),
                            icon: getIcon(`${i18nPrefix}.icons.actionBar.dropdown`),
                            openedIcon: getIcon(`${i18nPrefix}.icons.actionBar.dropup`),
                            theme: {icon: theme.dropdown()}
                        }}
                        onClick={() => setDisplayFacetBox(false)}
                    >
                        {menuItems}
                    </ButtonMenu>
                );
            }
        }

        return null;
    }

    /** Réaction permettant de fermer la FacetBox et de mettre à jour sa hauteur à chaque fois que c'est nécessaire (changement de son contenu).  */
    useEffect(
        () =>
            reaction(
                () => (hasFacetBox && store.facets.length && store.facets[0]) || false,
                () => {
                    // On ferme la FacetBox si on se rend compte qu'on va afficher une FacetBox vide.
                    if (
                        displayFacetBox &&
                        store.facets.every(
                            facet =>
                                !shouldDisplayFacet(facet, store.inputFacets, showSingleValuedFacets, store.totalCount)
                        )
                    ) {
                        setDisplayFacetBox(false);
                    }
                },
                {fireImmediately: true}
            ),
        [displayFacetBox, hasFacetBox, showSingleValuedFacets, store]
    );

    return useObserver(() => (
        <div className={theme.container()}>
            {/* ActionBar en tant que telle. */}
            <div className={theme.bar({selection: !!store.selectedItems.size})}>
                <div className={theme.buttons()}>
                    {/** Bouton de sélection (case à cocher). */}
                    {hasSelection ? (
                        <IconButton
                            icon={getIcon(`${i18nPrefix}.icons.actionBar.${store.selectionStatus}`)}
                            onClick={store.toggleAll}
                            theme={{toggle: theme.selectionToggle(), icon: theme.selectionIcon()}}
                        />
                    ) : null}

                    {/** Eléments sélectionnés */}
                    {group ? <strong>{`${i18next.t(group.label)} (${group.totalCount})`}</strong> : null}
                    {store.selectedItems.size ? (
                        <strong>{`${store.selectedItems.size} ${i18next.t(`${i18nPrefix}.search.action.selectedItem`, {
                            count: store.selectedItems.size
                        })}`}</strong>
                    ) : null}

                    {/** Bouton permettant d'afficher le panneau dépliant contenant la FacetBox (si demandé). */}
                    {hasFacetBox &&
                    store.facets.some(facet =>
                        shouldDisplayFacet(facet, store.inputFacets, showSingleValuedFacets, store.totalCount)
                    ) ? (
                        <div style={{position: "relative"}}>
                            <Button
                                onClick={() => setDisplayFacetBox(!displayFacetBox)}
                                icon={getIcon(`${i18nPrefix}.icons.actionBar.drop${displayFacetBox ? "up" : "down"}`)}
                                theme={{icon: theme.dropdown()}}
                                label={i18next.t(`${i18nPrefix}.search.action.filter`)}
                            />
                            {displayFacetBox ? <div className={theme.triangle()} /> : null}
                        </div>
                    ) : null}

                    {/** Bouton de tri. */}
                    {store.totalCount > 1 && !store.selectedItems.size && !store.groupingKey && orderableColumnList ? (
                        <ButtonMenu
                            button={{
                                label: i18next.t(`${i18nPrefix}.search.action.sort`),
                                icon: getIcon(`${i18nPrefix}.icons.actionBar.dropdown`),
                                openedIcon: getIcon(`${i18nPrefix}.icons.actionBar.dropup`),
                                theme: {icon: theme.dropdown()}
                            }}
                            onClick={() => setDisplayFacetBox(false)}
                        >
                            {orderableColumnList.map((description, idx) => (
                                <MenuItem
                                    key={idx}
                                    onClick={action("sort", () => {
                                        store.sortBy = description.key;
                                        store.sortAsc = description.order;
                                    })}
                                    caption={i18next.t(description.label)}
                                />
                            ))}
                        </ButtonMenu>
                    ) : null}

                    {/** Bouton de groupe. */}
                    {groupButton()}

                    {/** Barre de recherche */}
                    {!store.selectedItems.size && hasSearchBar ? (
                        <div className={theme.searchBar()}>
                            <Input
                                icon={getIcon(`${i18nPrefix}.icons.actionBar.search`)}
                                value={store.query}
                                onChange={(text: string) => (store.query = text)}
                                hint={searchBarPlaceholder}
                                theme={{
                                    input: theme.searchBarField(),
                                    icon: theme.searchBarIcon(),
                                    hint: theme.searchBarHint()
                                }}
                            />
                            {store.query ? (
                                <IconButton
                                    icon={getIcon(`${i18nPrefix}.icons.actionBar.close`)}
                                    onClick={() => (store.query = "")}
                                />
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {store.selectedItems.size && operationList && operationList.length ? (
                    <ContextualActions operationList={operationList} data={Array.from(store.selectedItems)} />
                ) : null}
            </div>
            {/* FacetBox */}
            {hasFacetBox ? (
                <div className={theme.facetBoxContainer()}>
                    <AnimatePresence>
                        {displayFacetBox && (
                            <motion.div
                                key="facet-box"
                                initial={{height: 0}}
                                animate={{height: "auto"}}
                                exit={{height: 0}}
                                transition={defaultTransition}
                            >
                                <IconButton
                                    icon={getIcon(`${i18nPrefix}.icons.actionBar.close`)}
                                    onClick={() => setDisplayFacetBox(false)}
                                />
                                <FacetBox
                                    additionalFacets={additionalFacets}
                                    nbDefaultDataList={nbDefaultDataListFacet}
                                    showSingleValuedFacets={showSingleValuedFacets}
                                    store={store}
                                    theme={{facetBox: theme.facetBox()}}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : null}
        </div>
    ));
}

/**
 * Crée une ActionBar.
 * @param props Les props de l'ActionBar.
 */
export function actionBarFor<T>(props: ActionBarProps<T>) {
    return <ActionBar {...props} />;
}
