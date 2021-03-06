# Les actions de formulaires : `FormActions`

Une fois le `FormNode` créé, on aura besoin d'un deuxième objet pour gérer le cycle de vie du formulaire : un `FormActions`.

Il se crée à partir d'un `FormNode` via un `FormActionsBuilder`. En pratique, un `FormActions` sera créé via **`useFormActions`** (ou `makeFormActions`).

Il s'agit d'un **superset de [`useLoad`](model/load.md?id=useload-et-nodeload),** : on définira donc, en plus du service de chargement, un **service de sauvegarde**, ainsi que d'autres options facultatives. Pour un formulaire, **le service de chargement est toujours défini sur le noeud source**. Appeler `useLoad` sur un `FormNode` (même s'il n'y aucune raison ne ne pas utiliser `useFormActions` à la place) est une erreur, mais `formNode.load()` existe quand même : il appellera simplement le service de chargement du noeud source.

## `FormActionsBuilder`

Il hérite directement de [`NodeLoadBuilder`](model/load.md?id=api-de-nodeloadbuilder), et dispose des méthodes supplémentaires suivantes (en plus donc de `params` et `load`) :

### `save(service, name?)`

Permet de préciser un service de sauvegarde. Il est possible d'en spécifier plusieurs : pour se faire il suffit de renseigner le deuxième paramètre `name` avec le nom du service désiré (le service sans nom est appelé `"default"` et sera accessible sous `actions.save()`)

### `on(events, handler)`

La fonction `on` permet de définir un handler d'évènements autour des actions et permet de spécifier soit plusieurs fonctions par évènement, soit une fonction pour plusieurs évènements.

Les évènements possibles (premier paramètres) sont : `"error"`, `"load"`, `"save"`, `"cancel"` et `"edit"`. On peut en spécifier un seul ou bien un array d'évènements. Le handler passé en second paramètre sera appelé avec le nom de l'évènement qui l'a déclenché, ainsi que le nom du save pour `"error"` et `"save"`.

### `i18nPrefix(prefix)`

Après un appel à un service de sauvegarde avec succès, un message sera affiché, dont la clé i18n par défaut est `"focus.detail.saved"`. `i18nPrefix()` permet de remplacer `"focus"` par autre chose.

Par ailleurs, si le contenu du message d'erreur est vide (par exemple avec un préfixe personnalisé), le message ne sera pas affiché après sauvegarde.

### `useSaveNamesForMessages()`

Cette méthode permet de demander à ce que le nom du service de sauvegarde (ce qui n'est utile que s'il n'y a plusieurs) soit inclus dans le message de succès, comme ceci : `"focus.detail.{saveName}.saved"`.

## API de `FormActions`

### `load()`

Appelle le service de chargement du `StoreNode` source. Cette méthode sera appelée à la création des actions.

### `save()`

Appelle le service de sauvegarde par défaut avec la valeur courante du noeud de formulaire, puis enregistre le retour du service (si non vide) dans le **noeud source** du formulaire (qui mettra ensuite le formulaire à jour). Si l'état d'édition du noeud de formulaire n'est pas forcé, elle repassera également le formulaire en consultation.

Les autres services de sauvegarde sont disponibles sous le nom qui leur a été donné, et leur comportement est le même.

### `isLoading`

Précise si le formulaire est en cours de chargement ou de sauvegarde.

### `onClickEdit`/`onClickCancel`

Ce sont les méthodes à passer à des boutons de formulaires pour passer en mode édition / retourner en consultation. Elles appellent aussi les handlers correspondants.

### `forceErrorDisplay`

Ce booléen est renseigné automatiquement lors de l'appel de save, il permet de forcer l'affichage des erreurs sur les champs.

### `panelProps` et `formProps`

Ce sont des propriétés qui regroupent l'ensemble des propriétés du `FormActions` à passer au composant de Panel (boutons, loading, save) et au composant de Formulaire (save, forceErrorDisplay).

## Exemple

Premier exemple : formulaire classique d'édition

```ts
const actions = new FormActionsBuilder(node)
    .params(() => props.id)
    .load(loadStructure)
    .save(saveStructure)
    .on(["save", "cancel"], () => props.close())
    .build();
```
