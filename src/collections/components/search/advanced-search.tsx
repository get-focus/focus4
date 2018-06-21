import {observer} from "mobx-react";
import * as React from "react";

import {ButtonBackToTop} from "../../../components";
import {themr} from "../../../theme";

import {GroupResult, SearchStore} from "../../store";
import {ActionBar, ActionBarStyle, DetailProps, DragLayerStyle, EmptyProps, LineProps, LineStyle, ListStyle, ListWrapper, OperationListItem} from "../list";
import {FacetBox, FacetBoxStyle} from "./facet-box";
import {GroupStyle, Results} from "./results";
import {Summary, SummaryStyle} from "./summary";

import * as styles from "./__style__/advanced-search.css";
export type AdvancedSearchStyle = Partial<typeof styles>;
const Theme = themr("advancedSearch", styles);

/** Props de l'AdvancedSearch. */
export interface AdvancedSearchProps<T> {
    /** CSS de l'ActionBar. */
    actionBarTheme?: ActionBarStyle;
    /** Handler au clic sur le bouton "Ajouter". */
    addItemHandler?: () => void;
    /** Précise si chaque élément peut ouvrir le détail ou non. Par défaut () => true. */
    canOpenDetail?: (data: T) => boolean;
    /** Permet de supprimer le tri. Par défaut : true */
    canRemoveSort?: boolean;
    /** Composant de détail, à afficher dans un "accordéon" au clic sur un objet. */
    DetailComponent?: React.ComponentType<DetailProps<T>>;
    /** Hauteur du composant de détail. Par défaut : 200. */
    detailHeight?: number | ((data: T) => number);
    /** Nombre d'éléments à partir du quel on n'affiche plus d'animation de drag and drop sur les lignes. */
    disableDragAnimThreshold?: number;
    /** Type de l'item de liste pour le drag and drop. Par défaut : "item". */
    dragItemType?: string;
    /** CSS du DragLayer. */
    dragLayerTheme?: DragLayerStyle;
    /** Component à afficher lorsque la liste est vide. */
    EmptyComponent?: React.ComponentType<EmptyProps<T>>;
    /** Emplacement de la FacetBox. Par défaut : "left" */
    facetBoxPosition?: "action-bar" | "left" | "none";
    /** CSS de la FacetBox (si position = "left") */
    facetBoxTheme?: FacetBoxStyle;
    /** Header de groupe personnalisé. */
    GroupHeader?: React.ComponentType<{group: GroupResult<T>}>;
    /** Actions de groupe par scope. */
    groupOperationList?: (group: GroupResult<T>) => OperationListItem<T[]>[];
    /** Nombre d'éléments affichés par page de groupe. Par défaut : 5. */
    groupPageSize?: number;
    /** CSS des groupes. */
    groupTheme?: GroupStyle;
    /** Ajoute un bouton de retour en haut de page. Par défault: true */
    hasBackToTop?: boolean;
    /** Active le drag and drop. */
    hasDragAndDrop?: boolean;
    /** Affiche le bouton de groupe dans l'ActionBar. */
    hasGrouping?: boolean;
    /** Affiche la barre de recherche dans l'ActionBar. */
    hasSearchBar?: boolean;
    /** Autorise la sélection. */
    hasSelection?: boolean;
    /** Masque les critères de recherche dans le Summary. */
    hideSummaryCriteria?: boolean;
    /** Masque les facettes dans le Summary. */
    hideSummaryFacets?: boolean;
    /** Masque le groupe dans le Summary. */
    hideSummaryGroup?: boolean;
    /** Masque le tri dans le Summary. */
    hideSummarySort?: boolean;
    /** Préfixe i18n pour les libellés. Par défaut : "focus". */
    i18nPrefix?: string;
    /** Champ de l'objet à utiliser pour la key des lignes. */
    itemKey?: keyof T;
    /** Chargement manuel (à la place du scroll infini). */
    isManualFetch?: boolean;
    /** Composant de ligne. */
    LineComponent?: React.ComponentType<LineProps<T>>;
    /** La liste des actions sur chaque élément de la liste. */
    lineOperationList?: (data: T) => OperationListItem<T>[];
    /** CSS des lignes. */
    lineTheme?: LineStyle;
    /** Nombre d'éléments affichés par page de liste (pagination locale, indépendante de la recherche). */
    listPageSize?: number;
    /** CSS de la liste. */
    listTheme?: ListStyle;
    /** Mode des listes dans le wrapper. Par défaut : "list". */
    mode?: "list" | "mosaic";
    /** Composants de mosaïque. */
    MosaicComponent?: React.ComponentType<LineProps<T>>;
    /** Largeur des mosaïques. Par défaut : 200. */
    mosaicWidth?: number;
    /** Hauteur des mosaïques. Par défaut : 200. */
    mosaicHeight?: number;
    /** Nombre de valeurs de facettes affichées. Par défaut : 6 */
    nbDefaultDataListFacet?: number;
    /** Offset pour le scroll infini. Par défaut : 250 */
    offset?: number;
    /** La liste des actions globales.  */
    operationList?: OperationListItem<T[]>[];
    /** Liste des colonnes sur lesquels on peut trier. */
    orderableColumnList?: {key: string, label: string, order: boolean}[];
    /** Placeholder pour la barre de recherche de l'ActionBar. */
    searchBarPlaceholder?: string;
    /** Lance la recherche à la construction du composant. Par défaut: true. */
    searchOnMount?: boolean;
    /** Affiche les facettes qui n'ont qu'une seule valeur. */
    showSingleValuedFacets?: boolean;
    /** Store associé. */
    store: SearchStore<T>;
    /** CSS du Summary. */
    summaryTheme?: SummaryStyle;
    /** CSS. */
    theme?: AdvancedSearchStyle;
    /** Utilise des ActionBar comme header de groupe, qui remplacent l'ActionBar générale. */
    useGroupActionBars?: boolean;
}

/** Composant tout intégré pour une recherche avancée, avec ActionBar, FacetBox, Summary, ListWrapper et Results. */
@observer
export class AdvancedSearch<T> extends React.Component<AdvancedSearchProps<T>> {

    componentWillMount() {
        const {searchOnMount = true, store} = this.props;
        if (searchOnMount) {
            store.search();
        }
    }

    protected renderFacetBox(theme: AdvancedSearchStyle) {
        const {facetBoxPosition = "left", facetBoxTheme, i18nPrefix, nbDefaultDataListFacet, showSingleValuedFacets, store} = this.props;

        if (facetBoxPosition === "left") {
            return (
                 <div className={theme.facetContainer}>
                    <FacetBox
                        i18nPrefix={i18nPrefix}
                        nbDefaultDataList={nbDefaultDataListFacet}
                        showSingleValuedFacets={showSingleValuedFacets}
                        store={store}
                        theme={facetBoxTheme}
                    />
                </div>
            );
        } else {
            return null;
        }
    }

    protected renderListSummary() {
        const {canRemoveSort, hideSummaryCriteria, hideSummaryFacets, hideSummaryGroup, hideSummarySort, i18nPrefix, orderableColumnList, store, summaryTheme} = this.props;
        return (
            <Summary
                canRemoveSort={canRemoveSort}
                i18nPrefix={i18nPrefix}
                hideCriteria={hideSummaryCriteria}
                hideFacets={hideSummaryFacets}
                hideGroup={hideSummaryGroup}
                hideSort={hideSummarySort}
                orderableColumnList={orderableColumnList}
                store={store}
                theme={summaryTheme}
            />
        );
    }

    protected renderActionBar() {
        const {actionBarTheme, facetBoxPosition = "left", hasGrouping, hasSearchBar, hasSelection, i18nPrefix, operationList, orderableColumnList, nbDefaultDataListFacet, showSingleValuedFacets, searchBarPlaceholder, store, useGroupActionBars} = this.props;

        if (store.groups.length && useGroupActionBars) {
            return null;
        }

        return (
            <ActionBar
                hasFacetBox={facetBoxPosition === "action-bar"}
                hasGrouping={hasGrouping}
                hasSearchBar={hasSearchBar}
                hasSelection={hasSelection}
                i18nPrefix={i18nPrefix}
                nbDefaultDataListFacet={nbDefaultDataListFacet}
                operationList={operationList}
                orderableColumnList={orderableColumnList}
                searchBarPlaceholder={searchBarPlaceholder}
                showSingleValuedFacets={showSingleValuedFacets}
                store={store}
                theme={actionBarTheme}
            />
        );
    }

    protected renderResults() {
        const {groupTheme, GroupHeader, listTheme, lineTheme, groupOperationList, groupPageSize, hasSelection, disableDragAnimThreshold, i18nPrefix, isManualFetch, itemKey, LineComponent, lineOperationList, listPageSize, MosaicComponent, offset, store, EmptyComponent, DetailComponent, detailHeight, canOpenDetail, hasDragAndDrop, dragItemType, dragLayerTheme, useGroupActionBars} = this.props;
        return (
            <Results
                canOpenDetail={canOpenDetail}
                detailHeight={detailHeight}
                DetailComponent={DetailComponent}
                disableDragAnimThreshold={disableDragAnimThreshold}
                dragItemType={dragItemType}
                dragLayerTheme={dragLayerTheme}
                EmptyComponent={EmptyComponent}
                GroupHeader={GroupHeader}
                groupOperationList={groupOperationList}
                groupPageSize={groupPageSize}
                groupTheme={groupTheme}
                hasDragAndDrop={hasDragAndDrop}
                hasSelection={!!hasSelection}
                i18nPrefix={i18nPrefix}
                isManualFetch={isManualFetch}
                itemKey={itemKey}
                LineComponent={LineComponent}
                lineOperationList={lineOperationList}
                lineTheme={lineTheme}
                listPageSize={listPageSize}
                listTheme={listTheme}
                MosaicComponent={MosaicComponent}
                offset={offset}
                store={store}
                useGroupActionBars={useGroupActionBars}
            />
        );
    }

    render() {
        const {addItemHandler, i18nPrefix, LineComponent, MosaicComponent, mode, mosaicHeight, mosaicWidth, hasBackToTop = true} = this.props;
        return (
            <Theme theme={this.props.theme}>
                {theme =>
                    <>
                        {this.renderFacetBox(theme)}
                        <div className={theme.resultContainer}>
                            <ListWrapper
                                addItemHandler={addItemHandler}
                                canChangeMode={!!(LineComponent && MosaicComponent)}
                                i18nPrefix={i18nPrefix}
                                mode={mode || MosaicComponent && !LineComponent ? "mosaic" : "list"}
                                mosaicHeight={mosaicHeight}
                                mosaicWidth={mosaicWidth}
                            >
                                {this.renderListSummary()}
                                {this.renderActionBar()}
                                {this.renderResults()}
                            </ListWrapper>
                        </div>
                        {hasBackToTop ? <ButtonBackToTop /> : null}
                    </>
                }
            </Theme>
        );
    }
}

/**
 * Crée un composant de recherche avancée.
 * @param props Les props de l'AdvancedSearch.
 */
export function advancedSearchFor<T>(props: AdvancedSearchProps<T>) {
    return <AdvancedSearch {...props} />;
}
