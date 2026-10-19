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
