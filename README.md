# (auto)focus(-mobx)
*(on peut toujours espérer)*

> Normalement cette fois-ci c'est la bonne.

**autofocus-mobx** est une libre réimplémentation de `focus-core` et partielle de `focus-components` en **[Typescript](http://www.typescriptlang.org)** qui utilise **[MobX](http://mobxjs.github.io/mobx)** comme conteneur de state (à la place de `flux` ou `redux`).
Son but principal est de proposer le framework le plus simple, efficace et robuste pour accomplir la même chose que le `focus` traditionnel (v2 ou la future v3).

## Typescript
Typescript est un **superset typé** du Javascript courant (ES2016+). Il vient avec son propre compilateur qui effectue, comme son nom l'indique, du **typage statique** via de l'inférence (ie. automatiquement) ou des annotations explicites. Son usage est totalement **facultatif** (il n'est pas nécessaire d'utiliser du Typescript pour consommer la librairie) et totalement "à la carte" (il n'est pas nécessaire d'utiliser du typage partout). Néanmoins, la surcouche est suffisament fine et intuitive pour ne pas causer une surcharge de travail notable (le "langage" peut s'apprendre en 2 heures) et les bénéfices peuvent être énormes, du moins si on se décide à utiliser les options les plus strictes.

Il n'est pas non plus nécessaire d'avoir des libraries en Typescript pour faire du Typescript puisqu'il est possible d'écrire des définitions de librairies (la plupart sont déjà écrites et disponibles sur `npm`) pour décrire l'architecture de n'importe quel code Javascript. Il n'est pas non plus nécessaire d'utiliser Typescript pour profiter de ses bénéfices, puisqu'en utilisant un éditeur/IDE adapté comme **[Visual Studio Code](http://code.visualstudio.com)**, le service de langage Typescript (qui fournit l'autocomplétion, la navigation...) est également activé par défaut pour le Javascript.

Quelque soit votre intérêt dans Typescript (j'espère vous avoir convaincu !), le fait qu'autofocus-mobx soit écrit en Typescript est un plus indéniable.

Je vous renvoie à l'excellente [documentation](http://www.typescriptlang.org/docs/tutorial.html) pour vous lancer (si ce n'est déjà fait).

## MobX
MobX, c'est le futur, dès aujourd'hui dans votre assiette. La communauté React a encore le nez plein dans `redux` (ils sont occupés à écrire des actions, des reducers et des sélecteurs à n'en plus finir, il faut les comprendre) et n'a pas encore eu le temps de réagir (la première "vraie" release date de mars dernier après tout), mais là c'est le moment de s'y mettre.

### En 2 phrases
MobX permet de définir des **observables**, qui peuvent être observées par des **observers** (un component React par exemple). Cet observer va réexécuter la fonction qu'on lui donne (pour un composant React, sa fonction `render`) a chaque fois qu'une observable utilisée dans cette fonction a été modifiée, n'importe où.

### C'est magique
Ce qu'il faut bien comprendre, pour l'intégration avec React, c'est que ces réactions se produisent indépendamment des `props` ou du `state` du composant !

**Ca veut dire qu'on n'a plus besoin :**
* de **mixins/classes de base** pour injecter de l'état dans le `state`, ou de **composants d'ordre supérieur** pour injecter dans les `props`. Un simple décorateur (ou fonction) `@observer` suffit. Plus besoin donc de sélecteur pour récupérer l'état qu'on veut depuis un store.
* de **`state` local** dans un composant. Une simple propriété de classe marquée d'un `@observable` suffit. Fini le `setState` asynchrone (et [c'est mieux comme ça](https://medium.com/@mweststrate/3-reasons-why-i-stopped-using-react-setstate-ab73fc67a42e#.97vfrg1k0))
* de **dispatcher**: on modifie directement l'observable (qui est peut être un objet, un array, une map ou une primitive boxée) et tout sera mis à jour automatiquement. Du coup, on peut toujours avoir des actions, mais ce sont simplement des fonctions qui mettent à jour une observable.
* d'une **structure rigide** pour contenir le state. Que ça soit un `CoreStore` de `focus` ou le store `redux`, plus besoin, on a des observables et on les range où on veut comme on veut.

La doc est **[ici](http://mobxjs.github.io/mobx)**.

## Ce qu'il y a dans autofocus-mobx
MobX permet de simplifier beaucoup les choses, mais ça ne veut pas dire pour autant qu'on a plus besoin de tout ce proposait déjà `focus-core` (loin de là). Voici la liste de tous les différents modules qui composent `autofocus-mobx`:

### EntityStore
[Par ici](src/entity)

### ReferenceStore
Un `referenceStore` d'autofocus-mobx est construit par la fonction `makeReferenceStore(serviceFactory, refConfig)` :
* `serviceFactory` est une fonction qui prend en paramètre un nom de référence et renvoie un service (sans paramètre) permettant de récupérer la liste de référence (qui renvoie donc une Promise)
* `refConfig` est un objet dont les propriétés seront les listes de références à charger. Pour typer le store de référence, il suffit de typer ces propriétés avec le type correspondant :

```ts
const referenceStore = makeReferenceStore(serviceFactory, {
    product: [] as Product[],
    line: [] as Line[]
});
```

Le `referenceStore` résultant peut êtere utilisé tel quel dans un `observer`: lorsqu'on veut récupérer une liste de références, le store regarde dans le cache et renvoie la valeur s'il la trouve. Sinon, il lance le service de chargement qui mettra à jour le cache et renvoie une liste vide. Une fois la liste chargée, l'observable sera modifiée et les composants mis à jour automatiquement.

Exemple d'usage :

```tsx
@observer
class View extends React.Component {
    render() {
        return (
            <ul>
                {referenceStore.product.map(product => <li>product.code</li>)}
                {referenceStore.line.map(line => <li>line.label</li>)}
            </ul>
        );
    }
}
```

Ce composant sera initialement rendu 3 fois:
* La première fois, les deux utilisations de `product` et de `line` vont lancer les appels de service (les deux listes sont vides)
* La deuxième fois, l'une des deux listes aura été chargée et sera affichée.
* La troisième fois, l'autre liste aura également été chargée et les deux seront affichées.

Les fois suivantes (dans la mesure que les listes sont toujours en cache), il n'y aura qu'un seul rendu avec les deux listes déjà chargées.

Et voilà, ça marche tout seul.

(Note: Du coup, tout ce qui avait attrait au fonctionnement des références dans `focus-components` est obsolète (car inutile). `selectFor` prend simplement la liste de référence en paramètre à la place de son nom.)