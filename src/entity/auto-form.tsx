import {autobind} from "core-decorators";
import {action, Lambda, observable, reaction, runInAction} from "mobx";
import * as React from "react";

import {PanelProps} from "../components";
import {messageStore} from "../message";

import {Form, makeFormNode, ServiceConfig} from "./form";
import {toFlatValues} from "./store";
import {FormNode, StoreNode} from "./types";

/** Options additionnelles de l'AutoForm. */
export interface AutoFormOptions<E> {
    /** Pour ajouter une classe particulière sur le formulaire. */
    className?: string;
    /** ViewModel externe de `storeData`, s'il y a besoin d'externaliser le state interne du formulaire. */
    entity?: E & FormNode;
    /** Par défaut: true */
    hasForm?: boolean;
    /** Préfixe i18n pour les messages du formulaire (par défaut: "focus") */
    i18nPrefix?: string;
    /** Par défaut: false */
    initiallyEditing?: boolean;
}

/** Classe de base pour un créer un composant avec un formulaire. A n'utiliser QUE pour des formulaires (avec de la sauvegarde). */
@autobind
export abstract class AutoForm<P, E extends StoreNode> extends React.Component<P, void> {

    /** Etat courant du formulaire, copié depuis `storeData`. Sera réinitialisé à chaque modification de ce dernier. */
    entity!: E & FormNode;
    /** Contexte du formulaire, pour forcer l'affichage des erreurs aux Fields enfants. */
    readonly formContext: {forceErrorDisplay: boolean} = observable({forceErrorDisplay: false});
    /** Services. */
    services!: ServiceConfig;

    /** Formulaire en chargement. */
    @observable isLoading = false;

    /** Classe CSS additionnelle (passée en options). */
    private className!: string;
    /** Insère ou non un formulaire HTML. */
    private hasForm!: boolean;
    /** Préfixe i18n pour les messages du formulaire */
    private i18nPrefix!: string;
    /** Disposer de la réaction de chargement. */
    private loadDisposer?: Lambda;

    /**
     * A implémenter pour initialiser le formulaire. Il faut appeler `this.formInit` à l'intérieur.
     *
     * Sera appelé pendant `componentWillMount` avant le chargement.
     */
    abstract init(): void;

    /**
     * Initialise le formulaire.
     * @param storeData L'EntityStoreData de base du formulaire.
     * @param services La config de services pour le formulaire ({delete?, getLoadParams, load, save}).
     * @param options Options additionnelles.
     */
    formInit(storeData: E, services: ServiceConfig, {className, hasForm, i18nPrefix, entity, initiallyEditing}: AutoFormOptions<E> = {}) {
        this.entity = entity || makeFormNode(storeData, undefined, initiallyEditing);
        this.services = services;
        this.hasForm = hasForm !== undefined ? hasForm : true;
        this.className = className || "";
        this.i18nPrefix = i18nPrefix || "focus";

        // On met en place la réaction de chargement.
        if (services.getLoadParams) {
            this.loadDisposer = reaction(services.getLoadParams, this.load, {compareStructural: true});
        }
    }

    get isEdit() {
        return this.entity.form.isEdit;
    }

    set isEdit(edit) {
        this.entity.form.isEdit = edit;
    }

    componentWillMount() {
        this.init();
    }

    clean() {
        this.entity.unsubscribe();
        if (this.loadDisposer) {
            this.loadDisposer();
        }
    }

    /** Change le mode du formulaire. */
    @action
    toggleEdit(isEdit: boolean) {
        this.isEdit = isEdit;
        if (!isEdit) {
            this.entity.reset();
        }
    }

    /** Appelle le service de chargement (appelé par la réaction de chargement). */
    @action
    async load() {
        const {getLoadParams, load} = this.services;

        // On n'effectue le chargement que si on a un service de chargement et des paramètres pour le service.
        if (getLoadParams && load) {
            const params = getLoadParams();
            if (params) {
                this.isLoading = true;
                this.entity.sourceNode.clear();
                const data = await load(...params);
                runInAction("afterLoad", () => {
                    this.entity.sourceNode.set(data);
                    this.isLoading = false;
                });
                this.onFormLoaded();
            }
        }
    }

    /** Appelle le service de sauvegarde. */
    @action
    async save() {
        // On force l'affichage des erreurs.
        this.formContext.forceErrorDisplay =  true;

        // On ne sauvegarde que si la validation est en succès.
        if (this.validate()) {
            this.isLoading = true;
            try {
                const data = await this.services.save(toFlatValues(this.entity));
                runInAction("afterSave", () => {
                    this.isLoading = false;
                    this.entity.form.isEdit = false;
                    this.entity.sourceNode.set(data); // En sauvegardant le retour du serveur dans le noeud de store, l'état du formulaire va se réinitialiser.
                });
                this.onFormSaved();
            } catch (e) {
                this.isLoading = false;
            }
        }
    }

    @action
    validate() {
        return this.entity.form.isValid;
    }

    /** Est appelé après le chargement. */
    onFormLoaded() {
        // A éventuellement surcharger.
    }

    /** Est appelé après la sauvegarde. */
    onFormSaved() {
        messageStore.addSuccessMessage(`${this.i18nPrefix}.detail.saved`);
    }

    /** Récupère les props à fournir à un Panel pour relier ses boutons au formulaire. */
    getPanelProps(): PanelProps {
        return {
            editing: this.isEdit,
            loading: this.isLoading,
            save: this.hasForm ? undefined : this.save,
            toggleEdit: this.toggleEdit,
        };
    }

    /** Fonction de rendu du formulaire à préciser. */
    abstract renderContent(): React.ReactElement<any> | null;
    render() {
        return (
            <Form
                clean={this.clean}
                formContext={this.formContext}
                hasForm={this.hasForm}
                load={this.load}
                save={this.save}
                theme={{form: this.className}}
            >
                {this.renderContent()}
            </Form>
        );
    }
}

export default AutoForm;
