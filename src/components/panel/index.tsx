import i18next from "i18next";
import {snakeCase} from "lodash";
import {observable} from "mobx";
import {observer} from "mobx-react";
import * as PropTypes from "prop-types";
import * as React from "react";
import {themr} from "react-css-themr";
import {findDOMNode} from "react-dom";
import {ProgressBar} from "react-toolbox/lib/progress_bar";

import {ReactComponent} from "../../config";

import ButtonHelp from "../button-help";
import {PanelButtons, PanelButtonsProps} from "./buttons";
export {PanelButtons};

import * as styles from "../__style__/panel.css";

export type PanelStyle = Partial<typeof styles>;

/** Props du panel. */
export interface PanelProps extends PanelButtonsProps {
    /** Nom du bloc pour le bouton d'aide. Par défaut : premier mot du titre. */
    blockName?: string;
    /** Boutons à afficher dans le Panel. Par défaut : les boutons de formulaire (edit / save / cancel). */
    Buttons?: ReactComponent<PanelButtonsProps>;
    /** Position des boutons. Par défaut : "top". */
    buttonsPosition?: "both" | "bottom" | "top" | "none";
    /** Masque le panel dans le ScrollspyContainer. */
    hideOnScrollspy?: boolean;
    /** Masque la progress bar lors du chargement/sauvegarde. */
    hideProgressBar?: boolean;
    /** Affiche le bouton d'aide. */
    showHelp?: boolean;
    /** CSS. */
    theme?: PanelStyle;
    /** Titre du panel. */
    title?: string;
}

export interface PanelDescriptor {
    node: HTMLDivElement;
    title?: string;
}

/** Construit un Panel avec un titre et des actions. */
@observer
export class Panel extends React.Component<PanelProps> {

    private id!: string;
    @observable private isInForm = false;

    static contextTypes = {
        scrollspy: PropTypes.object
    };

    /** On récupère le contexte posé par le scrollspy parent. */
    context!: {
        scrollspy: {
            registerPanel(panel: PanelDescriptor): string;
            removePanel(id: string): void;
            updatePanel(id: string, panel: PanelDescriptor): void;
        }
    };

    /** On s'enregistre dans le scrollspy. */
    componentDidMount() {
        const {hideOnScrollspy, title} = this.props;
        if (this.context.scrollspy && !hideOnScrollspy) {
            this.id = this.context.scrollspy.registerPanel({title, node: findDOMNode(this) as HTMLDivElement});
        }

        // On essaie de savoir si ce panel est inclus dans un formulaire.
        let parentNode = findDOMNode(this) as HTMLElement | null;
        while (parentNode && parentNode.tagName !== "FORM") {
            parentNode = parentNode.parentElement;
        }
        if (parentNode) {
            this.isInForm = true;
        }
    }

    /** On se met à jour dans le scrollspy. */
    componentWillReceiveProps({hideOnScrollspy, title}: PanelProps) {
         if (this.context.scrollspy && !hideOnScrollspy && title !== this.props.title) {
            this.context.scrollspy.updatePanel(this.id, {title, node: findDOMNode(this) as HTMLDivElement});
        }
    }

    /** On se retire du scrollspy. */
    componentWillUnmount() {
        if (this.context.scrollspy && !this.props.hideOnScrollspy) {
            this.context.scrollspy.removePanel(this.id);
        }
    }

    render() {
        const {blockName, Buttons = PanelButtons, buttonsPosition = "top", children, i18nPrefix, loading, title, showHelp, editing, toggleEdit, save, hideProgressBar, theme} = this.props;

        const buttons = (
            <div className={theme!.actions}>
                <Buttons editing={editing} i18nPrefix={i18nPrefix} loading={loading} save={!this.isInForm ? save : undefined} toggleEdit={toggleEdit} />
            </div>
        );

        const areButtonsTop = ["top", "both"].find(i => i === buttonsPosition);
        const areButtonsDown = ["bottom", "both"].find(i => i === buttonsPosition);

        return (
            <div className={`${theme!.panel} ${loading ? theme!.busy : ""} ${editing ? theme!.edit : ""}`}>
                {!hideProgressBar && loading ? <ProgressBar mode="indeterminate" theme={{indeterminate: theme!.progress}} /> : null}
                {title || areButtonsTop ?
                    <div className={`${theme!.title} ${theme!.top}`}>
                        {title ?
                            <h3>
                                <span data-spy-title>{i18next.t(title)}</span>
                                {showHelp ?
                                    <ButtonHelp
                                        blockName={blockName || snakeCase(i18next.t(title))
                                            .split("_")[0]}
                                        i18nPrefix={i18nPrefix}
                                    />
                                : null}
                            </h3>
                        : null}
                        {areButtonsTop ? buttons : null}
                    </div>
                : null}
                <div className={theme!.content}>
                    {children}
                </div>
                {areButtonsDown ?
                    <div className={`${theme!.title} ${theme!.bottom}`}>
                        {buttons}
                    </div>
                : null}
            </div>
        );
    }
}

export default themr("panel", styles)(Panel);
