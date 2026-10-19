/* Console admin. Rien de secret ici : la protection repose sur le code admin
   (vérifié côté serveur par l'API, ou par empreinte côté navigateur). */
(function () {
  var CLE_JOURNAL = "espaceClientJournal";
  var etat = { clients: [], api: false };
  function $(id) { return document.getElementById(id); }
  function txt(s) { return String(s == null ? "" : s); }
  function el(tag, props, enfants) {
    var e = document.createElement(tag);
    for (var k in (props || {})) e[k] = props[k];
    (enfants || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function aujourdhui() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }

  /* ---------- Journal local ---------- */
  function lireJournal() { try { return JSON.parse(localStorage.getItem(CLE_JOURNAL) || "[]"); } catch (x) { return []; } }
  function journaliser(msg) {
    var j = lireJournal(); j.unshift(new Date().toLocaleString("fr-FR") + " — " + msg);
    try { localStorage.setItem(CLE_JOURNAL, JSON.stringify(j.slice(0, 200))); } catch (x) {}
    afficherJournal();
  }
  function afficherJournal() {
    var ul = $("journal"); if (!ul) return; ul.innerHTML = "";
    var j = lireJournal();
    if (!j.length) ul.appendChild(el("li", { textContent: "Rien pour l'instant." }));
    j.forEach(function (l) { ul.appendChild(el("li", { textContent: l })); });
  }

  /* ---------- Force d'un code ---------- */
  function forceCode(code) {
    var c = window.normaliserCode(code);
    if (!c) return { niveau: "", texte: "" };
    var jeu = 0;
    if (/[A-Z]/.test(c)) jeu += 26; if (/[0-9]/.test(c)) jeu += 10; if (/[^A-Z0-9]/.test(c)) jeu += 10;
    var utiles = c.replace(/-/g, "");
    var bits = Math.round(utiles.length * Math.log2(Math.max(jeu, 2)));
    var alertes = [];
    if (utiles.length < 10) alertes.push("trop court (10 caractères min. conseillés)");
    if (/^(.)\1+$/.test(utiles)) alertes.push("un seul caractère répété");
    if (/(0123|1234|2345|3456|4567|5678|6789|ABCD|AZERTY|QWERTY|PASSWORD|MOTDEPASSE|ADMIN)/.test(utiles)) alertes.push("suite ou mot trop courant");
    if (/(19|20)\d\d/.test(utiles)) alertes.push("contient une année");
    if (/[0O1IL]/.test(utiles)) alertes.push("caractères ambigus (0/O, 1/I/L)");
    var niveau = bits >= 70 && alertes.length === 0 ? "fort" : bits >= 50 && !/court|répété|courant/.test(alertes.join()) ? "moyen" : "faible";
    return { niveau: niveau, texte: "Force : " + niveau + " (≈ " + bits + " bits)" + (alertes.length ? " — " + alertes.join(", ") : "") };
  }
  function afficherForce(input, sortie) {
    var f = forceCode(input.value);
    sortie.textContent = f.texte; sortie.className = "petit" + (f.niveau ? " force-" + f.niveau : "");
  }

  /* ---------- API ---------- */
  function appelApi(action, donnees) {
    var url = window.ADMIN_API_URL, code = window.__codeSaisi;
    if (!url || !code) return Promise.reject(new Error("API indisponible"));
    var corps = Object.assign({ action: action, codeAdmin: code }, donnees || {});
    return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(corps) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.erreur || "Erreur API"); return j; });
  }

  function depuisCSV() {
    var l = window.CLIENTS || {};
    return Object.keys(l).map(function (h) {
      var c = l[h]; return { empreinte: h, nom: c.nom, sheetUrl: c.sheetUrl, statutMake: c.statutMake, majLe: c.majLe, etat: "Actif" };
    });
  }

  function charger() {
    $("mode-admin").textContent = "Chargement…";
    return appelApi("lister").then(function (j) {
      etat.api = true; etat.clients = j.clients;
      $("mode-admin").textContent = "Mode connecté : les actions écrivent directement dans le Sheet des codes (publication du site sous 5 min environ).";
    }).catch(function (e) {
      etat.api = false; etat.clients = depuisCSV();
      $("mode-admin").textContent = "Mode copier-coller : l'API admin ne répond pas (" + e.message + "). " +
        "Les actions préparent la ligne ou l'instruction à appliquer dans le Sheet. Les clients suspendus n'apparaissent pas.";
    }).then(afficherTable);
  }

  /* ---------- Tableau ---------- */
  function filtrer() {
    var q = $("recherche").value.trim().toLowerCase(), s = $("filtre-statut").value, e = $("filtre-etat").value;
    return etat.clients.filter(function (c) {
      if (q && txt(c.nom).toLowerCase().indexOf(q) < 0 && txt(c.notes).toLowerCase().indexOf(q) < 0) return false;
      if (s && txt(c.statutMake).toLowerCase() !== s.toLowerCase()) return false;
      if (e && c.etat !== e) return false;
      return true;
    });
  }
  function bouton(libelle, fn, sec) { var b = el("button", { type: "button", className: "mini" + (sec ? " secondaire" : ""), textContent: libelle }); b.addEventListener("click", fn); return b; }

  function afficherTable() {
    var tb = $("table-clients").querySelector("tbody"); tb.innerHTML = "";
    var liste = filtrer();
    liste.forEach(function (c) {
      var admin = /^ADMIN/i.test(txt(c.nom).trim());
      var lien = c.sheetUrl ? el("a", { href: c.sheetUrl, target: "_blank", rel: "noopener", textContent: "Ouvrir" }) : el("span", { textContent: "—" });
      var actions = el("td");
      actions.appendChild(bouton("Aperçu", function () { apercu(c); }, true));
      if (!admin) {
        actions.appendChild(bouton("Statut", function () { changerStatut(c); }, true));
        actions.appendChild(c.etat === "Suspendu" ? bouton("Réactiver", function () { agir("reactiver", c); }) : bouton("Suspendre", function () { agir("suspendre", c); }, true));
        actions.appendChild(bouton("Supprimer", function () { agir("supprimer", c); }, true));
      }
      tb.appendChild(el("tr", {}, [
        el("td", { textContent: txt(c.nom) + (admin ? " (admin)" : "") }),
        el("td", { textContent: txt(c.statutMake) || "—" }),
        el("td", {}, [lien]),
        el("td", { textContent: c.etat, className: c.etat === "Suspendu" ? "suspendu" : "" }),
        el("td", { textContent: txt(c.majLe) || "—" }),
        actions
      ]));
    });
    $("compte-clients").textContent = liste.length + " / " + etat.clients.length + " ligne(s)";
  }

  function apercu(c) {
    var box = $("apercu-contenu"); box.innerHTML = "";
    box.appendChild(el("p", { className: "etiquette", textContent: "Espace client" }));
    box.appendChild(el("h2", { textContent: txt(c.nom) }));
    if (c.sheetUrl) box.appendChild(el("a", { className: "bouton", href: c.sheetUrl, target: "_blank", rel: "noopener", textContent: "Ouvrir mon tableau de suivi" }));
    var s = window.__espaceClient.STATUTS[txt(c.statutMake).trim().toLowerCase()] || { libelle: c.statutMake || "Non renseigné", classe: "prep", detail: "" };
    box.appendChild(el("p", {}, [el("span", { className: "badge " + s.classe, textContent: s.libelle })]));
    box.appendChild(el("p", { className: "petit", textContent: s.detail + (c.majLe ? " Dernière mise à jour : " + c.majLe : "") }));
    if (c.etat === "Suspendu") box.appendChild(el("p", { className: "erreur", textContent: "Accès suspendu : ce client ne peut pas se connecter actuellement." }));
    $("apercu").hidden = false;
  }

  function instruction(action, c, extra) {
    var base = "Sheet des codes, onglet privé « Codes d'accès », ligne du client « " + c.nom + " » : ";
    if (action === "suspendre") return base + "écrire « Suspendu » en colonne G (État), puis menu Espace client > Mettre à jour la publication.";
    if (action === "reactiver") return base + "écrire « Actif » en colonne G (État), puis menu Espace client > Mettre à jour la publication.";
    if (action === "supprimer") return base + "effacer toute la ligne (A à G), puis menu Espace client > Mettre à jour la publication.";
    if (action === "statut") return base + "mettre « " + extra + " » en colonne D (Statut Make).";
  }

  function agir(action, c, extra) {
    var noms = { suspendre: "Suspendre", reactiver: "Réactiver", supprimer: "Supprimer définitivement", statut: "Changer le statut de" };
    if (action !== "statut" && !confirm(noms[action] + " « " + c.nom + " » ?")) return;
    if (etat.api) {
      appelApi(action, { empreinte: c.empreinte, statutMake: extra }).then(function (j) {
        etat.clients = j.clients; afficherTable(); journaliser(noms[action] + " « " + c.nom + " »" + (extra ? " → " + extra : "") + " (écrit dans le Sheet)");
      }).catch(function (e) { alert("Échec : " + e.message); });
    } else {
      var t = instruction(action, c, extra);
      copier(t); alert("Mode copier-coller — instruction copiée :\n\n" + t);
      journaliser("Préparé : " + noms[action] + " « " + c.nom + " »" + (extra ? " → " + extra : ""));
    }
  }
  function changerStatut(c) {
    var v = prompt("Nouveau statut Make pour « " + c.nom + " » (Actif, En pause, En préparation) :", c.statutMake || "");
    if (v === null) return;
    v = v.trim(); var ok = ["Actif", "En pause", "En préparation"].filter(function (s) { return s.toLowerCase() === v.toLowerCase(); })[0];
    if (!ok) { alert("Statut non reconnu."); return; }
    agir("statut", c, ok);
  }

  /* ---------- Nouveau client ---------- */
  async function preparer() {
    var err = $("n-erreur"); err.textContent = "";
    var nom = $("n-nom").value.trim(), code = $("n-code").value, sheet = $("n-sheet").value.trim();
    if (!nom) { err.textContent = "Indiquez le nom du client."; return; }
    if (/^ADMIN/i.test(nom)) { err.textContent = "Un nom commençant par « ADMIN » donnerait les droits admin : choisissez un autre nom."; return; }
    if (window.normaliserCode(code).length < 6) { err.textContent = "Choisissez un code d'au moins 6 caractères (10 ou plus conseillé)."; return; }
    var h = await window.hacherCode(code);
    if (etat.clients.some(function (c) { return c.empreinte === h; })) { err.textContent = "Ce code est déjà utilisé par un autre client."; return; }
    var statut = $("n-statut").value, notes = $("n-notes").value.trim();
    $("n-empreinte").textContent = h;
    $("n-ligne").value = [nom, window.normaliserCode(code), sheet, statut, aujourdhui(), notes, "Actif"].join("\t");
    $("n-resultat").hidden = false;
    if (etat.api) {
      try {
        var j = await appelApi("creer", { nom: nom, code: code, sheetUrl: sheet, statutMake: statut, notes: notes });
        etat.clients = j.clients; afficherTable();
        err.textContent = ""; $("n-force").textContent = "Session créée dans le Sheet. Le site la prendra en compte sous 5 min environ.";
        journaliser("Session créée pour « " + nom + " » (écrite dans le Sheet)");
      } catch (e) { err.textContent = "Échec de l'écriture (" + e.message + ") : collez la ligne ci-dessous dans le Sheet."; journaliser("Session préparée pour « " + nom + " » (écriture échouée)"); }
    } else {
      err.textContent = "Mode copier-coller : collez la ligne ci-dessous dans une ligne vide de l'onglet privé, puis menu Espace client > Mettre à jour la publication.";
      journaliser("Session préparée pour « " + nom + " » (à coller)");
    }
    $("n-code").value = ""; // on n'affiche plus le code au-delà de la ligne à coller
  }

  function copier(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).catch(function () {});
  }

  function exporterCSV() {
    var q = function (v) { v = txt(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lignes = [["Nom", "Statut Make", "Lien Sheet", "Accès", "Mis à jour"]].concat(filtrer().map(function (c) { return [c.nom, c.statutMake, c.sheetUrl, c.etat, c.majLe]; }));
    var blob = new Blob(["\ufeff" + lignes.map(function (l) { return l.map(q).join(","); }).join("\r\n")], { type: "text/csv;charset=utf-8" });
    var a = el("a", { href: URL.createObjectURL(blob), download: "clients-espace-client.csv" });
    document.body.appendChild(a); a.click(); a.remove();
    journaliser("Export CSV de " + (lignes.length - 1) + " client(s)");
  }

  /* ---------- Navigation ---------- */
  function onglet(nom) {
    document.querySelectorAll(".onglets button").forEach(function (b) { b.classList.toggle("actif", b.getAttribute("data-onglet") === nom); });
    document.querySelectorAll("[data-panneau]").forEach(function (p) { p.hidden = p.getAttribute("data-panneau") !== nom; });
  }
  function ouvrir() {
    $("vue-tableau").hidden = true; $("vue-admin").hidden = false;
    onglet("clients"); afficherJournal(); charger();
  }
  function fermer() { var v = $("vue-admin"); if (v) v.hidden = true; }
  function retour() { fermer(); $("vue-tableau").hidden = false; }

  document.addEventListener("DOMContentLoaded", function () {
    $("ouvrir-admin").addEventListener("click", ouvrir);
    $("fermer-admin").addEventListener("click", retour);
    document.querySelectorAll(".onglets button").forEach(function (b) { b.addEventListener("click", function () { onglet(b.getAttribute("data-onglet")); }); });
    ["recherche", "filtre-statut", "filtre-etat"].forEach(function (id) { $(id).addEventListener("input", afficherTable); });
    $("rafraichir").addEventListener("click", function () { window.__espaceClient.chargerListe().then(charger); });
    $("export-csv").addEventListener("click", exporterCSV);
    $("fermer-apercu").addEventListener("click", function () { $("apercu").hidden = true; });
    $("n-code").addEventListener("input", function () { afficherForce($("n-code"), $("n-force")); });
    $("n-preparer").addEventListener("click", preparer);
    $("n-copier").addEventListener("click", function () { copier($("n-ligne").value); journaliser("Ligne copiée"); });
    $("t-code").addEventListener("input", async function () {
      afficherForce($("t-code"), $("t-force"));
      $("t-empreinte").textContent = window.normaliserCode($("t-code").value) ? await window.hacherCode($("t-code").value) : "";
    });
    $("vider-journal").addEventListener("click", function () { if (confirm("Vider le journal ?")) { localStorage.removeItem(CLE_JOURNAL); afficherJournal(); } });
  });

  window.__admin = {
    connecte: function (estAdmin) { if (!estAdmin) fermer(); },
    fermer: fermer, forceCode: forceCode, instruction: instruction
  };
})();
