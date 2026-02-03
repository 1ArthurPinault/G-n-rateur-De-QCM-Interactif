"""
Programme principal du projet.

Celui-ci ne doit normalement pas être modifié. Toute modification doit être clairement explicitée et validée avec votre professeur.
C'est ce fichier qui sera exécuté par votre professeur.
"""
from chargement_donnees import *
from generateur_html import *
import os

# Récupération du dossier courant du script (pour situer l'endroit où on génère le fichier index.html)
dossier_courant = os.path.dirname(os.path.abspath(__file__))
nom_fichier_html = "index"
chemin_fichier_html = dossier_courant + "/" + nom_fichier_html + ".html"
titre_site = "Le QCM interactif"
titre_page = "Bienvenue sur notre QCM !"

# Chargement des données (via chargement_donnees.py)
donnees = charger_donnees()

# Construction du HTML (via generateur_html.py)
html = generation_page_html(titre_site, titre_page, donnees)

# Écriture du fichier HTML au chemin spécifié
with open(chemin_fichier_html, "w", encoding="utf-8") as f:
	f.write(html)
	print("✅ Site généré avec succès dans " + chemin_fichier_html)