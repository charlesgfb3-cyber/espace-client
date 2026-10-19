/*
  Liste des clients de l'Espace client.
  - La clé est l'empreinte SHA-256 du code d'accès (jamais le code en clair).
    Obtenez-la avec outil-hash.html.
  - statutMake : "Actif", "En pause" ou "En préparation".
  - majLe : date de dernière mise à jour, au format JJ/MM/AAAA.
*/
window.CONTACT = {
  texte: "Une question ? Écrivez-moi :",
  email: "charlesgfb3@gmail.com"
};

// URL du CSV publié (onglet "Publication" du Sheet des codes). Vide = liste locale ci-dessous seulement.
// Si le CSV est lisible, il remplace la liste locale ; sinon la liste locale sert de repli.
window.CLIENTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTNu25iKKMqB_T72Zz_1tt4SuPCDKfg_1ayGIA6j_lrTsFuIrl_086RInTO2hdjYZTR2sPWmxxClxUB/pub?gid=2021989778&single=true&output=csv";

// API admin (application web Apps Script du Sheet des codes). Vide = mode copier-coller seulement.
window.ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbw0u8wqOgkAViTyWCNbMvxBlv-l5d3gOanW0wvi0c9W-XmEtcAszhF1iGBZKckAbvQu/exec";

window.CLIENTS = {
  // EXEMPLE FICTIF — code d'accès « EXEMPLE ». À supprimer avant la mise en ligne.
  "3770be076b30e0deb2a7e3695f85683cafb9b5486236cc2b05698fae181c192b": {
    nom: "Client Exemple (fictif)",
    sheetUrl: "https://docs.google.com/spreadsheets/d/EXEMPLE",
    statutMake: "En préparation",
    majLe: "19/10/2026"
  }

  // Ajoutez vos clients ici, séparés par une virgule :
  // ,"<empreinte SHA-256 du code>": {
  //   nom: "Nom de l'entreprise",
  //   sheetUrl: "https://docs.google.com/spreadsheets/d/...",
  //   statutMake: "Actif",
  //   majLe: "JJ/MM/AAAA"
  // }
};
