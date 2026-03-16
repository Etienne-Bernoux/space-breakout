Feature: IA — entraînement et jeu automatique

  # --- AI Lab : entraînement ---

  Scenario: Lancer l'entraînement met à jour les stats
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    And je clique sur "[data-action=start]"
    And j'attends 3000ms
    Then le texte de "#ai-start-btn" est "Arrêter"
    And les stats AI affichent un agent en cours

  Scenario: Arrêter l'entraînement remet le bouton
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    And je clique sur "[data-action=start]"
    And j'attends 1000ms
    And je clique sur "[data-action=start]"
    And j'attends 200ms
    Then le texte de "#ai-start-btn" contient "Lancer"

  Scenario: Reset cerveau vide le modèle
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    And je clique sur "#ai-lab [data-action=reset]"
    And j'attends 200ms
    Then le localStorage AI est vide

  # --- IA joue un niveau complet ---

  Scenario: L'IA joue et le jeu tourne sans erreur
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-1" avec l'IA
    Then l'état du jeu est "playing"
    And le flag "__GAME__.aiPlaying" est true
    When j'attends 2000ms
    Then le nombre d'astéroïdes a diminué

  Scenario: L'IA joue + forceWin → stats → worldMap → systemMap
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-1" avec l'IA
    And j'attends 500ms
    And je force la victoire
    Then l'état du jeu est "stats"
    When j'appuie sur "Escape"
    Then l'état du jeu est "worldMap"
    When j'appuie sur "Escape"
    Then l'état du jeu est "systemMap"

  Scenario: L'IA gagne puis retour à la carte
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-1" avec l'IA
    And j'attends 1000ms
    And je force la victoire
    Then l'état du jeu est "stats"
    When j'appuie sur "Escape"
    Then l'état du jeu est "worldMap"
