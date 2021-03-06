# Présentation <!-- {docsify-ignore-all} -->

**`Focus v4`** est en ensemble de modules conçu pour essayer de simplifier et généraliser les réponses aux besoins récurrents de réalisation de SPA avec **[React](http://www.reactjs.org)** (bien que certains d'entres-eux pourraient être utilisés avec d'autres frameworks comme Angular ou Vue). Ces modules s'appuient fortement sur **[Typescript](http://www.typescriptlang.org)** et **[MobX](http://mobx.js.org)**. Il est vivement encouragé d'être au moins familier avec ces technologies avant de continuer.

`Focus v4` peut être utilisé avec toute sorte de stack technique côté API. Il s'attend néanmoins à un format spécifique pour interpréter les erreurs et nécessite une API spécifique pour utiliser le module de recherche avancée. De plus, il est conseillé de pouvoir générer les différents fichiers de modèle utilisés par les formulaires. [Vertigo](http://www.github.com/KleeGroup/vertigo) et [Kinetix](http://www.github.com/KleeGroup/kinetix-tools) répondent à tous ces besoins (en Java et C#, respectivement), mais il est tout à fait abordable de s'en passer.

## Les différents modules

`Focus v4` est divisé en **7 (+2) modules** NPM, que l'on peut regrouper dans les catégories suivantes (_(R)_ indique que le module a une dépendance à React) :

### Modules de base

Ces modules contiennent les éléments de base d'une application Focus, et servent de fondations aux modules plus avancés.

-   **`@focus4/core`** : fonctionnalités de base, utilisées dans les autres modules.
-   **`@focus4/styling`**_(R)_ : système de CSS utilisé par les composants de Focus.
-   **`@focus4/toolbox`**_(R)_ : repackaging de [react-toolbox](http://www.react-toolbox.io), pour une intégration optimale avec le reste des modules.

### Modules de formulaires

Ces deux modules permettent de construire des formulaires, et représentent donc le coeur d'une application Focus. C'est avec ces deux modules-là que vous passerez le plus de temps.

-   **`@focus4/stores`** : gestion des stores de formulaires, collections et de référence.
-   **`@focus4/forms`**_(R)_ : composants de formulaires.

### Modules de présentation

Ces deux modules proposent des composants graphiques de haut niveau qui permettent de structurer la mise en page d'une application Focus, ainsi que l'affichage des listes et de la recherche avancée.

-   **`@focus4/layout`**_(R)_ : composants de mise en page.
-   **`@focus4/collections`**_(R)_ : composants de listes et de recherche avancée.

### Autres modules

-   **`@focus4/legacy`**_(R)_ : compatibilité avec d'anciennes versions de Focus ( < 9).
-   **`focus4`**_(R)_ : méta-package contenant tous les autres (sauf `legacy`).

## Starter Kit

Vous pouvez commencer un projet en utilisant le [starter kit](http://www.github.com/KleeGroup/focus4-starter-kit), qui sert également de démo et présente les usages les plus courants de focus4.

## Remarque sur les anciennes versions

`Focus v4` est une librairie qui évolue assez fréquemment et n'hésite pas trop à casser la compatibilité avec les versions précédentes. Il est également assez difficile de fixer une version précise pour laquelle effectuer le "support" puisque différentes mises à jour font évoluer différents modules de la librairie, et donc selon où vous vous êtes "arrêté" vous aurez certaines évolutions mais pas d'autres.

Il est néanmoins conseillé, quelque soit la version de `Focus v4` (>= 9) que vous utilisez, de vous référer à cette documentation en premier lieu. Les concepts présentés restent identiques et pourront être adaptés aux APIs à votre disposition. N'hésitez pas à parcourir le repository au tag de votre version pour lire la documentation qui s'y trouve et comparer avec la documentation à jour.

Si vous êtes encore en 8, le même conseil concernant l'historique s'applique, mais les concepts derrière les formulaires ont beaucoup changé entre la 8 et la 9. Le module `legacy` sert à faire la correspondance entre les deux.
