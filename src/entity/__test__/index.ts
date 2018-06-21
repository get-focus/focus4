/* tslint:disable */
import "ignore-styles";

import {isObservableArray} from "mobx";
import test = require("tape");

import {makeFormNode} from "../form/node";
import {makeEntityStore, toFlatValues} from "../store";
import {LigneEntity} from "./ligne";
import {OperationEntity} from "./operation";
import {ProjetEntity} from "./projet";
import {StructureEntity} from "./structure";

function getStore() {
    const subStore = makeEntityStore({
        structure: StructureEntity,
        operationList: [OperationEntity]
    });

    return makeEntityStore({
        operation: OperationEntity,
        projetTest: ProjetEntity,
        structureList: [StructureEntity],
        subStore
    });
}

const operation = {
    id: 4,
    numero: "A324",
    montant: 400.32,
    structure: {
        id: 5,
        nom: "Test",
        siret: "324123456"
    }
};
const structureList = [{id: 5}, {id: 6}, {id: 7}];
const projetTest = {ligneList: [{id: 5}, {id: 6}, {id: 7}]};

test("EntityStore: Création", t => {
    const store = getStore();

    const {id, numero, montant} = OperationEntity.fields;
    t.deepEqual(
        store.operation,
        {
            id: {$field: id, value: undefined},
            numero: {$field: numero, value: undefined},
            montant: {$field: montant, value: undefined},
            structure: {
                id: {$field: StructureEntity.fields.id, value: undefined},
                nom: {$field: StructureEntity.fields.nom, value: undefined},
                siret: {$field: StructureEntity.fields.siret, value: undefined},
                set: store.operation.structure.set,
                clear: store.operation.structure.clear,
                replace: store.operation.structure.replace
            },
            set: store.operation.set,
            clear: store.operation.clear,
            replace: store.operation.replace
        },
        "L'entrée 'operation' a bien la forme attendue"
    );

    t.assert(isObservableArray(store.structureList), "L'entrée 'structureList' est bien un array");
    t.deepEqual(store.structureList.$entity, StructureEntity, "L'entrée 'structureList' possède bien la bonne entité");

    t.assert(isObservableArray(store.projetTest.ligneList), "'ligneList' de l'entrée 'projet' est bien un array");
    t.deepEqual(
        store.projetTest.ligneList.$entity,
        LigneEntity,
        "'ligneList' de l'entrée 'projet' possède bien la bonne entité"
    );

    t.equal(store.subStore.structure.id.$field, StructureEntity.fields.id, "Le sous-store est bien accessible");

    t.end();
});

test("EntityStore: Replace global", t => {
    const store = getStore();

    store.replace({operation});
    t.equal(
        store.operation.id.value,
        operation.id,
        "La propriété 'id' de l'entrée 'operation' a bien été enregistrée."
    );
    t.equal(
        store.operation.structure.id.value,
        operation.structure.id,
        "La propriété 'structure.id' de l'entrée 'operation' a bien été enregistrée."
    );

    store.replace({structureList});
    t.assert(store.structureList[2], "La liste 'structureList' a bien été enregistrée.");
    t.equal(
        store.structureList[1].id.value,
        structureList[1].id,
        "Le deuxième élément de 'structureList' a bien été enregistré."
    );

    store.replace({projetTest});
    t.assert(store.projetTest.ligneList[2], "La liste 'projet.ligneList' a bien été enresgitrée.");
    t.equal(
        store.projetTest.ligneList[1].id.value,
        projetTest.ligneList[1].id,
        "Le deuxième élément de 'projet.ligneList' a bien été enregistré."
    );

    store.replace({subStore: {operationList: [operation], structure: structureList[0]}});
    t.assert(store.subStore.structure.id.value, "Le noeud 'structure' du sous-store a bien été enregistré.");
    t.assert(store.subStore.operationList[0].id, "Le liste 'operationList' du sous-store a bien été enregistrée.");
    t.equal(
        store.subStore.operationList[0].id.value,
        operation.id,
        "La liste `operationList` possède bien les bonnes valeurs."
    );
    t.end();
});

test("EntityStore: Replace locaux", t => {
    let store = getStore();

    store.operation.replace(operation);
    t.equal(
        store.operation.id.value,
        operation.id,
        "La propriété 'id' de l'entrée 'operation' a bien été enregistrée."
    );
    t.equal(
        store.operation.structure.id.value,
        operation.structure.id,
        "La propriété 'structure.id' de l'entrée 'operation' a bien été enregistrée (set operation)."
    );

    store = getStore();
    store.operation.structure.replace(operation.structure);
    t.equal(
        store.operation.structure.id.value,
        operation.structure.id,
        "La propriété 'structure.id' de l'entrée 'operation' a bien été enregistrée (set structure)"
    );

    store.structureList.replaceNodes(structureList);
    t.assert(store.structureList[2], "La liste 'structureList' a bien été enregistrée.");
    t.equal(
        store.structureList[1].id.value,
        structureList[1].id,
        "Le deuxième élément de 'structureList' a bien été enregistré."
    );

    store.projetTest.replace(projetTest);
    t.assert(store.projetTest.ligneList[2], "La liste 'projet.ligneList' a bien été enregistrée.");
    t.equal(
        store.projetTest.ligneList[1].id.value,
        projetTest.ligneList[1].id,
        "Le deuxième élément de 'projet.ligneList' a bien été enregistré."
    );

    t.end();
});

test("EntityStore: Ajout élément dans une liste", t => {
    const store = getStore();

    store.structureList.replaceNodes(structureList);
    store.structureList.pushNode({id: 8});
    t.assert(store.structureList.length === 4, "La liste 'structureList' possède bien un élément de plus.");
    t.deepEqual(
        store.structureList[3].id.$field,
        StructureEntity.fields.id,
        "L'élément ajouté est bien un node avec les bonnes métadonnées."
    );
    t.equal(store.structureList[3].id.value, 8, "L'élement ajouté possède bien les valeurs attendues");

    t.end();
});

test("EntityStore: Set global", t => {
    const store = getStore();

    store.replace({operation});
    t.equal(
        store.operation.id.value,
        operation.id,
        "La propriété 'id' de l'entrée 'operation' a bien été enregistrée."
    );
    t.equal(
        store.operation.structure.id.value,
        operation.structure.id,
        "La propriété 'structure.id' de l'entrée 'operation' a bien été enregistrée."
    );

    store.set({subStore: {structure: structureList[0]}});
    t.assert(store.subStore.structure.id.value, "Le noeud 'structure' du sous-store a bien été enregistré.");

    store.structureList.pushNode({id: 1}, {id: 2});
    store.set({structureList: [{siret: "test"}, {id: 4}, {id: 5}, {id: 6}]});
    t.equal(store.structureList[0].id.value, 1, "La propriété 'structure[0].id' n'a pas été modifiée.");
    t.equal(store.structureList[1].id.value, 4, "La propriété 'structure[1].id' a bien été modifiée.");
    t.equal(store.structureList[0].siret.value, "test", "La propriété 'structure[0].siret' a bien été renseignée.");
    t.equal(store.structureList[2].id.value, 5, "Un item supplémentaire dans la liste a bien été créé.");
    t.equal(store.structureList[3].id.value, 6, "Un deuxième item supplémentaire dans la liste a bien été créé.");

    t.end();
});

test("EntityStore: Clear global", t => {
    const store = getStore();
    store.replace({
        operation,
        structureList,
        projetTest,
        subStore: {operationList: [operation], structure: structureList[0]}
    });

    store.clear();
    t.equal(store.operation.id.value, undefined, "La propriété 'id' de l'entrée 'operation' est bien undefined.");
    t.equal(
        store.operation.structure.id.value,
        undefined,
        "La propriété 'structure.id' de l'entrée 'operation' est bien undefined."
    );
    t.assert(store.structureList.length === 0, "La liste 'structureList' est bien vide.");
    t.assert(store.projetTest.ligneList.length === 0, "La liste 'projet.ligneList' est bien vide.");
    t.equal(
        store.subStore.structure.id.value,
        undefined,
        "La propriété 'id' de l'entrée 'structure' du sous-store est bien undefined."
    );
    t.assert(store.subStore.operationList.length === 0, "La liste 'operationList' du sous store est bien vide.");

    t.end();
});

test("EntityStore: Clear locaux", t => {
    const store = getStore();

    store.operation.clear();
    t.equal(store.operation.id.value, undefined, "La propriété 'id' de l'entrée 'operation' est bien undefined.");
    t.equal(
        store.operation.structure.id.value,
        undefined,
        "La propriété 'structure.id' de l'entrée 'operation' est bien undefined."
    );

    store.structureList.clear();
    t.assert(store.structureList.length === 0, "La liste 'structureList' est bien vide.");

    store.projetTest.ligneList.clear();
    t.assert(store.projetTest.ligneList.length === 0, "La liste 'projet.ligneList' est bien vide.");

    t.end();
});

test("toFlatValues", t => {
    const store = getStore();
    store.replace({operation, projetTest, structureList});

    t.deepEqual(toFlatValues(store.operation), operation, "L'entrée 'operation' a bien été mise à plat.");
    t.deepEqual(toFlatValues(store.projetTest), projetTest, "L'entrée 'projet' a bien été mise à plat.");
    t.deepEqual(toFlatValues(store.structureList), structureList, "L'entrée 'structureList' a bien été mise à plat.");

    t.end();
});

test("FormNode: Création", t => {
    const entry = getStore().operation;
    const formNode = makeFormNode(entry);

    const entry2 = getStore().projetTest;
    const formNode2 = makeFormNode(entry2);

    t.deepEqual(
        formNode.numero.$field,
        entry.numero.$field,
        "Les champs simples du FormNode sont bien identiques à ceux du StoreNode."
    );
    t.deepEqual(
        toFlatValues(formNode.structure),
        toFlatValues(entry.structure),
        "Les champs composites du FormNode sont bien identiques à ceux du StoreNode."
    );
    t.assert(isObservableArray(formNode2.ligneList), "Une sous liste est bien toujours observable");
    t.deepEqual(
        formNode2.ligneList.$entity,
        entry2.ligneList.$entity,
        "Une sous liste a bien toujours son entité attachée."
    );
    t.assert(formNode2.ligneList.set, "Une sous liste a bien toujours sa méthode 'set' attachée");
    t.deepEqual(entry, formNode.sourceNode, "Le sourceNode racine est bien le bon.");
    t.deepEqual(entry.structure, formNode.structure.sourceNode, "Le sous-sourceNode simple est bien le bon");
    t.deepEqual(entry2.ligneList, formNode2.ligneList.sourceNode, "Le sous-sourceNode liste est bien le bon");

    t.comment("FormNode: Modification de StoreNode.");
    entry.replace(operation);
    entry2.replace(projetTest);

    t.equal(
        formNode.id.value,
        entry.id.value,
        "Les modifications du StoreNode sont bien répercutées sur les champs simples."
    );
    t.deepEqual(
        toFlatValues(formNode.structure),
        toFlatValues(entry.structure),
        "Les modifications du StoreNode sont bien répercutées sur les champs composites."
    );
    t.deepEqual(
        toFlatValues(formNode2),
        toFlatValues(entry2),
        "Les modifications du StoreNode sont bien répercutées sur les champs avec des listes."
    );
    t.deepEqual(
        entry2.ligneList[0],
        formNode2.ligneList[0].sourceNode,
        "Le sourceNode d'un objet de liste est bien le bon."
    );

    t.comment("FormNode: Modification de FormNode");
    formNode.montant.value = 1000;
    formNode.set({structure: {id: 26}});
    formNode.structure.set({nom: "yolo"});

    t.equal(formNode.montant.value, 1000, "Champ simple: le FormNode a bien été modifié.");
    t.equal(entry.montant.value, operation.montant, "Champ simple: le StoreNode est bien toujours identique.");
    t.equal(formNode.structure.id.value, 26, "Champ composite via set global: le FormNode a bien été modifié.");
    t.equal(
        entry.structure.id.value,
        operation.structure.id,
        "Champ composite via set global: le StoreNode est bien toujours identique."
    );
    t.equal(formNode.structure.nom.value, "yolo", "Champ composite via set local: le FormNode a bien été modifié.");
    t.equal(
        entry.structure.nom.value,
        operation.structure.nom,
        "Champ composite via set local: le StoreNode est bien toujours identique."
    );

    t.comment("FormNode: StoreNode.set(toFlatValues(FormNode))");
    entry.replace(toFlatValues(formNode));

    t.equal(entry.montant.value, 1000, "Champ simple: le StoreNode a bien été mis à jour.");
    t.equal(entry.structure.id.value, 26, "Champ composite via set global: le StoreNode a bien été mis à jour.");
    t.equal(entry.structure.nom.value, "yolo", "Champ composite via set local: le StoreNode a bien été mis à jour.");

    t.comment("FormNode: reset global");
    formNode.set({montant: 3000, structure: {id: 23, nom: "LOL"}});
    formNode.reset();

    t.equal(formNode.montant.value, 1000, "Champ simple: le FormNode a bien été réinitialisé.");
    t.equal(formNode.structure.id.value, 26, "Champ composite: le FormNode a bien été réinitialisé.");

    t.comment("FormNode: reset local (noeud simple)");
    formNode.set({montant: 3000, structure: {id: 23}});
    formNode.structure.reset();

    t.equal(formNode.montant.value, 3000, "Champ non concerné pas le reset : n'a pas été touché.");
    t.equal(formNode.structure.id.value, 26, "Champ concerné par le reset : a été réinitialisé.");

    t.comment("FormNode: reset de liste");
    formNode2.ligneList[0].id.value = 23;
    formNode2.ligneList.remove(formNode2.ligneList[2]);
    formNode2.ligneList.reset();

    t.equal(formNode2.ligneList[0].id.value, 5, "Champ modifié d'un item : a été réinitialisé.");
    t.equal(formNode2.ligneList[2].id.value, entry2.ligneList[2].id.value, "Item retiré : a été réajouté");

    t.comment("FormNode: reset d'un item de liste");
    formNode2.ligneList[0].id.value = 23;
    formNode2.ligneList[0].reset();

    t.equal(formNode2.ligneList[0].id.value, 5, "Champ modifié de l'item : a été réinitialisé.");

    t.comment("FormNode: stopSync");
    formNode.stopSync();
    entry.montant.value = 2;

    t.equal(formNode.montant.value, 3000, "Le FormNode n'a pas été mis à jour.");

    t.end();
});
