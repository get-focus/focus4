import {action, observable} from "mobx";
import * as React from "react";

import {PrimaryAction, SecondaryAction} from "../layout";

export interface ApplicationAction {
    /** Actions transverses. */
    actions?: {
        /** Actions principales, affichées directement. */
        primary?: PrimaryAction[];
        /** Actions secondaires, affichées dans une dropdown. */
        secondary?: SecondaryAction[];
    };
    /** Précise si le header peut se déployer ou non. */
    canDeploy?: boolean;
    /** Composant de header gauche. */
    barLeft?: React.ReactElement<any>;
    /** Composant de header droit. */
    barRight?: React.ReactElement<any>;
    /** Composant de cartridge, affiché en mode déployé. */
    cartridge?: React.ReactElement<any>;
    /** Composant de résumé, affiché en mode replié. */
    summary?: React.ReactElement<any>;
}

/** Store applicatif, regroupant des informations tranverses, et en particulier la gestion du header. */
export class ApplicationStore implements ApplicationAction {
    /** Actions transverses. */
    @observable
    actions: {
        /** Actions principales, affichées directement. */
        primary: PrimaryAction[];
        /** Actions secondaires, affichées dans une dropdown. */
        secondary: SecondaryAction[];
    } = {primary: [], secondary: []};
    /** Précise si le header peut se déployer ou non. */
    @observable canDeploy = true;

    /** Composant de header gauche. */
    @observable barLeft = <div />;
    /** Composant de header droit. */
    @observable barRight = <div />;
    /** Composant de cartridge, affiché en mode déployé. */
    @observable cartridge = <div />;
    /** Composant de résumé, affiché en mode replié. */
    @observable summary = <div />;

    /** Réinitialise tous les composants et les actions du header. */
    @action
    clearHeader() {
        this.cartridge = <div />;
        this.barLeft = <div />;
        this.summary = <div />;
        this.actions = {primary: [], secondary: []};
    }

    /**
     * Met à jour plusieurs composants de header.
     * @param action Etat du header.
     * @param isPartial Mise à jour partielle.
     */
    @action
    setHeader({cartridge, summary, actions, barLeft, canDeploy, barRight}: ApplicationAction, isPartial?: boolean) {
        if (!isPartial) {
            this.cartridge = cartridge || <div />;
            this.summary = summary || <div />;
            this.actions.primary = (actions && actions.primary) || [];
            this.actions.secondary = (actions && actions.secondary) || [];
            this.barLeft = barLeft || <div />;
            this.canDeploy = canDeploy === undefined ? true : canDeploy;
        } else {
            if (cartridge) {
                this.cartridge = cartridge;
            }
            if (summary) {
                this.summary = summary;
            }
            if (actions) {
                this.actions.primary = (actions && actions.primary) || [];
                this.actions.secondary = (actions && actions.secondary) || [];
            }
            if (barLeft) {
                this.barLeft = barLeft;
            }
            if (canDeploy) {
                this.canDeploy = canDeploy;
            }
        }

        if (barRight) {
            this.barRight = barRight;
        }
    }
}

/** Instance principale de l'ApplicationStore. */
export const applicationStore = new ApplicationStore();
