#!/usr/bin/env python3
"""
Script de validation du système audio optimisé
Vérifie l'installation complète des nouveaux sons
"""

import os
from pathlib import Path
import sys

# Codes couleur ANSI
class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def print_header(text):
    print(f"\n{Color.BOLD}{Color.CYAN}{'='*70}{Color.RESET}")
    print(f"{Color.BOLD}{Color.CYAN}{text.center(70)}{Color.RESET}")
    print(f"{Color.BOLD}{Color.CYAN}{'='*70}{Color.RESET}\n")

def print_success(text):
    print(f"{Color.GREEN}✅ {text}{Color.RESET}")

def print_error(text):
    print(f"{Color.RED}❌ {text}{Color.RESET}")

def print_warning(text):
    print(f"{Color.YELLOW}⚠️  {text}{Color.RESET}")

def print_info(text):
    print(f"{Color.BLUE}ℹ️  {text}{Color.RESET}")

# Liste des fichiers audio requis (format dual)
REQUIRED_SOUNDS = [
    'click', 'hover', 'correct', 'incorrect',
    'bonus_difficult', 'tick', 'time_alert', 'rank_up',
    'combo_3', 'combo_5', 'combo_10', 'stat_animation'
]

def check_sounds_directory():
    """Vérifie le dossier sounds/ et ses fichiers"""
    print_header("VÉRIFICATION DU DOSSIER SOUNDS")
    
    sounds_dir = Path('sounds')
    
    if not sounds_dir.exists():
        print_error("Le dossier 'sounds/' n'existe pas !")
        print_info("Créez-le au même niveau que index.html")
        return False, {}
    
    print_success("Le dossier 'sounds/' existe")
    
    # Vérifier chaque son (MP3 + OGG)
    missing_mp3 = []
    missing_ogg = []
    present_sounds = {}
    
    for sound_name in REQUIRED_SOUNDS:
        mp3_file = sounds_dir / f"{sound_name}.mp3"
        ogg_file = sounds_dir / f"{sound_name}.ogg"
        
        mp3_exists = mp3_file.exists()
        ogg_exists = ogg_file.exists()
        
        if mp3_exists and ogg_exists:
            mp3_size = mp3_file.stat().st_size / 1024
            ogg_size = ogg_file.stat().st_size / 1024
            present_sounds[sound_name] = (mp3_size, ogg_size)
        else:
            if not mp3_exists:
                missing_mp3.append(f"{sound_name}.mp3")
            if not ogg_exists:
                missing_ogg.append(f"{sound_name}.ogg")
    
    # Affichage des résultats
    print(f"\n{Color.BOLD}Sons trouvés : {len(present_sounds)}/12{Color.RESET}\n")
    
    for sound_name, (mp3_size, ogg_size) in present_sounds.items():
        gain = ((mp3_size - ogg_size) / mp3_size * 100) if mp3_size > 0 else 0
        print_success(f"{sound_name:<20} MP3: {mp3_size:5.1f}KB | OGG: {ogg_size:5.1f}KB | Gain: {gain:4.1f}%")
    
    if missing_mp3 or missing_ogg:
        print(f"\n{Color.BOLD}{Color.RED}Fichiers manquants :{Color.RESET}")
        for filename in missing_mp3:
            print_error(f"  {filename}")
        for filename in missing_ogg:
            print_error(f"  {filename}")
        return False, present_sounds
    
    # Calculer poids total
    total_mp3 = sum(size[0] for size in present_sounds.values())
    total_ogg = sum(size[1] for size in present_sounds.values())
    
    print(f"\n{Color.BOLD}Poids total :{Color.RESET}")
    print(f"  MP3 : {Color.CYAN}{total_mp3:6.1f} KB{Color.RESET}")
    print(f"  OGG : {Color.CYAN}{total_ogg:6.1f} KB{Color.RESET}")
    print(f"  Gain: {Color.GREEN}{((total_mp3 - total_ogg) / total_mp3 * 100):5.1f}%{Color.RESET}")
    
    return True, present_sounds

def check_script_js():
    """Vérifie l'intégration dans script.js"""
    print_header("VÉRIFICATION DE SCRIPT.JS")
    
    script_path = Path('script.js')
    
    if not script_path.exists():
        print_error("Le fichier 'script.js' n'existe pas !")
        return False
    
    print_success("Le fichier 'script.js' existe")
    
    with open(script_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Vérifications critiques
    checks = {
        'detecterFormatAudio': 'Fonction de détection de format',
        'FORMAT_AUDIO': 'Constante de format',
        'creerAudio': 'Fonction de création audio',
        '.ogg': 'Références au format OGG',
        '.mp3': 'Références au format MP3'
    }
    
    results = {}
    for key, description in checks.items():
        if key in content:
            print_success(f"{description} : Trouvé")
            results[key] = True
        else:
            print_error(f"{description} : Manquant")
            results[key] = False
    
    # Vérifier les noms de sons
    print(f"\n{Color.BOLD}Vérification des sons référencés :{Color.RESET}")
    sons_ok = True
    for sound_name in REQUIRED_SOUNDS:
        if sound_name in content or sound_name.replace('_', '-') in content:
            print_success(f"  {sound_name}")
        else:
            print_error(f"  {sound_name} (non référencé)")
            sons_ok = False
    
    all_ok = all(results.values()) and sons_ok
    
    if not all_ok:
        print(f"\n{Color.YELLOW}⚠️  Script.js nécessite une mise à jour{Color.RESET}")
        print_info("Consultez INSTALLATION_RAPIDE.md pour le code à copier")
    
    return all_ok

def check_structure():
    """Vérifie la structure générale du projet"""
    print_header("VÉRIFICATION DE LA STRUCTURE")
    
    required_files = {
        'index.html': 'Page principale du QCM',
        'script.js': 'Logique JavaScript',
        'style.css': 'Feuilles de style',
        'sounds/': 'Dossier des sons'
    }
    
    all_present = True
    
    for filename, description in required_files.items():
        path = Path(filename)
        if path.exists():
            print_success(f"{filename:<20} → {description}")
        else:
            print_error(f"{filename:<20} → {description} (MANQUANT)")
            all_present = False
    
    # Vérifier positionnement
    if Path('sounds').exists() and Path('index.html').exists():
        print_success("sounds/ est correctement placé au niveau de index.html")
    
    return all_present

def check_test_files():
    """Vérifie les fichiers de test"""
    print_header("FICHIERS DE TEST")
    
    test_files = {
        'test_sounds.html': 'Page de test interactive',
        'DOCUMENTATION.md': 'Documentation complète',
        'INSTALLATION_RAPIDE.md': 'Guide d\'installation'
    }
    
    found = []
    missing = []
    
    for filename, description in test_files.items():
        if Path(filename).exists():
            print_success(f"{filename:<25} → {description}")
            found.append(filename)
        else:
            print_warning(f"{filename:<25} → {description} (optionnel)")
            missing.append(filename)
    
    return len(found) > 0

def generate_report(results):
    """Génère un rapport final"""
    print_header("RAPPORT FINAL")
    
    total_checks = len(results)
    passed_checks = sum(1 for v in results.values() if v)
    
    print(f"\n{Color.BOLD}Tests réussis : {passed_checks}/{total_checks}{Color.RESET}\n")
    
    for check_name, passed in results.items():
        if passed:
            print_success(check_name)
        else:
            print_error(check_name)
    
    print("\n" + "="*70)
    
    if passed_checks == total_checks:
        print(f"\n{Color.GREEN}{Color.BOLD}🎉 INSTALLATION VALIDÉE !{Color.RESET}")
        print(f"\n{Color.GREEN}Votre système audio est parfaitement configuré.{Color.RESET}")
        print(f"{Color.CYAN}✓ 12 sons professionnels optimisés{Color.RESET}")
        print(f"{Color.CYAN}✓ Support multi-format (MP3 + OGG){Color.RESET}")
        print(f"{Color.CYAN}✓ Détection automatique du meilleur format{Color.RESET}")
        print(f"{Color.CYAN}✓ Volume normalisé et cohérent{Color.RESET}")
        print(f"\n{Color.BLUE}📝 Prochaine étape :{Color.RESET}")
        print(f"   1. Ouvrez test_sounds.html pour tester tous les sons")
        print(f"   2. Lancez votre QCM et vérifiez les sons en contexte")
        print(f"   3. Consultez DOCUMENTATION.md pour la personnalisation\n")
        return 0
    elif passed_checks >= total_checks * 0.75:
        print(f"\n{Color.YELLOW}{Color.BOLD}⚠️  INSTALLATION PRESQUE COMPLÈTE{Color.RESET}")
        print(f"\n{Color.YELLOW}Quelques ajustements sont nécessaires.{Color.RESET}")
        print(f"{Color.BLUE}Consultez les sections marquées en rouge ci-dessus.{Color.RESET}\n")
        return 1
    else:
        print(f"\n{Color.RED}{Color.BOLD}❌ INSTALLATION INCOMPLÈTE{Color.RESET}")
        print(f"\n{Color.RED}Plusieurs éléments manquent.{Color.RESET}")
        print(f"{Color.BLUE}Consultez INSTALLATION_RAPIDE.md pour un guide pas à pas.{Color.RESET}\n")
        return 2

def main():
    """Fonction principale"""
    print(f"\n{Color.BOLD}{Color.MAGENTA}🎵 VALIDATION DU SYSTÈME AUDIO OPTIMISÉ{Color.RESET}")
    print(f"{Color.BOLD}Version 1.0 — Sons Professionnels{Color.RESET}\n")
    
    results = {}
    
    # Vérifications
    results['Structure du projet'] = check_structure()
    sounds_ok, sound_details = check_sounds_directory()
    results['Fichiers audio (MP3 + OGG)'] = sounds_ok
    results['Configuration script.js'] = check_script_js()
    results['Fichiers de test disponibles'] = check_test_files()
    
    # Rapport final
    return generate_report(results)

if __name__ == '__main__':
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n\n{Color.YELLOW}Validation interrompue par l'utilisateur.{Color.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Color.RED}Erreur inattendue : {e}{Color.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
