Feature: Lab Hub — mode ?lab

  Scenario: Charge sans erreur console avec ?lab
    Given je suis sur la page "?lab"
    Then aucune erreur console n'est présente

  Scenario: Le lab hub est actif avec ?lab
    Given je suis sur la page "?lab"
    Then le flag "__GAME__.labHub" est true

  Scenario: Le lab hub est inactif sans param
    Given je suis sur la page d'accueil
    Then le flag "__GAME__.labHub" est false

  Scenario: Clic Dev Panel ouvre le dev panel
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=dev]"
    And j'attends 200ms
    Then le flag "__GAME__.devPanel" est true
    And le flag "__GAME__.labHub" est false

  Scenario: Clic Music Lab ouvre le music lab
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=music]"
    And j'attends 200ms
    Then le flag "__GAME__.musicLab" est true

  Scenario: Clic Progress Lab ouvre le progress lab
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=progress]"
    And j'attends 200ms
    Then le flag "__GAME__.progressLab" est true

  Scenario: Bouton retour revient au hub
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=dev]"
    And j'attends 200ms
    And je clique sur "#dev-panel-lab .lab-back-btn"
    And j'attends 200ms
    Then le flag "__GAME__.labHub" est true
    And le flag "__GAME__.devPanel" est false

  Scenario: Clic AI Lab ouvre le AI lab
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    Then le flag "__GAME__.aiLab" est true
    And le flag "__GAME__.labHub" est false

  Scenario: AI Lab — bouton retour revient au hub
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    And je clique sur "#ai-lab .lab-back-btn"
    And j'attends 200ms
    Then le flag "__GAME__.labHub" est true
    And le flag "__GAME__.aiLab" est false

  Scenario: AI Lab — le sélecteur de niveau est présent
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    Then l'élément "#ai-level-select" est visible

  Scenario: AI Lab — le bouton d'entraînement est présent
    Given je suis sur la page "?lab"
    When je clique sur "[data-lab=ai]"
    And j'attends 200ms
    Then l'élément "#ai-start-btn" est visible

  Scenario: Expose wallet et upgrades via __GAME__
    Given je suis sur la page "?lab"
    Then __GAME__.wallet expose une méthode "get"
    And __GAME__.upgrades expose une méthode "getLevel"
