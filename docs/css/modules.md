# Modules CSS

## Présentation

Un [module CSS](https://github.com/css-modules/css-modules) est un fichier CSS que l'on importe directement dans un fichier de composant. Le contenu de l'import est un object contenant les noms de toutes les classes CSS définies dans le fichier, que l'on peut utiliser directement en tant que `className` sur un tag HTML. L'intérêt de cet usage est que l'on peut demander à Webpack de **brouiller le nom de classes** à la compilation pour ainsi effectivement "scoper" le CSS aux composants qui l'ont importé. Ainsi, on obtient une isolation du CSS que l'on écrit et on peut simplifier beaucoup les noms de classes, quasiment supprimer le nesting et se forcer à regrouper les styles avec les composants qui les utilisent car ils sont liés par le code.

Par exemple, si je définis le fichier CSS `panel.css` suivant :

```css
.panel {
    padding: 12px;
}

.title {
    font-size: 20px;
}

.content {
    font-size: 14px;
}
```

Je pourrais par la suite l'utiliser dans un composant en l'important :

```tsx
import panelCss from "./panel.css";

function Panel() {
    return (
        <div className={panelCss.panel}>
            <h5 className={panelCss.title}>Titre</h5>
            <p className={panelCss.content}>Contenu</p>
        </div>
}
```

Il est possible de générer des définitions de types pour les fichiers CSS (pour générer `panel.css.d.ts` dans notre exemple), ce qui permet de valider à la compilation (et d'avoir de l'autocomplétion) les classes CSS utilisées dans l'application. Il existe des solutions déjà faites pour le faire, mais Focus utilise son propre générateur pour des raisons qu'on détaillera dans le paragraphe suivant. Il n'y a par contre pas (encore) de solution satisfaisante pour le brancher directement sur Webpack, donc tout script de génération de types CSS devra être fait manuellement.

## `Modifiers`

En général, un fichier CSS ne contient pas que des noms de classes "simples". Une pratique courante en CSS est d'utiliser la convention "**BEM**", pour "**B**lock - **E**lement - **M**odifier", qui est une règle de nommage des classes CSS où chaque classe se divise jusqu'en 3 morceaux :

-   Le "Block", qui correspondrait ici à `panel`
-   Le "Element", qui correspondrait ici à `title` et à `content`
-   Le "Modifier", qui n'est pas dans l'exemple précédent et serait une classe supplémentaire qui s'appliquerait à un élément dans certaines circonstances. Par exemple, on pourrait avoir une propriété au composant qui permet d'aligner le titre à gauche, au centre ou à droite.

En convention BEM, ces classes s'appelleraient :

-   `.panel`
-   `.panel_title`
-   `.panel_content`
-   `.panel_title--left`
-   `.panel_title--center`
-   `.panel_title--right`

Puisque l'on divise déjà nos classes CSS en fichiers distincts, on obtient déjà le niveau "Block - Element" immédiatement :

-   `panel.css : .panel` -> `.panel_panel` -> `panelCss.panel` (celui-là est un peu malheureux mais on pourra s'y faire)
-   `panel.css : .title` -> `.panel_title` -> `panelCss.title`
-   `panel.css : .content` -> `.panel_content` -> `panelCss.content`

Si on ajoute les cas de modifiers en revanche, ça devient tout de suite un peu moins sympa :

-   `panel.css : .title--left` -> `.panel_title--left` -> `panelCss['title--left']`
-   `panel.css : .title--center` -> `.panel_title--center` -> `panelCss['title--center']`
-   `panel.css : .title--right` -> `.panel_title--right` -> `panelCss['title--right']`

_Remarque : malgré l'usage de l'indexeur d'objet, Typescript valide quand même le nom de la classe_

De plus, l'utilisation des modifiers est pénible sans aide extérieure :

```tsx
import panelCss from "./panel.css";

function Panel({tPos = "left"}: {tPos: "left" | "center" | "right"}) {
    return (
        <div className={panelCss.panel}>
            {/* Si on accepte de perdre la validation TS et que les noms sont raccords */}
            <h5 className={`${panelCss.title} ${(panelCss as any)[`title--${tPos}`]}`}>Titre</h5>
            {/* Sinon on pourrait faire quelque chose comme ça */}
            <h5 className={`${panelCss.title} ${panelCss[tPos == "left" ? "title--left" : tPos == "center" ? "title--center" : "title--right"]}`}>Titre</h5>
            <p className={panelCss.content}>Contenu</p>
        </div>
}
```

En utilisant une librairie comme [`classnames`](https://github.com/JedWatson/classnames), on pourrait faire plus propre, mais cela reste encore assez verbeux :

```tsx
import classNames from "classnames";
import panelCss from "./panel.css";

function Panel({tPos = "left"}: {tPos: "left" | "center" | "right"}) {
    return (
        <div className={panelCss.panel}>
            {/* Si on accepte de perdre la validation TS et que les noms sont raccords */}
            <h5 className={`${panelCss.title} ${(panelCss as any)[`title--${tPos}`]}`}>Titre</h5>
            {/* Sinon on pourrait faire quelque chose comme ça */}
            <h5 className={classnames(panelCss.title, {
                [panelCss["title--left"]]: tPos == "left",
                [panelCss["title--center"]]: tPos == "center",
                [panelCss["title--right"]]: tPos == "right",
            })}>Titre</h5>
            <p className={panelCss.content}>Contenu</p>
        </div>
}
```

## `toBem` / `fromBem`

Pour simplifier l'usage des modifiers et garder le typage fort que les CSS Modules et Typescript nous apporte, Focus est muni d'un générateur de types CSS qui **comprend ce qu'est un modifier**.

Au lieu de générer le type précédent comme :

```ts
interface PanelCss {
    panel: string;
    title: string;
    content: string;
    "title--left": string;
    "title--center": string;
    "title--right": string;
}

declare const panelCss: PanelCss;
export default panelCss;
```

Ce qui serait le plus direct, Focus génère à la place :

```ts
import {CSSElement, CSSMod} from "@focus4/styling";

interface Content {
    _196cd: void;
}
interface Panel {
    _353e5: void;
}
interface Title {
    _4bf8f: void;
}

export interface PanelCss {
    actions: CSSElement<Actions>;
    content: CSSElement<Content>;
    title: CSSElement<Title>;
    "title--left": CSSMod<"left", Title>;
    "title--center": CSSMod<"center", Title>;
    "title--bottom": CSSMod<"bottom", Title>;
}

declare const panelCss: PanelCss;
export default panelCss;
```

Les types `CSSElement` et `CSSMod` sont bien évidemment toujours des `string`, mais ils portent également des informations supplémentaires qui permet l'identification de chaque classe.

La méthode **`toBem`** de `@focus4/styling` permet de convertir l'objet décrit par `PanelCss` en un objet "wrapper" qui s'utilise de la manière suivante :

```tsx
import {toBem} from "@focus4/styling";
import panelCss from "./panel.css";

const theme = toBem(panelCss);

function Panel({tPos = "left"}: {tPos: "left" | "center" | "right"}) {
    return (
        <div className={panelCss.panel()}>
            <h5 className={panelCss.title({left: tPos == "left", center: tPos == "center", right: tPos == "right"})}>Titre</h5>
            <p className={panelCss.content()}>Contenu</p>
        </div>
}
```

Chaque élément est désormais une fonction qu'on appelle avec un objet qui décrit les modifiers qui doivent s'appliquer. Naturellement, grâce aux types générés, tous les usages de cet objet sont fortement typés, et il s'agit probablement d'une des manières les plus directes de manipuler des variations dynamiques de CSS.

De la même façon, la fonction **`fromBem`** permet de faire la transformation inverse. Elle n'a pas vocation à être utilisée directement mais est un composant essentiel de l'usage du CSS dans les composants Focus.
