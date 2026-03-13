@mobile
Feature: Audit mobile — iPhone 13

  Scenario: Parcours complet avec screenshots via hitZones
    Given je suis sur la page d'accueil
    And je capture "mobile-01-menu.png"

    When je tap la hitZone "play"
    And j'attends 600ms
    Then je capture "mobile-02-after-play.png"
    And l'état du jeu est "systemMap"

    When je capture "mobile-03-systemMap.png"
    And je tap la hitZone "zone-0"
    And j'attends 600ms
    Then je capture "mobile-04-after-zone.png"
    And l'état du jeu est "worldMap"

    When je capture "mobile-05-worldMap.png"
    And je tap la hitZone "level-0"
    And j'attends 600ms
    Then je capture "mobile-06-after-level.png"
    And l'état du jeu est "playing"

    When je capture "mobile-07-playing-before-launch.png"
    And je tap le centre du canvas
    And j'attends 300ms
    Then je capture "mobile-08-playing-launched.png"

    When je simule un glissement tactile horizontal
    And j'attends 200ms
    Then je capture "mobile-09-after-touch-move.png"

    When j'attends 2000ms
    Then je capture "mobile-10-playing-2s.png"

    When je tap le bouton pause
    And j'attends 300ms
    Then je capture "mobile-11-paused.png"
    And je log le diagnostic mobile

  Scenario: Niveau boss Parasite (z1-6) avec screenshots
    Given je suis sur la page d'accueil
    When je lance le niveau "z1-6"
    Then je capture "mobile-boss-01-before-launch.png"

    When je tap le centre du canvas
    And j'attends 300ms
    Then je capture "mobile-boss-02-launched.png"

    When je simule un glissement tactile horizontal
    And j'attends 2000ms
    Then je capture "mobile-boss-03-playing-2s.png"

    When j'attends 2000ms
    Then je capture "mobile-boss-04-playing-4s.png"

    When je tap le bouton pause
    And j'attends 300ms
    Then je capture "mobile-boss-05-paused.png"
    And je log le diagnostic mobile
