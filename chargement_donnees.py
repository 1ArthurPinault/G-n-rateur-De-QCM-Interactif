"""
Module de gestion des données
Ce fichier contient les fonctions permettant de charger/récupérer/créer les données nécessaires au projet.
Les données peuvent être directement écrites ici pour les tests, ou bien générées à partir d'inputs
de l'utilisateur ou encore chargées depuis un fichier CSV.

Ce fichier peut être entièrement modifié. La version de votre professeur charge directement les données
dans une structure de dictionnaire. Celle-ci peut être totalement changée et n'est présente qu'à titre
d'exemple. Il est attendu que vos données soient chargées par des inputs d'utilisateur ou par un fichier
externe de données (ou les 2).
"""

# Codes de couleur ANSI
class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    CYAN    = "\033[36m"
    JAUNE   = "\033[33m"
    VERT    = "\033[32m"
    ROUGE   = "\033[31m"
    BLEU    = "\033[34m"
    MAGENTA = "\033[35m"

# Constante de largeur du cadre
LARGEUR = 54

# Fonctions utilitaires d'affichage
def haut(couleur=C.CYAN):
    """╭──────╮"""
    print(f"{couleur}╭{'─' * (LARGEUR - 2)}╮{C.RESET}")

def bas(couleur=C.CYAN):
    """╰──────╯"""
    print(f"{couleur}╰{'─' * (LARGEUR - 2)}╯{C.RESET}")

def sep(couleur=C.CYAN):
    """├──────┤"""
    print(f"{couleur}├{'─' * (LARGEUR - 2)}┤{C.RESET}")

def vide(couleur=C.CYAN):
    """│      │  (ligne vide)"""
    print(f"{couleur}│{C.RESET}{' ' * (LARGEUR - 2)}{couleur}│{C.RESET}")

def ligne(texte, couleur_cadre=C.CYAN, couleur_texte=C.BOLD):
    """│  texte centré  │"""
    espace = LARGEUR - 4                          # retire "│ " et " │"
    pad_total = espace - len(texte)
    pad_g = pad_total // 2
    pad_d = pad_total - pad_g
    print(f"{couleur_cadre}│{C.RESET} {' ' * pad_g}"
          f"{couleur_texte}{texte}{C.RESET}"
          f"{' ' * pad_d} {couleur_cadre}│{C.RESET}")

def saisie(prompt, couleur=C.JAUNE):
    """Ferme le cadre puis affiche le prompt indentée pour la saisie."""
    bas()
    return input(f"  {couleur}{prompt}{C.RESET}")


# Blocs d'affichage réutilisables
def bloc_titre(texte, couleur_texte=C.BOLD + C.CYAN):
    """Un cadre complet avec un titre centré."""
    haut()
    vide()
    ligne(texte, couleur_texte=couleur_texte)
    vide()
    bas()

def bloc_section(titre_section, couleur_texte=C.DIM):
    """Ouvre un cadre avec un sous-titre, laissé ouvert pour la saisie."""
    haut()
    vide()
    ligne(titre_section, couleur_texte=couleur_texte)

def bloc_confirmation(texte):
    """Cadre vert pour confirmer une action."""
    print()
    haut()
    vide()
    ligne(texte, couleur_texte=C.VERT + C.BOLD)
    vide()
    bas()


# Bannières
def banniere_debut():
    """Bandeau de bienvenue."""
    print()
    haut()
    vide()
    ligne("QCM  —  Générateur interactif", couleur_texte=C.BOLD + C.CYAN)
    vide()
    ligne("Créez votre questionnaire !", couleur_texte=C.DIM)
    vide()
    bas()
    print()

def banniere_recap(questions):
    """Récapitulatif stylé de toutes les questions saisies."""
    print()
    haut()
    vide()
    ligne("Récapitulatif", couleur_texte=C.BOLD + C.MAGENTA)
    vide()
    sep()                                         # séparateur après le titre

    # Dictionnaire pour affichage difficulté
    difficultes = {1: "Facile", 2: "Moyen", 3: "Difficile"}
    couleurs_diff = {1: C.VERT, 2: C.JAUNE, 3: C.ROUGE}

    for i, q in enumerate(questions, start=1):
        vide()
        ligne(f"Q{i} : {q['question']}", couleur_texte=C.BOLD + C.JAUNE)
        
        # Affichage de la difficulté
        diff_nom = difficultes.get(q['difficulte'], "Moyen")
        diff_couleur = couleurs_diff.get(q['difficulte'], C.JAUNE)
        ligne(f"Difficulté : {diff_nom}", couleur_texte=diff_couleur)
        vide()

        for choix in q["choix_reponses"]:
            if choix == q["bonne_reponse"]:
                ligne(f"✓  {choix}", couleur_texte=C.VERT + C.BOLD)
            else:
                ligne(f"○  {choix}", couleur_texte=C.DIM)

        vide()
        if i < len(questions):
            sep(couleur=C.DIM)                    # séparateur léger entre Qs

    bas()
    print()


# Fonctions principales
def charger_donnees():
    """
    Fonction principale : lance la saisie interactive et retourne les données.

    Sortie:
        Liste de dictionnaires avec les clés 'question', 'choix_reponses', 'bonne_reponse', 'difficulte'.
    """

    def demander_questions():
        liste_questions = []
        banniere_debut()

        # Nombre de questions
        bloc_section("Nombre de questions à créer ?")
        while True:
            nb_saisie = saisie("→ Nombre de questions : ")
            if nb_saisie.isdigit() and int(nb_saisie) >= 1:
                nb_questions = int(nb_saisie)
                break
            print(f"  {C.ROUGE}⚠  Entrez un entier ≥ 1.{C.RESET}")
        print()

        # Boucle principale
        for i in range(1, nb_questions + 1):

            # Bandeau "Question i / n"
            print()
            haut()
            vide()
            ligne(f"Question  {i} / {nb_questions}", couleur_texte=C.BOLD + C.VERT)
            vide()
            bas()

            # Énoncé
            bloc_section("Énoncé de la question")
            question = saisie("→ Question : ")

            # Choix de réponses
            bloc_section("Choix de réponses")
            choix_reponses = [c.strip() for c in saisie(
                "→ Réponses (séparées par des virgules) : "
            ).split(",")]

            # Sélection de la bonne réponse (cadre avec liste numérotée)
            bloc_section("Sélection de la bonne réponse")
            sep()                                 # ligne sous le sous-titre
            for idx, choix in enumerate(choix_reponses, start=1):
                ligne(f"{idx}.  {choix}", couleur_texte=C.BLEU)
            sep()                                 # ligne après la liste

            # Validation du numéro
            while True:
                num_saisie = saisie(f"→ Numéro de la bonne réponse (1–{len(choix_reponses)}) : ")
                if num_saisie.isdigit() and 1 <= int(num_saisie) <= len(choix_reponses):
                    bonne_reponse = choix_reponses[int(num_saisie) - 1]
                    bloc_confirmation(f"✓  Bonne réponse : {bonne_reponse}")
                    break
                print(f"  {C.ROUGE}⚠  Numéro invalide. Choisissez entre 1 et {len(choix_reponses)}.{C.RESET}")

            # NOUVEAU : Sélection de la difficulté
            bloc_section("Niveau de difficulté")
            sep()
            ligne("1.  Facile   (50 XP, 10s optimal)", couleur_texte=C.VERT)
            ligne("2.  Moyen    (100 XP, 20s optimal)", couleur_texte=C.JAUNE)
            ligne("3.  Difficile (150 XP, 30s optimal)", couleur_texte=C.ROUGE)
            sep()

            while True:
                diff_saisie = saisie("→ Difficulté (1, 2 ou 3) : ")
                if diff_saisie in ["1", "2", "3"]:
                    difficulte = int(diff_saisie)
                    noms_diff = {1: "Facile", 2: "Moyen", 3: "Difficile"}
                    bloc_confirmation(f"✓  Difficulté : {noms_diff[difficulte]}")
                    break
                print(f"  {C.ROUGE}⚠  Choisissez 1, 2 ou 3.{C.RESET}")

            liste_questions.append({
                "question": question,
                "choix_reponses": choix_reponses,
                "bonne_reponse": bonne_reponse,
                "difficulte": difficulte
            })

        # Récapitulatif
        banniere_recap(liste_questions)
        return liste_questions

    return demander_questions()
