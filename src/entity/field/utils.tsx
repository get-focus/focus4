import i18next from "i18next";
import {upperFirst} from "lodash";
import {action} from "mobx";
import * as React from "react";

import {Select} from "../../components";
import {ReferenceList} from "../../reference";

import {EntityField, FieldEntry} from "../types";
import {Field, FieldOptions} from "./field";

/**
 * Crée un champ standard.
 * @param field La définition de champ.
 * @param options Les options du champ.
 */
export function fieldFor<T extends FieldEntry>(field: EntityField<T>, options: Partial<FieldOptions<T>> = {}
) {
    options.onChange = options.onChange || action(`on${upperFirst(field.$field.name)}Change`, (value: T["fieldType"]) => field.value = value);
    return <Field field={field} {...options} />;
}

export type Props<T> = T extends React.Component<infer P1> ? P1 : T extends (props: infer P2) => any ? P2 : never;

/**
 * Crée un champ avec résolution de référence.
 * @param field La définition de champ.
 * @param values La liste de référence.
 * @param options Les options du champ.
 */
export function selectFor<T extends FieldEntry, SComponent = typeof Select>(
    field: EntityField<T>,
    values: ReferenceList,
    options: Partial<FieldOptions<T, Props<SComponent>>> & {SelectComponent?: SComponent, selectProps?: Partial<Props<SComponent>>} = {}
) {
    options.SelectComponent = options.SelectComponent || Select as any;
    options.values = values;
    return fieldFor<T>(field, options as Partial<FieldOptions<T>>);
}

/**
 * Récupère le texte correspondant à un champ.
 * @param field La définition de champ.
 * @param values L'éventulle liste de référence associée.
 */
export function stringFor<T extends FieldEntry>(field: EntityField<T>, values: ReferenceList = [] as any) {
    const {value, $field: {domain: {displayFormatter = (t: string) => i18next.t(t)}}} = field;
    const {$valueKey = "code", $labelKey = "label"} = values;
    const found = values.find(val => (val as any)[$valueKey] === value);
    const processedValue = found && (found as any)[$labelKey] || value;
    return displayFormatter(processedValue);
}
