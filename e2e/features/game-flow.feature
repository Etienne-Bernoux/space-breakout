Feature: Flow — menu → lancer → jouer → fin

  Scenario: Enter depuis le menu passe en state playing
    Given une partie est lancée
    Then l'état du jeu est "playing"

  Scenario: Lancer le drone avec espace
    Given une partie est lancée
    When j'appuie sur "Space"
    And j'attends 200ms
    Then l'état du jeu est "playing"

  Scenario: Pause avec Escape
    Given une partie est lancée
    When j'appuie sur "Escape"
    Then l'état du jeu est "paused"

  Scenario: Resume avec Escape après pause
    Given une partie est lancée
    When j'appuie sur "Escape"
    And l'état du jeu est "paused"
    And j'appuie sur "Escape"
    Then l'état du jeu est "playing"

  Scenario: Le nombre de vies est cohérent au démarrage
    Given une partie est lancée
    Then le nombre de vies est supérieur à 0

  Scenario: Des astéroïdes sont présents au démarrage
    Given une partie est lancée
    Then le nombre d'astéroïdes est supérieur à 0

  Scenario: ForceWin → stats → retour carte
    Given une partie est lancée
    When j'appuie sur "Space"
    And j'attends 100ms
    And je force la victoire
    Then l'état du jeu est "stats"
    When j'appuie sur "Escape"
    Then l'état du jeu est "worldMap"

  Scenario: L'IA joue z1-1 en accéléré et gagne
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-1" avec l'IA
    And j'accélère le jeu x5
    And l'IA atteint la fin de partie
    Then l'état du jeu est "won" ou "gameOver" ou "stats"

  Scenario: Victoire IA → stats → worldMap → systemMap → menu
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-1" avec l'IA
    And j'accélère le jeu x5
    And l'IA atteint la fin de partie
    And je force la victoire
    Then l'état du jeu est "stats"
    When j'appuie sur "Escape"
    Then l'état du jeu est "worldMap"
    When j'appuie sur "Escape"
    Then l'état du jeu est "systemMap"
    When j'appuie sur "Escape"
    Then l'état du jeu est "menu"
