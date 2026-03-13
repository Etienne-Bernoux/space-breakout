Feature: Smoke — démarrage sans erreur

  Scenario: La page charge sans erreur console
    Given je suis sur la page d'accueil
    Then aucune erreur console n'est présente

  Scenario: Le canvas game existe
    Given je suis sur la page d'accueil
    Then le canvas "#game" est visible

  Scenario: Le hook __GAME__ expose state=menu
    Given je suis sur la page d'accueil
    Then l'état du jeu est "menu"
