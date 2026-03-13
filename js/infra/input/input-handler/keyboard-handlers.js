// --- Keyboard handlers (keydown, keyup) ---
// Callbacks enregistrés sur document pour les interactions clavier.

/** Enregistre les handlers keydown et keyup sur document. */
export function bindKeyboardHandlers(ih) {
  const infra = ih.infra;

  document.addEventListener('keydown', (e) => {
    // Les panels DOM gèrent leurs propres events (Escape, Enter, etc.)
    if (infra.isSimulatorOpen && infra.isSimulatorOpen()) return;
    if (infra.isMusicLabActive()) return;
    if (infra.isDevPanelActive()) return;

    if (ih.session.state === 'menu') {
      const action = infra.handleMenuInput(e.key);
      if (action === 'play') ih.goToSystemMap();
      return;
    }

    if (ih.session.state === 'systemMap') {
      handleSystemMapKeys(ih, e.key);
      return;
    }

    if (ih.session.state === 'worldMap') {
      handleWorldMapKeys(ih, e.key);
      return;
    }

    if (ih.session.state === 'upgrade') {
      handleUpgradeKeys(ih, infra, e.key);
      return;
    }

    if (ih.session.state === 'stats') {
      if (e.key === ' ' || e.key === 'Enter') ih.nextLevelOrMap();
      if (e.key === 'Escape') ih.statsToMap();
      return;
    }

    if (ih.session.state === 'playing') {
      if (e.key === 'ArrowLeft') ih.entities.ship.movingLeft = true;
      if (e.key === 'ArrowRight') ih.entities.ship.movingRight = true;
      if (e.key === ' ') { if (ih.launchAllDrones()) ih.systems.intensity.onLaunch(); }
      if (e.key === 'Escape') { ih.session.pause(); ih.systems.intensity.onPause(); return; }
    }

    if (ih.session.state === 'paused') {
      handlePauseKeys(ih, infra, e.key);
      return;
    }

    if (ih.session.state === 'gameOver' && (e.key === 'r' || e.key === ' ')) {
      if (infra.isLabMode()) {
        ih.backToDevPanel();
      } else if (ih.session.currentLevelId) {
        ih.goToWorldMap();
      } else {
        infra.resetMenu();
        ih.session.backToMenu();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (ih.session.state === 'playing') {
      if (e.key === 'ArrowLeft') ih.entities.ship.movingLeft = false;
      if (e.key === 'ArrowRight') ih.entities.ship.movingRight = false;
    }
  });
}

// --- Key handlers par état ---

function handleSystemMapKeys(ih, key) {
  const zones = ih.infra.getAllZones();
  if (key === 'ArrowLeft' && ih.systemMapState.selectedZone > 0) {
    ih.systemMapState.selectedZone--;
  }
  if (key === 'ArrowRight' && ih.systemMapState.selectedZone < zones.length - 1) {
    ih.systemMapState.selectedZone++;
  }
  if (key === ' ' || key === 'Enter') ih.enterSelectedZone();
  if (key === 'Escape' && !ih.infra.isProgressLabActive()) {
    ih.session.backToMenu();
  }
}

function handleWorldMapKeys(ih, key) {
  const levels = ih.infra.getAllLevels(ih.currentZoneId());
  if (key === 'ArrowLeft' && ih.mapState.selectedIndex > 0) {
    ih.mapState.selectedIndex--;
  }
  if (key === 'ArrowRight' && ih.mapState.selectedIndex < levels.length - 1) {
    ih.mapState.selectedIndex++;
  }
  if (key === ' ' || key === 'Enter') ih.launchSelectedLevel();
  if (key === 'u' || key === 'U') ih.goToUpgrade();
  if (key === 'Escape') ih.goToSystemMap();
}

function handleUpgradeKeys(ih, infra, key) {
  if (key === 'ArrowLeft') infra.prevCategory();
  if (key === 'ArrowRight') infra.nextCategory();
  if (key === 'ArrowUp') infra.prevUpgrade();
  if (key === 'ArrowDown') infra.nextUpgrade();
  if (key === ' ' || key === 'Enter') ih.tryBuySelectedUpgrade();
  if (key === 'Escape') ih.goToWorldMap();
}

function handlePauseKeys(ih, infra, key) {
  if (key === 'Escape') { ih.session.resume(); ih.systems.intensity.onResume(); }
  if (infra.isLabMode()) {
    if (key === 'r') ih.backToDevPanel();
  } else {
    if (key === 'c') ih.goToWorldMap();
    if (key === 'r') { infra.resetMenu(); ih.session.backToMenu(); }
  }
}
