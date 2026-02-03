/* ═══════════════════════════════════════════════════════════════════
   SYSTÈME QCM INTERACTIF — PHASES 1 · 2 · 3
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Configuration XP & Rangs ──────────────────────────────────── */
const RANGS = [
    { nom: "Débutant",  seuil: 0,    couleur: "#95a5a6" },
    { nom: "Bronze",    seuil: 500,  couleur: "#cd7f32" },
    { nom: "Argent",    seuil: 1000, couleur: "#c0c0c0" },
    { nom: "Or",        seuil: 1500, couleur: "#ffd700" },
    { nom: "Platine",   seuil: 2000, couleur: "#e5e4e2" },
    { nom: "Diamant",   seuil: 2500, couleur: "#b9f2ff" },
    { nom: "Légende",   seuil: 3000, couleur: "#ff6b6b" }
];

const XP_PAR_DIFFICULTE        = { 1: 50, 2: 100, 3: 150 };
const MALUS_MAUVAISE_REPONSE   = -20;
const MALUS_PAR_10S            = -5;
const BONUS_TEMPS_MULTIPLICATEUR = 2;

/* ─── Clés localStorage ────────────────────────────────────────── */
const CLE_LISTE_PROFILS = "qcm_liste_profils";  // Liste des noms de profils
const CLE_PROFIL_ACTIF  = "qcm_profil_actif";   // Nom du profil actuellement connecté
// Pour chaque profil: `qcm_profil_${nom}` et `qcm_historique_${nom}`

/* ─── État global ───────────────────────────────────────────────── */
let timerInterval   = null;
let secondes        = 0;
let timerArrete     = false;
let comboActuel     = 0;
let bonusComboTotal = 0;
let sonActive       = true;

/* ─── Résultats de la dernière partie (utilisés pour l'écran fin) ─ */
let dernierResultat = null;

/* ─── Sons (fichiers audio externes) ────────────────────────────── */
const sons = {
    clic:           new Audio('sounds/click.wav'),
    correct:        new Audio('sounds/correct.wav'),
    bonusDifficile: new Audio('sounds/bonus_difficult.wav'),
    incorrect:      new Audio('sounds/incorrect.wav'),
    hover:          new Audio('sounds/hover.wav'),
    tick:           new Audio('sounds/tick.wav'),
    timeAlert:      new Audio('sounds/time_alert.wav'),
    rankUp:         new Audio('sounds/rank_up.wav'),
    combo3:         new Audio('sounds/combo_3.wav'),
    combo5:         new Audio('sounds/combo_5.wav'),
    combo10:        new Audio('sounds/combo_10.wav'),
    statAnimation:  new Audio('sounds/stat_animation.wav')
};

// Volume par défaut pour chaque son
let volumeGlobal = 0.3; // valeur initiale (30%)
let alerteTempsJouee = false; // flag pour ne jouer l'alerte qu'une fois
let tempsRestant = 0; // pour le système de compte à rebours

// Appliquer le volume initial
Object.values(sons).forEach(s => { 
    s.volume = volumeGlobal; 
    s.load(); 
});

function jouerSon(type, volumeOverride = null) {
    if (!sonActive) return;
    try {
        const son = sons[type];
        if (!son) return;
        
        son.currentTime = 0;
        son.volume = volumeOverride !== null ? volumeOverride : volumeGlobal;
        son.play().catch(() => {});
    } catch (e) { /* silencieux */ }
}

function toggleMute() {
    sonActive = !sonActive;
    const btn = document.getElementById('btn-mute');
    btn.textContent = sonActive ? '🔊' : '🔇';
    btn.title       = sonActive ? 'Désactiver les sons' : 'Activer les sons';
}

function updateVolume(value) {
    volumeGlobal = value / 100; // convertir 0-100 en 0-1
    Object.values(sons).forEach(s => s.volume = volumeGlobal);
    
    // Mettre à jour l'affichage du pourcentage
    const volumeLabel = document.getElementById('volume-label');
    if (volumeLabel) {
        volumeLabel.textContent = `${value}%`;
    }
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 2 — PROFIL & localStorage
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Charger / sauvegarder les profils (multi-utilisateurs) ───── */

// Liste de tous les profils disponibles
function chargerListeProfils() {
    try {
        const raw = localStorage.getItem(CLE_LISTE_PROFILS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function sauvegarderListeProfils(liste) {
    localStorage.setItem(CLE_LISTE_PROFILS, JSON.stringify(liste));
}

// Profil actif
function chargerProfilActif() {
    try {
        const nom = localStorage.getItem(CLE_PROFIL_ACTIF);
        return nom;
    } catch (e) { return null; }
}

function sauvegarderProfilActif(nom) {
    localStorage.setItem(CLE_PROFIL_ACTIF, nom);
}

// Données d'un profil spécifique
function chargerProfil(nom = null) {
    if (!nom) nom = chargerProfilActif();
    if (!nom) return null;
    
    try {
        const raw = localStorage.getItem(`qcm_profil_${nom}`);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function sauvegarderProfil(profil) {
    if (!profil || !profil.nom) return;
    
    // Sauvegarder le profil
    localStorage.setItem(`qcm_profil_${profil.nom}`, JSON.stringify(profil));
    
    // Ajouter à la liste si nouveau
    const liste = chargerListeProfils();
    if (!liste.includes(profil.nom)) {
        liste.push(profil.nom);
        sauvegarderListeProfils(liste);
    }
}

function supprimerProfil(nom) {
    // Supprimer le profil
    localStorage.removeItem(`qcm_profil_${nom}`);
    
    // Supprimer l'historique
    localStorage.removeItem(`qcm_historique_${nom}`);
    
    // Retirer de la liste
    const liste = chargerListeProfils();
    const index = liste.indexOf(nom);
    if (index > -1) {
        liste.splice(index, 1);
        sauvegarderListeProfils(liste);
    }
    
    // Si c'était le profil actif, le déconnecter
    if (chargerProfilActif() === nom) {
        localStorage.removeItem(CLE_PROFIL_ACTIF);
    }
}

// Historique d'un profil spécifique
function chargerHistorique(nom = null) {
    if (!nom) nom = chargerProfilActif();
    if (!nom) return [];
    
    try {
        const raw = localStorage.getItem(`qcm_historique_${nom}`);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function sauvegarderHistorique(historique, nom = null) {
    if (!nom) nom = chargerProfilActif();
    if (!nom) return;
    
    localStorage.setItem(`qcm_historique_${nom}`, JSON.stringify(historique));
}

/* ─── Initialisation au chargement de la page ─────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const liste = chargerListeProfils();
    const profilActif = chargerProfilActif();
    
    if (liste.length === 0) {
        // Aucun profil → afficher création
        afficherEcranCreation();
    } else if (!profilActif) {
        // Profils existent mais aucun actif → afficher sélection
        afficherEcranSelection();
    } else {
        // Profil actif existe → charger et afficher lancement
        const profil = chargerProfil(profilActif);
        if (profil) {
            afficherEcranLancement(profil);
        } else {
            // Profil actif invalide, retour sélection
            afficherEcranSelection();
        }
    }
});

/* ─── Affichage des différents écrans ──────────────────────────── */
function afficherEcranCreation() {
    document.getElementById('ecran-selection-profil')?.classList.add('masque');
    document.getElementById('ecran-creation-profil').classList.remove('masque');
    document.getElementById('ecran-lancement').classList.add('masque');
    document.getElementById('ecran-qcm').classList.add('masque');
    document.getElementById('ecran-fin').classList.add('masque');
}

function afficherEcranSelection() {
    // Masquer tous les autres écrans
    document.getElementById('ecran-creation-profil').classList.add('masque');
    document.getElementById('ecran-lancement').classList.add('masque');
    document.getElementById('ecran-qcm').classList.add('masque');
    document.getElementById('ecran-fin').classList.add('masque');
    
    // Créer ou afficher l'écran de sélection
    let ecranSelection = document.getElementById('ecran-selection-profil');
    if (!ecranSelection) {
        ecranSelection = creerEcranSelection();
        document.body.insertBefore(ecranSelection, document.body.firstChild);
    }
    
    // Mettre à jour la liste des profils
    actualiserListeProfils();
    ecranSelection.classList.remove('masque');
}

function afficherEcranLancement(profil) {
    document.getElementById('ecran-selection-profil')?.classList.add('masque');
    document.getElementById('ecran-creation-profil').classList.add('masque');
    document.getElementById('ecran-lancement').classList.remove('masque');
    document.getElementById('ecran-qcm').classList.add('masque');
    document.getElementById('ecran-fin').classList.add('masque');
    
    metterAjourAffichageProfil(profil);
}

/* ─── Créer l'écran de sélection de profil ────────────────────── */
function creerEcranSelection() {
    const ecran = document.createElement('div');
    ecran.id = 'ecran-selection-profil';
    ecran.className = 'masque';
    
    ecran.innerHTML = `
        <div class="carte carte-lancement carte-selection">
            <h1>🎮 Sélectionnez un profil</h1>
            <p class="sous-titre">Choisissez votre aventurier ou créez-en un nouveau !</p>
            
            <div id="liste-profils-selection" class="liste-profils-selection">
                <!-- Rempli dynamiquement -->
            </div>
            
            <button class="btn-principal btn-nouveau-profil" onclick="afficherEcranCreation()">
                ➕ Créer un nouveau profil
            </button>
        </div>
    `;
    
    return ecran;
}

/* ─── Actualiser la liste des profils affichés ─────────────────── */
function actualiserListeProfils() {
    const container = document.getElementById('liste-profils-selection');
    if (!container) return;
    
    const liste = chargerListeProfils();
    
    if (liste.length === 0) {
        container.innerHTML = '<p class="texte-vide">Aucun profil disponible.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    liste.forEach(nom => {
        const profil = chargerProfil(nom);
        if (!profil) return;
        
        const rang = obtenirRang(profil.xpTotal);
        const historique = chargerHistorique(nom);
        const nbParties = historique.length;
        
        const carte = document.createElement('div');
        carte.className = 'carte-profil-selection';
        carte.innerHTML = `
            <div class="profil-selection-infos" onclick="selectionnerProfil('${nom}')">
                <span class="avatar-selection">${profil.avatar}</span>
                <div class="profil-selection-details">
                    <h3>${profil.nom}</h3>
                    <div class="profil-selection-stats">
                        <span class="badge-rang-mini" style="background: ${rang.couleur}; color: ${estCouleurSombre(rang.couleur) ? '#fff' : '#2c3e50'}">${rang.nom}</span>
                        <span class="stat-mini">✨ ${profil.xpTotal} XP</span>
                        <span class="stat-mini">🎮 ${nbParties} parties</span>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(carte);
    });
}

/* ─── Sélectionner un profil depuis l'écran de sélection ────────── */
function selectionnerProfil(nom) {
    jouerSon('clic');
    
    const profil = chargerProfil(nom);
    if (!profil) {
        alert('Erreur : profil introuvable.');
        return;
    }
    
    sauvegarderProfilActif(nom);
    afficherEcranLancement(profil);
}

/* ─── Validation des champs de création / modification ─────────── */
function validerChampsProfil() {
    // Déterminer quel input est actif (création ou modification)
    const inputCreation = document.getElementById('input-nom-profil');
    const inputModif    = document.getElementById('input-nom-modif');
    const btnCreer      = document.getElementById('btn-creer-profil');

    // Création
    if (inputCreation && btnCreer) {
        const nom = inputCreation.value.trim();
        const avatarSel = document.querySelector('#grille-avatars .btn-avatar.sélectionné');
        btnCreer.disabled = !(nom.length > 0 && avatarSel);
    }
}

/* ─── Sélection d'avatar (écran création) ──────────────────────── */
function selectionnerAvatar(btn) {
    document.querySelectorAll('#grille-avatars .btn-avatar').forEach(b => b.classList.remove('sélectionné'));
    btn.classList.add('sélectionné');
    validerChampsProfil();
}

/* ─── Sélection d'avatar (modal modification) ──────────────────── */
function selectionnerAvatarModif(btn) {
    document.querySelectorAll('#grille-avatars-modif .btn-avatar').forEach(b => b.classList.remove('sélectionné'));
    btn.classList.add('sélectionné');
}

/* ─── Créer le profil ──────────────────────────────────────────── */
function creerProfil() {
    const nom    = document.getElementById('input-nom-profil').value.trim();
    const avatar = document.querySelector('#grille-avatars .btn-avatar.sélectionné')?.getAttribute('data-avatar');
    if (!nom || !avatar) return;
    
    // Vérifier si le nom existe déjà
    const liste = chargerListeProfils();
    if (liste.includes(nom)) {
        alert(`Le profil "${nom}" existe déjà. Choisissez un autre nom.`);
        return;
    }

    const profil = { nom, avatar, xpTotal: 0 };
    sauvegarderProfil(profil);
    sauvegarderProfilActif(nom);

    // Transition écrans
    afficherEcranLancement(profil);
    
    // Réinitialiser le formulaire
    document.getElementById('input-nom-profil').value = '';
    document.querySelectorAll('#grille-avatars .btn-avatar').forEach(b => b.classList.remove('sélectionné'));
}

/* ─── Mettre à jour tous les éléments d'affichage du profil ─────── */
function metterAjourAffichageProfil(profil) {
    const rang = obtenirRang(profil.xpTotal);

    // Écran lancement
    document.getElementById('lancement-avatar').textContent = profil.avatar;
    document.getElementById('lancement-nom').textContent    = profil.nom;

    // Panneau profil
    document.getElementById('panneau-avatar').textContent    = profil.avatar;
    document.getElementById('panneau-nom').textContent       = profil.nom;
    document.getElementById('panneau-xp-total').textContent  = profil.xpTotal;
    metterAjourRangAffichage('panneau-rang-badge', 'panneau-rang-nom', rang);

    // Barre progression
    metterAjourProgressionAffichage(profil.xpTotal, 'prog-rang-courant', 'prog-xp-texte', 'prog-rang-suivant', 'jauge-progression-remplissage');
}

/* ─── Mettre à jour le badge + nom de rang ─────────────────────── */
function metterAjourRangAffichage(idBadge, idNom, rang) {
    const badge = document.getElementById(idBadge);
    const nom   = document.getElementById(idNom);
    if (badge) {
        badge.textContent = rang.nom;
        badge.style.background = rang.couleur;
        // Contraste : texte blanc si couleur sombre
        badge.style.color = estCouleurSombre(rang.couleur) ? '#fff' : '#2c3e50';
    }
    if (nom) {
        nom.textContent = rang.nom;
        nom.style.color = rang.couleur;
    }
}

/* ─── Mettre à jour la barre de progression ────────────────────── */
function metterAjourProgressionAffichage(xpActuel, idCourant, idTexte, idSuivant, idJauge) {
    const rangCourant = obtenirRang(xpActuel);
    const indexCourant = RANGS.indexOf(rangCourant);
    const rangSuivant  = indexCourant < RANGS.length - 1 ? RANGS[indexCourant + 1] : null;

    document.getElementById(idCourant).textContent = rangCourant.nom;

    if (rangSuivant) {
        const xpRestant = rangSuivant.seuil - xpActuel;
        const xpTraanche = rangSuivant.seuil - rangCourant.seuil;
        const pct = Math.min(100, ((xpActuel - rangCourant.seuil) / xpTraanche) * 100);

        document.getElementById(idTexte).textContent   = `${xpActuel} / ${rangSuivant.seuil} XP`;
        document.getElementById(idSuivant).textContent = rangSuivant.nom;
        document.getElementById(idJauge).style.width   = pct + '%';
    } else {
        // Rang maximal atteint
        document.getElementById(idTexte).textContent   = `${xpActuel} XP — Rang maximal !`;
        document.getElementById(idSuivant).textContent = '🏆';
        document.getElementById(idJauge).style.width   = '100%';
    }
}

/* ─── Ouvrir le panneau profil ─────────────────────────────────── */
function ouvrirPanneau() {
    const profil = chargerProfil();
    if (profil) metterAjourAffichageProfil(profil);
    chargerOnglet('profil'); // forcer rafraîchi
    document.getElementById('panneau-profil').classList.remove('masque');
}

/* ─── Fermer le panneau profil ─────────────────────────────────── */
function fermerPanneau() {
    document.getElementById('panneau-profil').classList.add('masque');
}

/* ─── Changer d'onglet dans le panneau ─────────────────────────── */
function changerOnglet(onglet) {
    // Désactiver tous les onglets
    document.querySelectorAll('.onglet').forEach(btn => btn.classList.remove('actif'));
    document.querySelectorAll('.contenu-onglet').forEach(div => div.classList.add('masque'));

    // Activer le bon
    document.querySelector(`.onglet[data-onglet="${onglet}"]`).classList.add('actif');
    document.getElementById(`onglet-${onglet}`).classList.remove('masque');

    // Charger le contenu dynamique
    chargerOnglet(onglet);
}

function chargerOnglet(onglet) {
    if (onglet === 'historique') chargerHistoriqueAffichage();
    if (onglet === 'leaderboard') chargerLeaderboardAffichage();
}

/* ─── Charger l'affichage de l'historique ──────────────────────── */
function chargerHistoriqueAffichage() {
    const historique = chargerHistorique();
    const container  = document.getElementById('liste-historique');

    if (historique.length === 0) {
        container.innerHTML = '<p class="texte-vide">Aucune partie jouée pour le moment.</p>';
        return;
    }

    container.innerHTML = '';
    // Du plus récent au plus ancien
    [...historique].reverse().forEach(partie => {
        const date = new Date(partie.date);
        const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const rang = obtenirRang(partie.xpGagnee);

        container.innerHTML += `
            <div class="carte-historique">
                <div>
                    <div class="historique-score">${partie.score} / ${partie.total}</div>
                    <div class="historique-date">${dateStr} — ⏱️ ${partie.temps}</div>
                </div>
                <div style="text-align:right;">
                    <div class="historique-xp">+${partie.xpGagnee} XP</div>
                    <div class="historique-rang">${rang.nom}</div>
                </div>
            </div>`;
    });
}

/* ─── Charger l'affichage du leaderboard (top 5 par XP gagnée) ── */
function chargerLeaderboardAffichage() {
    const historique = chargerHistorique();
    const container  = document.getElementById('liste-leaderboard');

    if (historique.length === 0) {
        container.innerHTML = '<p class="texte-vide">Aucune partie jouée pour le moment.</p>';
        return;
    }

    // Trier par XP gagnée décroissant, garder top 5
    const top5 = [...historique].sort((a, b) => b.xpGagnee - a.xpGagnee).slice(0, 5);
    const medaillons = ['🥇', '🥈', '🥉'];

    container.innerHTML = '';
    top5.forEach((partie, i) => {
        const pos = i + 1;
        let posClass = '';
        if (i === 0) posClass = 'or';
        else if (i === 1) posClass = 'argent';
        else if (i === 2) posClass = 'bronze';

        container.innerHTML += `
            <div class="carte-leaderboard">
                <span class="leaderboard-pos ${posClass}">${i < 3 ? medaillons[i] : pos}</span>
                <div class="leaderboard-infos">
                    <div class="leaderboard-score">${partie.score} / ${partie.total} — ⏱️ ${partie.temps}</div>
                </div>
                <span class="leaderboard-xp">+${partie.xpGagnee} XP</span>
            </div>`;
    });
}

/* ─── Ouvrir / fermer modal modification de profil ─────────────── */
function ouvrirModificationProfil() {
    const profil = chargerProfil();
    if (!profil) return;

    document.getElementById('input-nom-modif').value = profil.nom;
    // Marquer l'avatar actuel
    document.querySelectorAll('#grille-avatars-modif .btn-avatar').forEach(btn => {
        btn.classList.toggle('sélectionné', btn.getAttribute('data-avatar') === profil.avatar);
    });

    document.getElementById('modal-modification-profil').classList.remove('masque');
}

function fermerModificationProfil() {
    document.getElementById('modal-modification-profil').classList.add('masque');
}

function sauvegarderModificationProfil() {
    const nom    = document.getElementById('input-nom-modif').value.trim();
    const avatarBtn = document.querySelector('#grille-avatars-modif .btn-avatar.sélectionné');
    if (!nom || !avatarBtn) return;

    const profil  = chargerProfil();
    const ancienNom = profil.nom;
    
    // Si le nom a changé, vérifier qu'il n'existe pas déjà
    if (nom !== ancienNom) {
        const liste = chargerListeProfils();
        if (liste.includes(nom)) {
            alert(`Le profil "${nom}" existe déjà. Choisissez un autre nom.`);
            return;
        }
        
        // Supprimer l'ancien profil et créer le nouveau
        const historique = chargerHistorique(ancienNom);
        supprimerProfil(ancienNom);
        
        profil.nom = nom;
        profil.avatar = avatarBtn.getAttribute('data-avatar');
        sauvegarderProfil(profil);
        sauvegarderHistorique(historique, nom);
        sauvegarderProfilActif(nom);
    } else {
        // Juste modification de l'avatar
        profil.avatar = avatarBtn.getAttribute('data-avatar');
        sauvegarderProfil(profil);
    }
    
    metterAjourAffichageProfil(profil);

    fermerModificationProfil();
    fermerPanneau(); // on revient à l'écran lancement propre
}

/* ─── Déconnecter le profil actuel ──────────────────────────────── */
function deconnecterProfil() {
    jouerSon('clic');
    
    // Fermer le panneau
    fermerPanneau();
    
    // Déconnecter (retirer le profil actif)
    localStorage.removeItem(CLE_PROFIL_ACTIF);
    
    // Afficher l'écran de sélection
    const liste = chargerListeProfils();
    if (liste.length > 0) {
        afficherEcranSelection();
    } else {
        afficherEcranCreation();
    }
}

/* ─── Confirmer la suppression du profil ────────────────────────── */
function confirmerSuppressionProfil() {
    const profil = chargerProfil();
    if (!profil) return;
    
    const confirmation = confirm(
        `⚠️ Êtes-vous sûr de vouloir supprimer définitivement le profil "${profil.nom}" ?\n\n` +
        `Toutes les données (XP, historique, scores) seront perdues.\n\n` +
        `Cette action est irréversible.`
    );
    
    if (!confirmation) return;
    
    jouerSon('clic');
    
    // Supprimer le profil
    supprimerProfil(profil.nom);
    
    // Fermer le panneau
    fermerPanneau();
    
    // Rediriger vers sélection ou création
    const liste = chargerListeProfils();
    if (liste.length > 0) {
        afficherEcranSelection();
    } else {
        afficherEcranCreation();
    }
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 1 — TIMER, QCM, XP, RANGS
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Calcul du rang actuel ────────────────────────────────────── */
function obtenirRang(xp) {
    for (let i = RANGS.length - 1; i >= 0; i--) {
        if (xp >= RANGS[i].seuil) return RANGS[i];
    }
    return RANGS[0];
}

/* ─── Démarrer le QCM ──────────────────────────────────────────── */
function demarrerQCM() {
    jouerSon('clic');

    document.getElementById('ecran-lancement').classList.add('masque');
    document.getElementById('ecran-qcm').classList.remove('masque');

    // Reset état
    secondes        = 0;
    timerArrete     = false;
    comboActuel     = 0;
    bonusComboTotal = 0;
    dernierResultat = null;
    alerteTempsJouee = false; // Reset de l'alerte temps
    tempsRestant    = 0;

    // Reset visuels des cartes (au cas où on rejoit)
    document.querySelectorAll('#ecran-qcm .carte').forEach(carte => {
        carte.classList.remove('correct', 'incorrect');
    });
    document.querySelectorAll('#ecran-qcm input[type="radio"]').forEach(input => {
        input.checked = false;
    });
    document.getElementById('combo-indicator').classList.add('masque');

    majAffichageTimer();
    timerInterval = setInterval(tickTimer, 1000);
}

/* ─── Tick du timer ────────────────────────────────────────────── */
function tickTimer() {
    secondes++;
    majAffichageTimer();
    
    // Gestion du compte à rebours (estimation basée sur le temps moyen par question)
    const cartes = document.querySelectorAll('#ecran-qcm .container .carte');
    const nbQuestions = cartes.length;
    const tempsEstimeTotal = nbQuestions * 20; // 20s par question en moyenne
    tempsRestant = Math.max(0, tempsEstimeTotal - secondes);
    
    // Alerte à 10 secondes restantes (une seule fois)
    if (tempsRestant === 10 && !alerteTempsJouee) {
        jouerSon('timeAlert');
        alerteTempsJouee = true;
    }
    
    // Tick pour les 10 dernières secondes
    if (tempsRestant > 0 && tempsRestant <= 10) {
        jouerSon('tick');
    }
    
    if (secondes > 60) {
        document.getElementById('timer-valeur').classList.add('urgent');
    }
}

/* ─── Mise à jour de l'affichage du timer ──────────────────────── */
function majAffichageTimer() {
    const min = Math.floor(secondes / 60).toString().padStart(2, '0');
    const sec = (secondes % 60).toString().padStart(2, '0');
    document.getElementById('timer-valeur').textContent = min + ':' + sec;
}

/* ─── Arrêter le timer ─────────────────────────────────────────── */
function arreterTimer() {
    if (!timerArrete) {
        clearInterval(timerInterval);
        timerArrete = true;
    }
}

/* ─── Vérification automatique (toutes les réponses choisies) ──── */
function verifierAutomatic() {
    jouerSon('clic');

    const cartes = document.querySelectorAll('#ecran-qcm .container .carte');
    let toutesRepondues = true;
    cartes.forEach((carte, i) => {
        if (!document.querySelector(`input[name="question${i}"]:checked`)) toutesRepondues = false;
    });

    // On n'arrête PAS le timer ici — le joueur doit quand même cliquer "Vérifier"
    // (comportement volontaire : le temps continue jusqu'à la validation)
}

/* ─── Calcul de l'XP gagnée ────────────────────────────────────── */
function calculerXP(cartes) {
    let xpTotal = 0;
    let detailsXP = [];
    let bonnesReponses = 0;
    comboActuel = 0;       // reset pour le calcul séquentiel
    bonusComboTotal = 0;

    // BUG FIX Phase 0 : temps par question = temps global / nombre de questions
    const nbQuestions  = cartes.length;
    const tempsMoyen   = nbQuestions > 0 ? Math.round(secondes / nbQuestions) : 0;

    cartes.forEach((carte, index) => {
        const bonneReponse  = carte.getAttribute('data-bonne-reponse');
        const xpBase        = parseInt(carte.getAttribute('data-xp-base'))        || 100;
        const tempsOptimal  = parseInt(carte.getAttribute('data-temps-optimal'))  || 20;
        const reponseSelectionnee = document.querySelector(`input[name="question${index}"]:checked`);

        let xpQuestion = 0;
        let detail = {
            question:    index + 1,
            xpBase:      0,
            bonusTemps:  0,
            malusTemps:  0,
            bonusCombo:  0,
            malusErreur: 0,
            total:       0,
            correcte:    false,
            reponseChoisie: reponseSelectionnee ? reponseSelectionnee.value : null,
            bonneReponse:   bonneReponse
        };

        if (reponseSelectionnee && reponseSelectionnee.value.trim() === bonneReponse.trim()) {
            // ── Bonne réponse ──
            detail.correcte = true;
            bonnesReponses++;
            comboActuel++;
            xpQuestion += xpBase;
            detail.xpBase = xpBase;

            // Bonus / malus temps (basé sur tempsMoyen vs tempsOptimal)
            if (tempsMoyen < tempsOptimal) {
                const bonusTemps = Math.floor((tempsOptimal - tempsMoyen) * BONUS_TEMPS_MULTIPLICATEUR);
                xpQuestion      += bonusTemps;
                detail.bonusTemps = bonusTemps;
            } else if (tempsMoyen > tempsOptimal) {
                const depassement = tempsMoyen - tempsOptimal;
                const tranches    = Math.floor(depassement / 10);
                const malusTemps  = tranches * MALUS_PAR_10S;   // négatif
                xpQuestion       += malusTemps;
                detail.malusTemps = malusTemps;
            }

            // Bonus combo
            let multiplicateurCombo = 1;
            if      (comboActuel >= 5) multiplicateurCombo = 2;
            else if (comboActuel >= 3) multiplicateurCombo = 1.5;

            if (multiplicateurCombo > 1) {
                const bonusCombo    = Math.floor(xpBase * (multiplicateurCombo - 1));
                xpQuestion         += bonusCombo;
                detail.bonusCombo   = bonusCombo;
                bonusComboTotal    += bonusCombo;
            }

        } else {
            // ── Mauvaise réponse ou pas de réponse ──
            comboActuel     = 0;
            xpQuestion      = MALUS_MAUVAISE_REPONSE;
            detail.malusErreur = MALUS_MAUVAISE_REPONSE;
        }

        detail.total  = xpQuestion;
        detailsXP.push(detail);
        xpTotal      += xpQuestion;
    });

    xpTotal = Math.max(0, xpTotal);   // pas de XP négatif

    return { xpTotal, detailsXP, bonnesReponses, comboMax: comboActuel };
}

/* ─── Vérifier les réponses (bouton "Vérifier mes réponses") ──── */
function verifierReponses() {
    jouerSon('clic');
    arreterTimer();

    const cartes = document.querySelectorAll('#ecran-qcm .container .carte');
    let score = 0;
    const total = cartes.length;
    let comboCount = 0;
    let maxCombo = 0;

    cartes.forEach((carte, index) => {
        const bonneReponse        = carte.getAttribute('data-bonne-reponse');
        const difficulte          = parseInt(carte.getAttribute('data-difficulte') || '2');
        const reponseSelectionnee = document.querySelector(`input[name="question${index}"]:checked`);

        carte.classList.remove('correct', 'incorrect');

        if (reponseSelectionnee && reponseSelectionnee.value.trim() === bonneReponse.trim()) {
            carte.classList.add('correct');
            score++;
            comboCount++;
            maxCombo = Math.max(maxCombo, comboCount);
            
            // Son de bonne réponse + bonus si difficile
            if (difficulte === 3) {
                jouerSon('bonusDifficile');
            } else {
                jouerSon('correct');
            }
            
            anime({ targets: carte, scale: [1, 1.02, 1], duration: 400, easing: 'easeOutElastic(1, .6)' });
        } else {
            carte.classList.add('incorrect');
            comboCount = 0; // Reset combo
            jouerSon('incorrect');
            anime({ targets: carte, translateX: [0, -10, 10, -10, 10, 0], duration: 400, easing: 'easeInOutSine' });
        }
    });

    // Sons de combo (joués après un délai pour ne pas se chevaucher)
    setTimeout(() => {
        if (maxCombo >= 10) {
            jouerSon('combo10');
        } else if (maxCombo >= 5) {
            jouerSon('combo5');
        } else if (maxCombo >= 3) {
            jouerSon('combo3');
        }
    }, 600);

    // Calcul XP
    const resultatXP = calculerXP(cartes);

    // Stocker le résultat pour l'écran fin
    dernierResultat = {
        score,
        total,
        xpGagnee:  resultatXP.xpTotal,
        detailsXP: resultatXP.detailsXP,
        comboMax:  resultatXP.comboMax,
        temps:     formatTemps(secondes)
    };

    // Délai avant d'afficher l'écran fin (laisser les animations carte se terminer)
    setTimeout(() => afficherEcranFin(), 900);
}

/* ─── Formater secondes en MM:SS ───────────────────────────────── */
function formatTemps(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return m + ':' + s;
}

/* ═══════════════════════════════════════════════════════════════════
   PHASE 3 — ÉCRAN FIN, OVERLAY RANG, REJOUER, PARTAGE
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Afficher l'écran de fin détaillé ─────────────────────────── */
function afficherEcranFin() {
    if (!dernierResultat) return;
    const { score, total, xpGagnee, detailsXP, temps } = dernierResultat;

    // Masquer le QCM, montrer l'écran fin
    document.getElementById('ecran-qcm').classList.add('masque');
    document.getElementById('ecran-fin').classList.remove('masque');
    // Scroller en haut
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // ── Titre selon le résultat ──
    let titre = '';
    if (score === total)      titre = '🎉 Parfait !';
    else if (score >= total / 2) titre = '👍 Bien joué !';
    else                      titre = '💪 Continuez !';
    document.getElementById('fin-titre-message').textContent = titre;

    // ── Temps ──
    document.getElementById('fin-temps').textContent = '⏱️ Temps : ' + temps;

    // ── Jauge correct / incorrect ──
    const incorrects = total - score;
    const pctVert  = total > 0 ? (score / total) * 100 : 0;
    const pctRouge = total > 0 ? (incorrects / total) * 100 : 0;
    document.getElementById('fin-label-correct').textContent   = `✓ Corrects : ${score}`;
    document.getElementById('fin-label-incorrect').textContent = `✗ Incorrects : ${incorrects}`;
    document.getElementById('fin-jauge-vert').style.width      = pctVert  + '%';
    document.getElementById('fin-jauge-rouge').style.width     = pctRouge + '%';

    // ── XP animé ──
    document.getElementById('fin-xp-anime').textContent = '0';
    anime({
        targets:  '#fin-xp-anime',
        innerHTML: [0, xpGagnee],
        round:    1,
        duration: 2000,
        easing:   'easeOutExpo'
    });

    // ── Rang ──
    const profil      = chargerProfil() || { xpTotal: 0 };
    const rangAvant   = obtenirRang(profil.xpTotal);
    const nouveauXP   = profil.xpTotal + xpGagnee;
    const rangApres   = obtenirRang(nouveauXP);

    document.getElementById('fin-rang-nom').textContent = rangApres.nom;
    document.getElementById('fin-rang-nom').style.color = rangApres.couleur;

    // ── Détails XP ──
    let htmlDetails = '<div class="details-xp"><h4>📊 Détails XP</h4><ul>';
    const totalBase       = detailsXP.reduce((s, d) => s + d.xpBase, 0);
    const totalBonusTemps = detailsXP.reduce((s, d) => s + d.bonusTemps, 0);
    const totalMalus      = detailsXP.reduce((s, d) => s + d.malusErreur + d.malusTemps, 0);

    htmlDetails += `<li>Questions correctes : +${totalBase} XP</li>`;
    if (totalBonusTemps > 0) htmlDetails += `<li>⏱️ Bonus temps : +${totalBonusTemps} XP</li>`;
    if (bonusComboTotal > 0) htmlDetails += `<li>🔥 Bonus combo : +${bonusComboTotal} XP</li>`;
    if (totalMalus < 0)      htmlDetails += `<li>⚠️ Malus : ${totalMalus} XP</li>`;
    htmlDetails += '</ul></div>';
    document.getElementById('fin-details-xp').innerHTML = htmlDetails;

    // ── Progression ──
    metterAjourProgressionAffichage(nouveauXP, 'fin-prog-courant', 'fin-prog-texte', 'fin-prog-suivant', 'fin-jauge-progression');

    // ── Récap par question ──
    let htmlRecap = '';
    detailsXP.forEach((d, i) => {
        const cls    = d.correcte ? 'correct' : 'incorrect';
        const icone  = d.correcte ? '✅' : '❌';
        const xpStr  = d.total >= 0 ? `+${d.total}` : `${d.total}`;

        htmlRecap += `
            <div class="recap-question ${cls}">
                <span class="recap-icone">${icone}</span>
                <div class="recap-contenu">
                    <div class="recap-titre">Q${i + 1}</div>
                    <div class="recap-reponse-choisie">Votre réponse : ${d.reponseChoisie || '<em>aucune</em>'}</div>
                    ${!d.correcte ? `<div class="recap-bonne-reponse">Bonne réponse : ${d.bonneReponse}</div>` : ''}
                </div>
                <span class="recap-xp">${xpStr} XP</span>
            </div>`;
    });
    document.getElementById('fin-recap-questions').innerHTML = htmlRecap;

    // ── Sauvegarder la partie dans l'historique ──
    const historique = chargerHistorique();
    historique.push({
        date:      new Date().toISOString(),
        score,
        total,
        xpGagnee,
        temps
    });
    sauvegarderHistorique(historique);

    // ── Mettre à jour le profil (XP total) ──
    if (profil) {
        profil.xpTotal = nouveauXP;
        sauvegarderProfil(profil);
        metterAjourAffichageProfil(profil);
    }

    // ── Animation montée de rang (si changement) ──
    if (rangAvant.nom !== rangApres.nom) {
        setTimeout(() => afficherOverlayMonteeRang(rangAvant, rangApres), 2200);
    }

    // Confettis si parfait
    if (score === total) {
        setTimeout(() => creerConfettis(), 500);
    }
}

/* ─── Overlay montée de rang ───────────────────────────────────── */
function afficherOverlayMonteeRang(rangAvant, rangApres) {
    // Jouer le son de célébration
    jouerSon('rankUp');
    
    document.getElementById('overlay-rang-ancien').textContent = rangAvant.nom;
    document.getElementById('overlay-rang-ancien').style.color = rangAvant.couleur;
    document.getElementById('overlay-rang-nouveau').textContent = rangApres.nom;
    document.getElementById('overlay-rang-nouveau').style.color = rangApres.couleur;
    document.getElementById('overlay-rang-nouveau').style.textShadow = `0 0 30px ${rangApres.couleur}`;

    // Particules
    creerParticulesRang(rangApres.couleur);

    document.getElementById('overlay-montee-rang').classList.remove('masque');
}

function fermerOverlayRang() {
    document.getElementById('overlay-montee-rang').classList.add('masque');
    // Nettoyer les particules
    document.getElementById('overlay-rang-particules').innerHTML = '';
}

function creerParticulesRang(couleurPrincipale) {
    const container = document.getElementById('overlay-rang-particules');
    container.innerHTML = '';
    const couleurs = [couleurPrincipale, '#ffd700', '#ffffff', '#ff6b6b', '#4ecdc4'];

    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particule';
        p.style.left            = Math.random() * 100 + 'vw';
        p.style.top             = '-20px';
        p.style.backgroundColor = couleurs[Math.floor(Math.random() * couleurs.length)];
        p.style.animationDelay  = Math.random() * 1.5 + 's';
        p.style.animationDuration = (1.8 + Math.random() * 1.5) + 's';
        p.style.width           = (8 + Math.random() * 10) + 'px';
        p.style.height          = p.style.width;
        container.appendChild(p);
    }
}

/* ─── Confettis (écran fin, score parfait) ─────────────────────── */
function creerConfettis() {
    const colors     = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'];
    const resultatDiv = document.getElementById('carte-fin-resultat') || document.querySelector('.carte-fin-resultat');
    if (!resultatDiv) return;

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left            = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay  = Math.random() * 3 + 's';
        resultatDiv.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

/* ─── Rejouer le QCM ───────────────────────────────────────────── */
function rejuerQCM() {
    jouerSon('clic');

    // Masquer l'écran fin, montrer l'écran lancement
    document.getElementById('ecran-fin').classList.add('masque');
    document.getElementById('ecran-lancement').classList.remove('masque');

    // Reset timer display
    document.getElementById('timer-valeur').classList.remove('urgent');
    document.getElementById('timer-valeur').textContent = '00:00';

    // Le profil reste intact — on rafraîchit juste l'affichage
    const profil = chargerProfil();
    if (profil) metterAjourAffichageProfil(profil);

    // Reset feedback partage
    document.getElementById('fin-feedback-partage').classList.add('masque');
    document.getElementById('fin-feedback-partage').textContent = '';
}

/* ─── Changer de profil depuis l'écran de fin ──────────────────── */
function changerProfilDepuisFin() {
    jouerSon('clic');
    
    // Masquer l'écran de fin
    document.getElementById('ecran-fin').classList.add('masque');
    
    // Déconnecter le profil actuel
    localStorage.removeItem(CLE_PROFIL_ACTIF);
    
    // Afficher l'écran de sélection
    const liste = chargerListeProfils();
    if (liste.length > 0) {
        afficherEcranSelection();
    } else {
        afficherEcranCreation();
    }
    
    // Reset timer display
    document.getElementById('timer-valeur').classList.remove('urgent');
    document.getElementById('timer-valeur').textContent = '00:00';
    
    // Reset feedback partage
    document.getElementById('fin-feedback-partage').classList.add('masque');
    document.getElementById('fin-feedback-partage').textContent = '';
}

/* ─── Partager le résultat (copie dans le clipboard) ───────────── */
function partagerResultat() {
    if (!dernierResultat) return;
    const { score, total, xpGagnee, temps } = dernierResultat;
    const profil = chargerProfil();
    const rang   = obtenirRang((profil ? profil.xpTotal : 0));

    const texte = `🏆 QCM — Score : ${score}/${total} | XP : +${xpGagnee} | Rang : ${rang.nom} | Temps : ${temps}`;

    navigator.clipboard.writeText(texte).then(() => {
        const feedback = document.getElementById('fin-feedback-partage');
        feedback.textContent = '✅ Résultat copié dans le clipboard !';
        feedback.classList.remove('masque');
        setTimeout(() => feedback.classList.add('masque'), 3000);
    }).catch(() => {
        // Fallback : prompt avec le texte
        const feedback = document.getElementById('fin-feedback-partage');
        feedback.textContent = texte;
        feedback.classList.remove('masque');
    });
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITAIRES
   ═══════════════════════════════════════════════════════════════════ */

/* Détermine si une couleur hex est "sombre" (pour le contraste du texte) */
function estCouleurSombre(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Formule luminance perçue
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
