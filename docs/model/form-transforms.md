# Transformations de noeuds et champs pour un formulaire

Un noeud de formulaire n'est pas contraint d'être une simple copie conforme du noeud initial. Il est très souvent nécessaire d'adapter, plus ou moins finement, le noeud qui va être créer, pour par exemple :

-   Définir un état d'édition initial
-   Désactiver l'édition sur un ou plusieurs champs
-   Rendre certains champs obligatoires (ou non)
-   Implémenter des validateurs supplémentaires
-   Modifier des métadonnées comme un libellé ou un composant d'affichage/saisie
-   Rendre n'importe lequel de ces exemples dépendant de la valeur d'un champ en particulier
-   ...

Les cas d'usages sont très nombreux, et puisqu'on a choisi de faire porter les états d'éditions et la validation sur le noeud de formulaire (au lieu d'un composant externe), il va falloir pouvoir effectuer des **transformations** lors de la construction du formulaire.

Si on crée un noeud de formulaire avec un `Form(List)NodeBuilder`, il y a bien une raison. Leurs APIs sont les suivantes :

## `FormNodeBuilder`

Il permet de construire un FormNode à partir d'un StoreNode. Il sera le paramètre de toute fonction de configuration sur un FormNode (celle de `makeFormNode`, ou de `patch` et `items` qu'on vera plus bas).

Il dispose des méthodes suivantes :

### `edit(value)`

La fonction `edit`, qui prend en paramètre soit un booléen, soit une fonction retournant un booléen, permet de modifier l'état d'édition initial (si booléen), ou bien de forcer l'état d'édition (si fonction). Si `edit` n'est pas renseigné, la valeur par défaut pour un noeud sera `false` pour le noeud racine et `true` pour tout le reste.

### `edit(value, ...props)`

Il est également possible de passer des propriétés de l'objet à la fonction `edit`. Dans ce cas, **la valeur initiale/fonction sera appliquée aux champs/listes/objets demandés au lieu de l'objet en lui-même**. Il est donc parfaitement possible d'utiliser `edit` plusieurs fois, tant que ça s'applique à des propriétés différentes.

Exemple :

```ts
s.edit(!this.props.egfId) // objet en entier
    .edit(false, "id", "isValide", "totalEngagementFinancier", "totalVersementsRecus") // valeur par défaut sur certains champs
    .edit(() => !this.props.egfId, "typeEngagementPartenaireCode"); // édition forcée sur un champ
```

La façon standard de modifier l'état d'édition d'un membre d'objet est de passer par `patch` (ou `add`), décrits en dessous, mais cette version de `edit()` permet de spécifier le même état d'édition à plusieurs champs à la fois (désactiver l'édition sur plusieurs champs est un usage très courant). C'est aussi une version plus courte pour un seul champ si l'édition est la seule chose à modifier dessus.

### `add(name, fieldBuilder)`

La fonction `add` permet d'ajouter un nouveau champ au `FormNode` en cours de construction. Elle prend comme paramètres :

-   `name`, qui est le nom du champ à créer
-   `fieldBuilder`, une fonction qui sera appelée avec un `EntityFieldBuilder` et le `FormNode` courant pour paramétrer le champ.

Un champ ajouté dans un noeud de formulaire se comportera comme un champ classique au sein du noeud de formulaire, et sera mis à jour par les actions de ce noeud (`set`, `replace` et `clear`). En revanche, n'étant pas lié à un champ correspondant dans le noeud source, **il ne sera pas affecté par les modifications de noeud source**. En particulier, un appel de `replace` ou `clear` sur le noeud source ne videra **pas** ce champ.

De plus, un champ ajouté sera **omis par défaut du résultat de `toFlatValues`**. L'usage principal étant porté par le service de sauvegarde des formulaires, il est plus cohérent d'omettre ces champs qui n'ont par définition pas de persistence dans la modèle. Il est possible cependant de les inclure en renseignant le second paramètre (optionnel) de `toFlatValues` à `true`.

### `patch(name, builder)`

La fonction `patch` permet de modifier un membre du `FormNode`, que ça soit un champ, une sous-liste ou un sous-objet. Elle prend comme paramètres :

-   `name`, qui est le nom du champ/sous-objet/sous-liste. **Ce nom est typé et changera la signature en fonction de ce à quoi il correspond**.
-   `builder`, qui peut être un `fieldBuilder`, `listBuilder` ou un `objectBuilder` en fonction du membre choisi. Ces fonctions seront appelé avec le builder correspondant (`EntityFieldBuilder`, `FormNodeBuilder` ou `FormListNodeBuilder`), ainsi que le `FormNode` courant.

### `remove(...fields)`

La fonction `remove` permet de supprimer les champs passés en paramètres du `FormNode`. Les champs supprimés existeront toujours sur le noeud source.

La suppression de champs permet de créer un formulaire qui ne concerne qu'une partie des champs d'une entité "complexe", par exemple.

### `removeAllBut(...fields)`

La fonction `removeAllBut` fonctionne comme `remove`, sauf qu'elle permet à la place de supprimer tous les champs du `FormNode`, à l'exception de ceux passés en paramètres.

### `build()`

La fonction `build` permet de construire le `FormNode`. Elle est appelée à la fin de `makeFormNode` et à priori il n'y aura jamais besoin de l'appeler manuellement.

## `FormListNodeBuilder`

Il permet de construire un FormListNode à partir d'un StoreListNode. Il sera le paramètre de toute fonction de configuration sur un FormListNode (celle de `makeFormNode` ou de `patch`)

Il dispose des méthodes suivantes :

### `edit(value)`

Idem `FormNodeBuilder`

### `items(objectBuilder)`

La fonction `items` permet de modifier les items de la liste (qui sont, pour rappel, des `FormNode`s). Elle prend comme unique paramètre `objectBuilder`, pour préciser la configuration. Comme toujours, cette fonction est donc appelée avec un `FormNodeBuilder` ainsi que le `FormListNode` courant.

### `build()`

Idem `FormNodeBuilder`.

## Exemple

Cet exemple est peu réaliste, mais il montre bien tout ce qu'on peut faire à la création d'un `FormNode` :

```ts
const formNode = new FormNodeBuilder(storeNode)
    // On change le domaine et le isRequired d'un champ.
    .patch("denominationSociale", (f, node) =>
        f.metadata(() => ({
            domain: DO_COMMENTAIRE,
            isRequired: !!node.capitalSocial.value
        }))
    )
    // On modifie un autre champ pour
    .patch("capitalSocial", (f, node) =>
        f
            // Ecraser sa valeur.
            .value(() => (node.denominationSociale.value && node.denominationSociale.value.length) || 0)
            // Ajouter un validateur.
            .metadata({validator: {type: "number", max: 20000}})
            // Et ne le rendre éditable que pour une seule valeur d'un autre champ.
            .edit(() => node.statutJuridiqueCode.value !== "EARL")
    )
    // On rend un sous noeud complètement non éditable.
    .patch("adresse", s => s.edit(() => false))

    // On ajoute un champ supplémentaire calculé.
    .add("email", (f, node) =>
        f
            .value(
                () => node.denominationSociale.value,
                value => (node.denominationSociale.value = value)
            )
            .metadata({
                domain: DO_LIBELLE_100,
                label: "structure.email",
                validator: {type: "email"}
            })
    )
    .build();
```
