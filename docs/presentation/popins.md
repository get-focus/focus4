# Popins

Focus propose 2 types de popins :

-   La `Popin`, qui est un panneau latéral qui s'ouvre sur la gauche ou la droite et qui prend en général la moitié de l'écran. La `Popin` pose son propre `Scrollable`, donc il est possible d'utiliser dedans les fonctionnalités qui en ont besoin (un header, du scroll infini...).
-   Le `Dialog`, qui est une petite fenêtre qui s'ouvre au centre, et qui a été récupéré de `react-toolbox`.

Ces deux popins **doivent être placées dans un `Scrollable`**, c'est-à-dire en pratique soit dans un `Layout` (donc n'importe où dans votre application, ce n'est pas vraiment limitant), soit dans une autre `Popin`. En particulier, **elles s'ouvriront dans le contexte du premier `Scrollable` parent** qu'elles rencontrent. Ainsi, on peut mettre des `Popin` dans des `Popin` ou des `Dialog` dans des `Popin`. Sur le `Dialog` en particulier, il s'ouvrira dans la `Popin` et non dans le `Layout` global, donc il sera centré dedans.
