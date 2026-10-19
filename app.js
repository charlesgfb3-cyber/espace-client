/* Logique de connexion et d'affichage du tableau de bord. */
(function () {
  var CLE_SESSION = "espaceClientHash";
  var STATUTS = {
    "actif": { libelle: "Actif", classe: "ok", detail: "Votre automatisation fonctionne." },
    "en pause": { libelle: "En pause", classe: "pause", detail: "Votre automatisation est momentanément arrêtée." },
    "en préparation": { libelle: "En préparation", classe: "prep", detail: "Votre automatisation est en cours d'installation." }
  };

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
    var client = h ? trouverClient(h) : null;
    if (client) afficherTableau(client); else afficherConnexion();
  });

  window.__espaceClient = { trouverClient: trouverClient, STATUTS: STATUTS };
})();
