# Store de références

## Présentation

Un `ReferenceStore` est construit par la fonction `makeReferenceStore(referenceLoader, refConfig)` :

-   `referenceLoader` est une fonction qui prend en paramètre un nom de référence et la liste de référence (qui renvoie donc une Promise)
-   `refConfig` est un objet dont les propriétés sont des définitions de listes de référence, à priori générés avec le reste du modèle. Ce sont des objets de la forme `{type, valueKey, labelKey}` qui servent à définir totalement comme la référence doit s'utiliser.

Un store de référence se construit de la manière suivante :

```ts
const referenceStore = makeReferenceStore(referenceLoader, {
    product,
    line
});
```

Le `referenceStore` résultant peut être utilisé tel quel dans un composant `observer`: lorsqu'on veut récupérer une liste de références, le store regarde dans le cache et renvoie la valeur s'il la trouve. Sinon, il lance le service de chargement qui mettra à jour le cache et renvoie une liste vide. Une fois la liste chargée, l'observable sera modifiée et les composants mis à jour automatiquement.

Exemple d'usage :

```tsx
@observer
class View extends Component {
    render() {
        return (
            <ul>
                {referenceStore.product.map(product => (
                    <li>product.code</li>
                ))}
                {referenceStore.line.map(line => (
                    <li>line.label</li>
                ))}
            </ul>
        );
    }
}
```

Ce composant sera initialement rendu 3 fois:

-   La première fois, les deux utilisations de `product` et de `line` vont lancer les appels de service (les deux listes sont vides)
-   La deuxième fois, l'une des deux listes aura été chargée et sera affichée.
-   La troisième fois, l'autre liste aura également été chargée et les deux seront affichées.

Les fois suivantes (dans la mesure que les listes sont toujours en cache), il n'y aura qu'un seul rendu avec les deux listes déjà chargées.

## `ReferenceList`

Une `ReferenceList` est une liste contenue dans un `ReferenceStore`. En plus d'être une liste observable classique, elle a contient aussi :

-   Une propriété `$valueKey` qui correspond au nom de la propriété des objets de la liste qui sera utilisée comme valeur
-   Une propriété `$labelKey` qui correspond au nom de la propriété des objets de la liste qui sera utilisée comme libellé
-   Une fonction `getLabel(value)` qui permet de résoudre une valeur
-   Une fonction `filter()` modifiée qui permet de retourner une nouvelle `ReferenceList` avec les mêmes propriétés (au lieu d'un array classique qui n'aurait plus `$valueKey`/`$labelKey`/`getLabel()`);

## `makeReferenceList(list, {valueKey, labelKey})`

Cette fonction permet de transformer une liste classique en une liste de référence. Elle contrôlera que `valueKey` et `labelKey` existent.
