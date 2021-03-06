# Gestion des requêtes

Focus propose un wrapper à [`window.fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) appelé **`coreFetch`**, qui a pour vocation de simplifier son usage dans les cas courants et de traiter automatiquement les erreurs.

Son API est la suivante :

**`coreFetch(method, url, {body?, query?}, options?)`**

-   **`method`** permet de renseigner le verbe HTTP (GET, POST, PUT, DELETE...) de la requête
-   **`url`** permet de renseigner l'URL que l'on veut appeler
-   **`{body?, query?}`** permettent de renseigner le contenu du _body_ de la requête (pour un POST ou un PUT), ainsi que les _query params_ qui devront être ajoutés à l'URL. La méthode s'occupera d'inclure les _query params_ à l'URL et gère donc leur caractère optionnel
-   **`options`** est le paramètre d'options de `window.fetch`. Cet objet d'options est prérempli par `coreFetch` pour y inclure ce qu'on a déjà défini (la méthode et le body en particulier), mais il est surchargeable via ce paramètre.

Cette méthode est accompagnée du **`requestStore`**, qui permettra de suivre la progression de toutes les requêtes. Il pourra être utilisé pour afficher un "spinner" global dans l'application pour indiquer qu'une requête est en cours, ou à fin de debug.

Si `coreFetch` reçoit une erreur et que le corps de la réponse est un JSON, alors le contenu des messages inclus dans `globalErrors` (ou `globalWarnings`) sera poussé dans le `messageStore`.
