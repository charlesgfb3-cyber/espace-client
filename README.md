# Espace client — site statique

Petit portail client : le client saisit son code d'accès, puis voit son nom, un bouton vers son tableau de suivi (Google Sheet) et l'état de son automatisation (Make).

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page de connexion + tableau de bord (même page) |
| `clients.js` | Liste des clients, indexée par l'empreinte SHA-256 du code d'accès, + ligne de contact |
| `app.js` | Logique de connexion et d'affichage |
| `sha256.js` | Calcul de l'empreinte (Web Crypto, avec secours en JavaScript) |
| `style.css` | Mise en page (adaptée à l'iPhone) |
| `outil-hash.html` | Outil pour obtenir l'empreinte d'un code |
| `.nojekyll` | Indique à GitHub Pages de servir les fichiers tels quels |
| `.gitignore` | Empêche de publier un fichier de codes par erreur |

## Ajouter un client

1. **Choisir un code d'accès** simple pour le client (ex. : `PLOMBIER-LYON-24`). Le site ne tient pas compte des majuscules/minuscules ni des espaces autour : `plombier-lyon-24` fonctionne aussi.
2. **Le noter** dans votre fichier privé des codes (`codes-acces-clients.xlsx` ou `.csv`, conservé hors du site).
3. **Calculer son empreinte** : ouvrez `outil-hash.html` dans votre navigateur, tapez le code, cliquez sur « Calculer l'empreinte », puis « Copier l'empreinte ».
4. **Ajouter le client dans `clients.js`**, dans `window.CLIENTS`, en séparant les entrées par une virgule :

```js
"<empreinte copiée>": {
  nom: "Nom de l'entreprise",
  sheetUrl: "https://docs.google.com/spreadsheets/d/...",
  statutMake: "Actif",          // "Actif", "En pause" ou "En préparation"
  majLe: "19/10/2026"
}
```

5. **Supprimer l'entrée d'exemple** (code `EXEMPLE`) avant la vraie mise en ligne.
6. Enregistrer et publier (voir ci-dessous). Pour changer un statut, modifiez `statutMake` et `majLe`, puis republiez.

La ligne de contact affichée au client se règle dans `window.CONTACT` en haut de `clients.js`.

## Publier sur GitHub Pages

1. Créez un dépôt GitHub dédié (ex. `espace-client`) et déposez-y **le contenu** de ce dossier (pas le fichier des codes).
2. Avec un compte GitHub **gratuit**, GitHub Pages ne fonctionne que sur un dépôt **public**. Pour un dépôt privé, il faut une offre payante (GitHub Pro ou supérieure). Attention : dépôt public = `clients.js` lisible par tous (noms des clients et liens Sheet, mais pas les codes).
3. Dans le dépôt : **Settings > Pages > Build and deployment > Source : « Deploy from a branch »**, branche **`main`**, dossier **`/ (root)`**, puis **Save**.
4. Après une à deux minutes, le site est disponible à l'adresse `https://<votre-compte>.github.io/<nom-du-depot>/`. C'est ce lien à reporter partout où figure `[LIEN DU SITE CLIENT]`.

Pour tester en local avant publication : ouvrez `index.html` dans le navigateur et saisissez `EXEMPLE`.

## Limites de sécurité (à bien comprendre)

- C'est un site **statique** : il n'y a pas de serveur. La protection par code est **légère** : elle évite qu'un visiteur tombe par hasard sur le tableau d'un client, mais ce n'est pas une vraie authentification.
- Les codes ne sont **jamais stockés en clair** (seulement leur empreinte SHA-256). En revanche, quelqu'un de motivé peut lire `clients.js` et voir les noms et les liens Sheet, ou tenter de deviner un code trop simple. Choisissez des codes d'au moins 10 caractères, pas évidents.
- **Ne mettez dans ce site que des liens et des informations non sensibles.** Pas de données personnelles des clients finaux, pas de tarifs confidentiels.
- Le **Google Sheet reste protégé par son propre partage Google** : partagez-le uniquement avec l'adresse e-mail du client (pas « Toute personne disposant du lien »). Même si le lien est vu par un tiers, il ne pourra pas l'ouvrir.
- Le **fichier des codes d'accès ne doit jamais être publié** sur GitHub ni sur GitHub Pages. Gardez-le dans un dossier privé (ordinateur ou Drive privé).
- La session se termine à la fermeture de l'onglet ou avec « Se déconnecter ».
