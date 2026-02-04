"""
Module de génération HTML
Ce fichier contient les fonctions qui créent le code source de la page HTML.

Ce fichier peut être entièrement modifié. La version de votre professeur vous donne des instructions sur comment générer votre HTML facilement à l'aide des "triple-quoted f-strings".
"""

def creer_structure(head, body):
    """
    Assemble le code HTML de l'en-tête et du corps pour former la page complète.

    Entrées:
        head: Le code HTML contenu dans la balise <head> (string).
        body: Le code HTML contenu dans la balise <body> (string).

    Sortie:
        Le code source complet de la page HTML (string).
    """
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
    {head}
</head>
<body>
    {body}
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script src="script.js"></script>
</body>
</html>"""


def creer_head(titre_site):
    """
    Génère le HTML dans la balise <head>.

    Entrées:
        titre_site: Le titre dans l'onglet du navigateur (string).

    Sortie:
        Le code HTML de la section <head> (sans la balise <head> elle-même) (string).
    """
    return f"""<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{titre_site}</title>
    <link rel="stylesheet" href="style.css">"""


# Écran création de profil
def creer_ecran_creation_profil():
    """
    Écran affiché une seule fois (si pas de profil en localStorage).
    Permet de choisir un nom et un avatar emoji.
    """
    avatars = ["🧙", "🧝", "🧛", "🦸", "🧜", "🔮", "⚔️", "🛡️", "🏹", "🗡️", "🐉", "🦅"]
    html_avatars = ""
    for av in avatars:
        html_avatars += f'<button class="btn-avatar" data-avatar="{av}" onclick="selectionnerAvatar(this)">{av}</button>\n                    '

    return f"""<div id="ecran-creation-profil">
        <div class="carte carte-lancement carte-profil-creation">
            <h1>Créez votre profil !</h1>
            <p class="sous-titre">Choisissez un nom et un avatar pour commencer.</p>

            <div class="champ-profil">
                <label for="input-nom-profil">Votre nom :</label>
                <input type="text" id="input-nom-profil" placeholder="Ex : Aventurier" maxlength="20" autocomplete="off" oninput="validerChampsProfil()">
            </div>

            <div class="champ-profil">
                <label>Votre avatar :</label>
                <div class="grille-avatars" id="grille-avatars">
                    {html_avatars}
                </div>
            </div>

            <button id="btn-creer-profil" class="btn-principal" onclick="creerProfil()" disabled>Créer mon profil</button>
        </div>
    </div>"""


# Panneau profil 
def creer_panneau_profil():
    """
    Overlay modal avec onglets : Profil | Historique | Leaderboard.
    Le contenu est mis à jour dynamiquement par le JS.
    """
    return """<div id="panneau-profil" class="masque">
        <div class="overlay-fond" onclick="fermerPanneau()"></div>
        <div class="panneau-contenu">

            <div class="onglets">
                <button class="onglet actif" data-onglet="profil"      onclick="changerOnglet('profil')">👤 Profil</button>
                <button class="onglet"       data-onglet="historique"  onclick="changerOnglet('historique')">📜 Historique</button>
                <button class="onglet"       data-onglet="leaderboard" onclick="changerOnglet('leaderboard')">🏆 Classement</button>
            </div>

            <!-- Onglet Profil -->
            <div id="onglet-profil" class="contenu-onglet">
                <div class="profil-header">
                    <span id="panneau-avatar" class="avatar-grand">🧙</span>
                    <div class="profil-infos">
                        <h2 id="panneau-nom">Aventurier</h2>
                        <span id="panneau-rang-badge" class="badge-rang">Débutant</span>
                    </div>
                </div>

                <div class="xp-container panneau-xp">
                    <div class="xp-gagnee">
                        <span class="xp-label">XP Total</span>
                        <span class="xp-valeur" id="panneau-xp-total">0</span>
                    </div>
                    <div class="rang-actuel">
                        <span class="rang-label">Rang</span>
                        <span class="rang-nom" id="panneau-rang-nom">Débutant</span>
                    </div>
                </div>

                <!-- Barre progression vers le rang suivant -->
                <div class="progression-container">
                    <div class="progression-etiquettes">
                        <span id="prog-rang-courant">Débutant</span>
                        <span id="prog-xp-texte">0 / 500 XP</span>
                        <span id="prog-rang-suivant">Bronze</span>
                    </div>
                    <div class="jauge jauge-progression">
                        <div class="jauge-vert" id="jauge-progression-remplissage" style="width: 0%;"></div>
                    </div>
                </div>

                <button class="btn-modifier-profil" onclick="ouvrirModificationProfil()">✏️ Modifier le profil</button>
                
                <div class="btn-row btn-row-profil">
                    <button class="btn-deconnexion" onclick="deconnecterProfil()">🚪 Changer de profil</button>
                    <button class="btn-suppression" onclick="confirmerSuppressionProfil()">🗑️ Supprimer</button>
                </div>
            </div>

            <!-- Onglet Historique -->
            <div id="onglet-historique" class="contenu-onglet masque">
                <h3>📜 Historique des parties</h3>
                <div id="liste-historique">
                    <p class="texte-vide">Aucune partie jouée pour le moment.</p>
                </div>
            </div>

            <!-- Onglet Leaderboard (meilleurs scores personnels, top 5) -->
            <div id="onglet-leaderboard" class="contenu-onglet masque">
                <h3>🏆 Meilleurs scores</h3>
                <div id="liste-leaderboard">
                    <p class="texte-vide">Aucune partie jouée pour le moment.</p>
                </div>
            </div>

            <button class="btn-fermer-panneau" onclick="fermerPanneau()">✕ Fermer</button>
        </div>
    </div>"""


# Modification de profil
def creer_modal_modification_profil():
    """
    Petit modal pour modifier nom + avatar sur un profil existant.
    """
    avatars = ["🧙", "🧝", "🧛", "🦸", "🧜", "🔮", "⚔️", "🛡️", "🏹", "🗡️", "🐉", "🦅"]
    html_avatars = ""
    for av in avatars:
        html_avatars += f'<button class="btn-avatar" data-avatar="{av}" onclick="selectionnerAvatarModif(this)">{av}</button>\n                    '

    return f"""<div id="modal-modification-profil" class="masque">
        <div class="overlay-fond" onclick="fermerModificationProfil()"></div>
        <div class="panneau-contenu panneau-petit">
            <h3>✏️ Modifier le profil</h3>
            <div class="champ-profil">
                <label for="input-nom-modif">Nom :</label>
                <input type="text" id="input-nom-modif" placeholder="Nouveau nom" maxlength="20" autocomplete="off" oninput="validerChampsProfil()">
            </div>
            <div class="champ-profil">
                <label>Avatar :</label>
                <div class="grille-avatars" id="grille-avatars-modif">
                    {html_avatars}
                </div>
            </div>
            <div class="btn-row">
                <button class="btn-principal" onclick="sauvegarderModificationProfil()">💾 Sauvegarder</button>
                <button class="btn-fermer-panneau" onclick="fermerModificationProfil()">Annuler</button>
            </div>
        </div>
    </div>"""


# Pop up animation montée de rang
def creer_overlay_montee_rang():
    """
    Full-screen overlay affiché quand le joueur monte de rang.
    Le contenu (ancien rang → nouveau rang) est injecté par le JS.
    """
    return """<div id="overlay-montee-rang" class="masque">
        <div class="overlay-fond overlay-rang-fond"></div>
        <div class="overlay-rang-contenu">
            <p class="overlay-rang-texte-haut">🎆 Vous montez de rang !</p>
            <span id="overlay-rang-ancien" class="overlay-rang-ancien">Débutant</span>
            <span class="overlay-rang-fleche">⬆️</span>
            <span id="overlay-rang-nouveau" class="overlay-rang-nouveau">Bronze</span>
            <div id="overlay-rang-particules"></div>
            <button class="btn-principal btn-overlay-rang" onclick="fermerOverlayRang()">Continuer</button>
        </div>
    </div>"""


# Écran de fin détaillé
def creer_ecran_fin():
    """
    Écran de fin complet (masqué au départ).
    Contient : récap par question, jauge, XP animé, progression, boutons rejouer / partager.
    Le contenu est rempli dynamiquement par le JS.
    """
    return """<div id="ecran-fin" class="masque">
        <div class="container">

            <!-- Titre + temps -->
            <div class="carte carte-fin-titre">
                <h1 id="fin-titre-message">🎉 Félicitations !</h1>
                <p class="temps-final" id="fin-temps">⏱️ Temps : 00:00</p>
            </div>

            <!-- Résultat global (jauge correct/incorrect) -->
            <div class="carte carte-fin-resultat">
                <h3>📊 Résultat global</h3>
                <div class="jauge-etiquettes">
                    <span class="vert"  id="fin-label-correct">✓ Corrects : 0</span>
                    <span class="rouge" id="fin-label-incorrect">✗ Incorrects : 0</span>
                </div>
                <div class="jauge">
                    <div class="jauge-vert"  id="fin-jauge-vert"  style="width: 0%;"></div>
                    <div class="jauge-rouge" id="fin-jauge-rouge" style="width: 0%;"></div>
                </div>
            </div>

            <!-- XP gagnée + rang + progression -->
            <div class="carte carte-fin-xp">
                <div class="xp-container">
                    <div class="xp-gagnee">
                        <span class="xp-label">XP Gagnée</span>
                        <span class="xp-valeur" id="fin-xp-anime">0</span>
                    </div>
                    <div class="rang-actuel">
                        <span class="rang-label">Rang</span>
                        <span class="rang-nom" id="fin-rang-nom">Débutant</span>
                    </div>
                </div>
                <div id="fin-details-xp" class="details-xp"></div>
                <div class="progression-container">
                    <div class="progression-etiquettes">
                        <span id="fin-prog-courant">Débutant</span>
                        <span id="fin-prog-texte">0 / 500 XP</span>
                        <span id="fin-prog-suivant">Bronze</span>
                    </div>
                    <div class="jauge jauge-progression">
                        <div class="jauge-vert" id="fin-jauge-progression" style="width: 0%;"></div>
                    </div>
                </div>
            </div>

            <!-- Récap détaillé par question -->
            <div class="carte carte-fin-recap">
                <h3>📝 Détail par question</h3>
                <div id="fin-recap-questions"></div>
            </div>

            <!-- Boutons -->
            <div class="btn-row btn-row-fin">
                <button class="btn-principal btn-rejouer" onclick="rejuerQCM()">🔄 Rejouer</button>
                <button class="btn-partager"              onclick="partagerResultat()">📤 Partager</button>
            </div>
            <div class="btn-row btn-row-fin">
                <button class="btn-changer-profil" onclick="changerProfilDepuisFin()">👤 Changer de profil</button>
            </div>
            <p id="fin-feedback-partage" class="feedback-partage masque"></p>
        </div>
    </div>"""


# Écran de lancement
def creer_ecran_lancement(titre_page, nb_questions):
    """
    Écran de lancement avec une bande d'info profil (avatar + nom + bouton ⚙️).
    Masqué par défaut — affiché par le JS après création/chargement du profil.

    Entrées:
        titre_page: Le titre affiché en gros (string).
        nb_questions: Nombre de questions (int).

    Sortie:
        Le code HTML de l'écran de lancement (string).
    """
    return f"""<div id="ecran-lancement" class="masque">
        <div class="carte carte-lancement">
            <div class="lancement-header">
                <span id="lancement-avatar" class="avatar-petit">🧙</span>
                <span id="lancement-nom" class="nom-petit">Aventurier</span>
                <button class="btn-profil-acces" onclick="ouvrirPanneau()">⚙️ Profil</button>
            </div>
            <h1>{titre_page}</h1>
            <p class="description">Répondez à <strong>{nb_questions} question{"s" if nb_questions > 1 else ""}</strong> aussi vite que possible.</p>
            <p class="sous-titre">Un timer démarrera dès que vous cliquerez sur le bouton ci-dessous.</p>
            <button id="btn-demarrer" onclick="demarrerQCM()">Démarrer ⏱️</button>
        </div>
    </div>"""


def creer_ecran_qcm(titre_page, donnees):
    """
    Écran du QCM (masqué au départ) : timer, combo-indicator, questions, bouton vérifier.

    Entrées:
        titre_page: Titre de la page (string).
        donnees: Liste de dicts avec 'question', 'choix_reponses', 'bonne_reponse', 'difficulte'.

    Sortie:
        Le code HTML de l'écran QCM (string).
    """
    html_sections = ""
    for i, d in enumerate(donnees):
        html_sections += creer_section(i, d["question"], d["choix_reponses"], d["bonne_reponse"], d.get("difficulte", 2))

    return f"""<div id="ecran-qcm" class="masque">
        <div id="barre-timer">
            <span id="timer-texte">⏱️ Temps : </span><span id="timer-valeur">00:00</span>
            <div class="controls-son">
                <button id="btn-mute" onclick="toggleMute()" title="Activer/Désactiver les sons">🔊</button>
                <div class="volume-control">
                    <input type="range" id="volume-slider" min="0" max="100" value="30" 
                           oninput="updateVolume(this.value)" title="Volume">
                    <span id="volume-label">30%</span>
                </div>
            </div>
        </div>
        <h1>{titre_page}</h1>
        <div class="container">
            <div id="combo-indicator" class="masque">
                <span id="combo-text">🔥 Combo x1</span>
            </div>
            {html_sections}
            <button id="verifier" onclick="verifierReponses()">Vérifier mes réponses</button>
        </div>
    </div>"""


def creer_body(titre_page, donnees):
    """
    Assemble tous les écrans dans l'ordre logique du flux utilisateur.

    Entrées:
        titre_page: Grand titre H1 (string).
        donnees: Liste de dicts question/choix/reponse/difficulte.

    Sortie:
        Le code HTML complet du <body> (sans la balise <body>) (string).
    """
    return f"""{creer_ecran_creation_profil()}

    {creer_ecran_lancement(titre_page, len(donnees))}

    {creer_ecran_qcm(titre_page, donnees)}

    {creer_ecran_fin()}

    {creer_panneau_profil()}
    {creer_modal_modification_profil()}
    {creer_overlay_montee_rang()}"""


def echapper_html(texte):
    """
    Échappe les caractères spéciaux HTML.
    """
    return (texte
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;"))


def creer_section(index, titre_section, choix_reponses, bonne_reponse, difficulte=2):
    """
    Crée le bloc HTML (carte) pour une question de QCM.

    Entrées:
        index: Index de la question (int).
        titre_section: Énoncé (string).
        choix_reponses: Liste de choix (list of str).
        bonne_reponse: La bonne réponse (string).
        difficulte: 1=Facile, 2=Moyen, 3=Difficile (int).

    Sortie:
        Un bloc HTML <div> avec la question et les radio buttons (string).
    """
    difficultes_labels  = {1: "Facile", 2: "Moyen", 3: "Difficile"}
    difficultes_classes = {1: "facile", 2: "moyen", 3: "difficile"}
    xp_values           = {1: 50, 2: 100, 3: 150}
    temps_optimal       = {1: 10, 2: 20, 3: 30}

    diff_label = difficultes_labels.get(difficulte, "Moyen")
    diff_class = difficultes_classes.get(difficulte, "moyen")
    xp_base    = xp_values.get(difficulte, 100)
    temps_opt  = temps_optimal.get(difficulte, 20)

    html_choix = ""
    for choix in choix_reponses:
        choix_echappe = echapper_html(choix.strip())
        html_choix += f"""
        <label class="choix" onmouseover="jouerSon('hover')">
            <input type="radio" name="question{index}" value="{choix_echappe}" onchange="verifierAutomatic()">
            {choix_echappe}
        </label>"""

    bonne_reponse_echappee = echapper_html(bonne_reponse.strip())
    titre_echappe          = echapper_html(titre_section)

    return f"""<div class="carte" data-bonne-reponse="{bonne_reponse_echappee}" data-difficulte="{difficulte}" data-xp-base="{xp_base}" data-temps-optimal="{temps_opt}">
        <div class="question-header">
            <h2>Q{index + 1}. {titre_echappe}</h2>
            <span class="badge-difficulte {diff_class}">{diff_label} ({xp_base} XP)</span>
        </div>
        <div class="choix-container">
            {html_choix}
        </div>
    </div>
    """


def generation_page_html(titre_site, titre_page, donnees):
    """
    Point d'entrée principal : génère la page HTML complète.

    Entrées:
        titre_site: Titre de l'onglet (string).
        titre_page: Titre affiché sur la page (string).
        donnees: Liste de dicts avec les questions.

    Sortie:
        Le code HTML final (string).
    """
    head = creer_head(titre_site)
    body = creer_body(titre_page, donnees)
    return creer_structure(head, body)
