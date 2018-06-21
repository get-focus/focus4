import {autobind} from "core-decorators";
import i18next from "i18next";
import {computed, observable} from "mobx";
import {observer} from "mobx-react";
import * as React from "react";
import {themeable, themr} from "react-css-themr";

import {DisplayProps, InputProps, Label, LabelProps} from "../components";
import {ReactComponent} from "../config";

import {Domain} from "./types";
import {validate} from "./validation";

import * as styles from "./__style__/field.css";

export type FieldStyle = Partial<typeof styles>;

export type RefValues<T, ValueKey extends string, LabelKey extends string> = {[P in ValueKey]: T} & {[P in LabelKey]: string};

/** Options pour gérer une liste de référence. */
export interface ReferenceOptions<
    T,
    R extends RefValues<T, ValueKey, LabelKey>,
    ValueKey extends string,
    LabelKey extends string
> {
    /** Nom de la propriété de libellé. Doit être casté en lui-même (ex: `{labelKey: "label" as "label"}`). Par défaut: "label". */
    labelKey?: LabelKey;
    /** Nom de la propriété de valeur. Doit être casté en lui-même (ex: `{valueKey: "code" as "code"}`). Par défaut: "code". */
    valueKey?: ValueKey;
    /** Liste des valeurs de la liste de référence. Doit contenir les propriétés `valueKey` et `labelKey`. */
    values?: R[];
}

/** Options pour un champ défini à partir de `fieldFor` et consorts. */
export interface FieldOptions<
    T,
    ICProps extends {theme?: {}} = InputProps,
    DCProps extends {theme?: {}} = DisplayProps,
    LCProps = LabelProps,
    R extends RefValues<T, ValueKey, LabelKey> = any,
    ValueKey extends string = "code",
    LabelKey extends string = "label"
> extends ReferenceOptions<T, R, ValueKey, LabelKey> {
    /** Désactive le style inline qui spécifie la largeur du label et de la valeur.  */
    disableInlineSizing?: boolean;
    /** Surcharge l'erreur du field. */
    error?: string | null;
    /** Force l'affichage de l'erreur, même si le champ n'a pas encore été modifié. */
    forceErrorDisplay?: boolean;
    /** Service de résolution de code. */
    keyResolver?: (key: number | string) => Promise<string>;
    /** Affiche le label. */
    hasLabel?: boolean;
    /** Pour l'icône de la Tooltip. Par défaut : "focus". */
    i18nPrefix?: string;
    /** A utiliser à la place de `ref`. */
    innerRef?: (i: Field<T, ICProps, DCProps, LCProps, R, ValueKey, LabelKey>) => void;
    /** Champ en édition. */
    isEdit?: boolean;
    /** Par défaut : "top". */
    labelCellPosition?: string;
    /** Largeur en % du label. Par défaut : 33. */
    labelRatio?: number;
    /** Handler de modification de la valeur. */
    onChange?: (value: T) => void;
    /** Affiche la tooltip. */
    showTooltip?: boolean;
    /** CSS. */
    theme?: FieldStyle & {display?: DCProps["theme"], input?: ICProps["theme"]};
    /** Largeur en % de la valeur. Par défaut : 100 - `labelRatio`. */
    valueRatio?: number;
}

/** Props pour le Field, se base sur le contenu d'un domaine (éventuellement patché) et des options de champ. */
export interface FieldProps<T, ICProps = InputProps, DCProps = DisplayProps, LCProps = LabelProps, R extends RefValues<T, ValueKey, LabelKey> = any, ValueKey extends string = "code", LabelKey extends string = "label">
    extends
        Domain<ICProps, DCProps, LCProps>,
        FieldOptions<T, ICProps, DCProps, LCProps, R, ValueKey, LabelKey> {
    /** Commentaire sur le champ. */
    comment?: string;
    /** Composant pour l'affichage. */
    DisplayComponent: ReactComponent<DCProps>;
    /** Formatteur pour l'affichage du champ en consulation. */
    displayFormatter: (value: T) => string;
    /** Composant pour l'entrée utilisateur. */
    InputComponent: ReactComponent<ICProps>;
    /** Formatteur pour l'affichage du champ en édition. */
    inputFormatter: (value: T) => string;
    /** Champ requis. */
    isRequired?: boolean;
    /** Libellé du champ. */
    label?: string;
    /** Composant pour le libellé. */
    LabelComponent: ReactComponent<LCProps>;
    /** Nom du champ. */
    name: string;
    /** Formatteur inverse pour convertir l'affichage du champ en la valeur (édition uniquement) */
    unformatter: (text: string) => T;
    /** Valeur. */
    value: T;
}

/** Composant de champ, gérant des composants de libellé, d'affichage et/ou d'entrée utilisateur. */
@autobind
@observer
export class Field<
    T,
    ICProps extends InputProps,
    DCProps extends DisplayProps,
    LCProps extends LabelProps,
    R extends RefValues<T, VK, LK> ,
    VK extends string,
    LK extends string
> extends React.Component<FieldProps<T, ICProps, DCProps, LCProps, R, VK, LK>, void> {

    /** Affiche l'erreur du champ. Initialisé à `false` pour ne pas afficher l'erreur dès l'initilisation du champ avant la moindre saisie utilisateur. */
    @observable showError = this.props.forceErrorDisplay || false;

    componentWillUpdate({value}: FieldProps<T, ICProps, DCProps, LCProps, R, VK, LK>) {
        // On affiche l'erreur dès que et à chaque fois que l'utilisateur modifie la valeur (et à priori pas avant).
        if (value) {
            this.showError = true;
        }
    }

    /** Récupère l'erreur associée au champ. Si la valeur vaut `undefined`, alors il n'y en a pas. */
    @computed
    get error(): string | undefined {
        const {error, value} = this.props;

        // On priorise l'éventuelle erreur passée en props.
        if (error !== undefined) {
            return error || undefined;
        }

        // On vérifie que le champ n'est pas vide et obligatoire.
        const {isRequired, validator, label = ""} = this.props;
        if (isRequired && (value as any) !== 0 && !value) {
            return i18next.t("focus.validation.required");
        }

        // On applique le validateur du domaine.
        if (validator && value !== undefined && value !== null) {
            const validStat = validate({value, name: i18next.t(label)}, validator);
            if (validStat.errors.length) {
                return i18next.t(validStat.errors.join(", "));
            }
        }

        // Pas d'erreur.
        return undefined;
    }

    /** Appelé lors d'un changement sur l'input. */
    onChange(value: any) {
        const {onChange, unformatter} = this.props;
        if (onChange) {
            (onChange as any)(unformatter && unformatter(value) || value);
        }
    }

    /** Affiche le composant d'affichage (`DisplayComponent`). */
    display() {
        const {valueKey = "code", labelKey = "label", values, value, keyResolver, displayFormatter, DisplayComponent, displayProps = {}, theme} = this.props;
        return (
            <DisplayComponent
                {...displayProps as {}}
                formatter={displayFormatter}
                keyResolver={keyResolver}
                labelKey={labelKey}
                theme={themeable(displayProps.theme || {} as any, theme!.display as any)}
                value={value as any}
                valueKey={valueKey}
                values={values}
            />
        );
    }

    /** Affiche le composant d'entrée utilisateur (`InputComponent`). */
    input() {
        const {InputComponent, inputFormatter, value, valueKey = "code", labelKey = "label", values, keyResolver, inputProps = {}, name, theme} = this.props;

        let props: any = {
            ...inputProps as {},
            value: inputFormatter(value),
            error: this.showError && this.error || undefined,
            name,
            id: name,
            onChange: this.onChange,
            theme: themeable(inputProps.theme || {} as any, theme!.input as any)
        };

        if (values) {
            props = {...props, values, labelKey, valueKey};
        }

        if (keyResolver) {
            props = {...props, keyResolver};
        }

        return <InputComponent {...props} />;
    }

    render() {
        const {comment, disableInlineSizing, i18nPrefix, label, LabelComponent, name, showTooltip, hasLabel = true,  labelRatio = 33, isRequired, isEdit, theme, className = ""} = this.props;
        const {valueRatio = 100 - (hasLabel ? labelRatio : 0)} = this.props;
        const FinalLabel = LabelComponent || Label;
        return (
            <div className={`${theme!.field} ${isEdit ? theme!.edit : ""} ${this.error && this.showError ? theme!.invalid : ""} ${isRequired ? theme!.required : ""} ${className}`}>
                {hasLabel ?
                    <FinalLabel
                        comment={comment}
                        i18nPrefix={i18nPrefix}
                        label={label}
                        name={name}
                        showTooltip={showTooltip}
                        style={!disableInlineSizing ? {width: `${labelRatio}%`} : {}}
                        theme={{label: theme!.label}}
                    />
                : null}
                <div style={!disableInlineSizing ? {width: `${valueRatio}%`} : {}} className ={`${theme!.value} ${className}`}>
                    {isEdit ? this.input() : this.display()}
                </div>
            </div>
        );
    }
}

export default themr("field", styles)(Field);
