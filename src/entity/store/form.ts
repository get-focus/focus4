import {isBoolean, isFunction, values} from "lodash";
import {action, extendObservable, observable} from "mobx";

import {
    Entity,
    EntityField,
    FormEntityField,
    FormListNode,
    FormNode,
    isAnyFormNode,
    isAnyStoreNode,
    isEntityField,
    isFormListNode,
    isFormNode,
    StoreListNode,
    StoreNode
} from "../types";
import {validateField} from "../validation";
import {replaceNode} from "./store";

/**
 * Transforme un Store(List)Node en Form(List)Node.
 * @param node Le FormNode en cours de création.
 * @param sourceNode Le node origine du FormNode.
 * @param parentNodeOrEditing Node parent, (l'état initial ou la condition) d'édition.
 */
export function nodeToFormNode<T extends Entity = any, U = {}>(
    node: StoreNode<T> & U | StoreListNode<T, U>,
    sourceNode: StoreNode<T> | StoreListNode<T>,
    parentNodeOrEditing: FormNode | FormListNode | boolean | (() => boolean)
) {
    const {$tempEdit} = node;
    if ($tempEdit) {
        delete node.$tempEdit;
    }

    (node as any).form = observable({
        _isEdit:
            (isBoolean(parentNodeOrEditing) ? parentNodeOrEditing : true) && (isBoolean($tempEdit) ? $tempEdit : true),
        get isEdit() {
            return (
                this._isEdit &&
                (isAnyFormNode(parentNodeOrEditing) ? parentNodeOrEditing.form.isEdit : true) &&
                (isFunction(parentNodeOrEditing) ? parentNodeOrEditing() : true) &&
                (isFunction($tempEdit) ? $tempEdit() : true)
            );
        },
        set isEdit(edit) {
            this._isEdit = edit;
        }
    });

    if (isFormListNode(node)) {
        node.forEach((item, i) => nodeToFormNode<any>(item, (sourceNode as StoreListNode)[i], node));
        extendObservable(node.form, {
            get isValid() {
                return isFormListNode(node) && node.every(item => item.form.isValid);
            }
        });
    } else if (isFormNode(node)) {
        for (const entry in node) {
            const child: {} = (node as any)[entry];
            if (isEntityField(child)) {
                addFormFieldProperties(child, node);
            } else if (isAnyStoreNode(child)) {
                nodeToFormNode(
                    child,
                    (sourceNode as any)[entry],
                    isBoolean(parentNodeOrEditing) ? node : parentNodeOrEditing
                );
            }
        }
        extendObservable(node.form, {
            get isValid() {
                return (
                    isFormNode(node) &&
                    (!node.form.isEdit ||
                        values(node).every(item => {
                            if (isEntityField(item)) {
                                return !(item as FormEntityField).isEdit || !(item as FormEntityField).error;
                            } else if (isAnyFormNode(item)) {
                                return item.form.isValid;
                            } else {
                                return true;
                            }
                        }))
                );
            }
        });
    }

    if (isAnyFormNode(node)) {
        node.reset = action("formNode.reset", () => {
            node.clear();
            replaceNode(node as any, sourceNode as any);
        });
        (node as any).sourceNode = sourceNode as any;
    }
}

/**
 * Ajoute une condition d'édition à un StoreNode (dans un FormNode).
 * @param node Le noeud de store.
 * @param isEdit L'état initial ou la condition d'édition.
 */
export function patchNodeEdit(node: StoreNode, isEdit: boolean | (() => boolean)) {
    node.$tempEdit = isEdit;
}

/** Ajoute les champs erreurs et d'édition sur un EntityField. */
function addFormFieldProperties(field: EntityField, parentNode: FormNode) {
    const {isEdit} = field as FormEntityField;
    delete (field as FormEntityField).isEdit;
    extendObservable(field, {
        _isEdit: isBoolean(isEdit) ? isEdit : true,
        get error() {
            return validateField(field);
        },
        get isEdit() {
            return this._isEdit && parentNode.form.isEdit && (isFunction(isEdit) ? isEdit() : true);
        },
        set isEdit(edit) {
            this._isEdit = edit;
        }
    });
}
