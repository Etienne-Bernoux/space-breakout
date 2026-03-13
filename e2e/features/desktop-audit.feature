Feature: Audit desktop — 800×600

  Scenario: Parcours complet avec screenshots clavier + souris
    Given je suis sur la page d'accueil
    And je capture "desktop-01-menu.png"

    When j'appuie sur "Enter"
    And j'attends 600ms
    Then je capture "desktop-02-after-play.png"
    And l'état du jeu est "systemMap"

    When je capture "desktop-03-systemMap.png"
    And j'appuie sur "Enter"
    And j'attends 600ms
    Then je capture "desktop-04-after-zone.png"
    And l'état du jeu est "worldMap"

    When je capture "desktop-05-worldMap.png"
    And j'appuie sur "Enter"
    And j'attends 600ms
    Then je capture "desktop-06-after-level.png"
    And l'état du jeu est "playing"

    When je capture "desktop-07-playing-before-launch.png"
    And j'appuie sur "Space"
    And j'attends 300ms
    Then je capture "desktop-08-playing-launched.png"

    When je déplace la souris horizontalement sur le vaisseau
    And j'attends 200ms
    Then je capture "desktop-09-after-mouse-move.png"

    When j'attends 2000ms
    Then je capture "desktop-10-playing-2s.png"

    When j'appuie sur "Escape"
    And j'attends 300ms
    Then je capture "desktop-11-paused.png"
    And je log le diagnostic desktop
