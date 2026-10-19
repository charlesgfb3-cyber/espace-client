/* Logique de connexion et d'affichage du tableau de bord. */
(function () {
  var CLE_SESSION = "espaceClientHash";
  var STATUTS = {
    "actif": { libelle: "Actif", classe: "ok", detail: "Votre automatisation fonctionne." },
    "en pause": { libelle: "En pause", classe: "pause", detail: "Votre automatisation est momentanément arrêtée." },
    "en préparation": { libelle: "En préparation", classe: "prep", detail: "Votre automatisation est en cours d'installation." }
  };

  // --- Chargement optionnel de la liste publiée (CSV de l'onglet "Publication") ---
  function parserCSV(texte) {
    var lignes = [], ligne = [], champ = "", q = false, i, ch;
    for (i = 0; i < texte.length; i++) {
      ch = texte[i];
      if (q) {
        if (ch === '"') { if (texte[i + 1] === '"') { champ += '"'; i++; } else q = false; }
        else champ += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { ligne.push(champ); champ = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && texte[i + 1] === "\n") i++;
        ligne.push(champ); champ = ""; lignes.push(ligne); ligne = [];
      } else champ += ch;
    }
    if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    return lignes;
  }

  function clientsDepuisCSV(texte) {
    var out = {}, n = 0, lignes = parserCSV(texte);
    for (var i = 1; i < lignes.length; i++) {   // ligne 0 = en-têtes
      var l = lignes[i], h = String(l[1] || "").trim().toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(h)) continue;
      out[h] = { nom: l[0] || "", sheetUrl: l[2] || "", statutMake: l[3] || "", majLe: l[4] || "" };
      n++;
    }
    return n ? out : null;
  }

  function chargerListe() {
    var url = window.CLIENTS_CSV_URL;
    if (!url || typeof fetch !== "function") return Promise.resolve();
    return fetch(url, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (t) { var c = clientsDepuisCSV(t); if (c) window.CLIENTS = c; })
      .catch(function () { /* repli : liste locale clients.js */ });
  }
  var listePrete = chargerListe();

  function $(id) { return document.getElementById(id); }

  function trouverClient(hash) {
    var liste = window.CLIENTS || {};
    return Object.prototype.hasOwnProperty.call(liste, hash) ? liste[hash] : null;
  }

  function afficherTableau(client) {
    $("vue-connexion").hidden = true;
    $("vue-tableau").hidden = false;
    $("nom-client").textContent = client.nom || "";
    var lien = $("lien-sheet");
    if (client.sheetUrl) { lien.href = client.sheetUrl; lien.hidden = false; }
    else { lien.hidden = true; }
    var s = STATUTS[String(client.statutMake || "").trim().toLowerCase()] ||
      { libelle: client.statutMake || "Non renseigné", classe: "prep", detail: "" };
    var badge = $("statut-make");
    badge.textContent = s.libelle;
    badge.className = "badge " + s.classe;
    $("statut-detail").textContent = s.detail;
    $("maj-le").textContent = client.majLe ? "Dernière mise à jour : " + client.majLe : "";
    var c = window.CONTACT;
    if (c && c.email) {
      $("contact").innerHTML = "";
      $("contact").appendChild(document.createTextNode((c.texte || "Contact :") + " "));
      var a = document.createElement("a");
      a.href = "mailto:" + c.email; a.textContent = c.email;
      $("contact").appendChild(a);
    }
  }

  function afficherConnexion() {
    $("vue-tableau").hidden = true;
    $("vue-connexion").hidden = false;
    $("code").value = "";
  }

  async function connexion(e) {
    e.preventDefault();
    var erreur = $("erreur");
    erreur.textContent = "";
    var code = $("code").value;
    if (!window.normaliserCode(code)) { erreur.textContent = "Veuillez saisir votre code d'accès."; return; }
    var hash = await window.hacherCode(code);
    await listePrete;
    var client = trouverClient(hash);
    if (!client) { erreur.textContent = "Code d'accès incorrect."; return; }
    try { sessionStorage.setItem(CLE_SESSION, hash); } catch (x) {}
    afficherTableau(client);
  }

  function deconnexion() {
    try { sessionStorage.removeItem(CLE_SESSION); } catch (x) {}
    afficherConnexion();
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("form-connexion").addEventListener("submit", connexion);
    $("deconnexion").addEventListener("click", deconnexion);
    var h = null;
    try { h = sessionStorage.getItem(CLE_SESSION); } catch (x) {}
    afficherConnexion();
    if (h) listePrete.then(function () {
      var client = trouverClient(h);
      if (client) afficherTableau(client);
    });
  });

  window.__espaceClient = { trouverClient: trouverClient, parserCSV: parserCSV, clientsDepuisCSV: clientsDepuisCSV, listePrete: function () { return listePrete; }, STATUTS: STATUTS };
})();
