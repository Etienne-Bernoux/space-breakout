// --- Pointer handlers (tap, drag, release) ---
// Callbacks enregistrés sur le pointer pour les interactions touch/souris.

/** Enregistre les handlers tap, menuTap, drag, release sur l'infra pointer. */
export function bindPointerHandlers(ih) {
  const infra = ih.infra;

  infra.setTapHandler((x, y) => {
    if (ih.session.state === 'playing') {
      const pb = ih.pauseBtnLayout();
      if (x >= pb.x && x <= pb.x + pb.size &&
          y >= pb.y && y <= pb.y + pb.size) {
        ih.session.pause();
        ih.systems.intensity.onPause();
        return;
      }
      if (ih.launchAllDrones()) ih.systems.intensity.onLaunch();
    }
    if (ih.session.state === 'gameOver') {
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

  infra.setMenuTapHandler((x, y) => {
    if (infra.isLabHubActive()) return;
    if (infra.isMusicLabActive()) return;
    if (infra.isDevPanelActive()) return;

    const state = ih.session.state;
    if (state === 'menu') {
      const action = infra.handleMenuTap(x, y);
      if (action === 'play') ih.goToSystemMap();
    }
    if (state === 'systemMap')  handleSystemMapTap(ih, x, y);
    if (state === 'worldMap')   handleWorldMapTap(ih, x, y);
    if (state === 'upgrade')    handleUpgradeTap(ih, x, y);
    if (state === 'stats')      handleStatsTap(ih, x, y);
    if (state === 'paused')     handlePauseTap(ih, x, y);
  });

  infra.setDragHandler((x, y) => {
    if (infra.isDevPanelActive()) return;
    if (ih.session.state === 'menu') infra.handleMenuDrag(x, y);
  });

  infra.setReleaseHandler(() => {
    if (infra.isDevPanelActive()) return;
    infra.handleMenuRelease();
  });
}

// --- Tap handlers par état ---

function handleSystemMapTap(ih, x, y) {
  const zones = ih.infra.getAllZones();
  const nodes = ih.infra.getSystemNodePositions(ih.canvas.width, ih.canvas.height, zones);
  const r = 28;
  for (let i = 0; i < nodes.length; i++) {
    const dx = x - nodes[i].x, dy = y - nodes[i].y;
    if (dx * dx + dy * dy < r * r && ih.progress.isZoneUnlocked(zones[i].id)) {
      ih.systemMapState.selectedZone = i;
      ih.enterSelectedZone();
      return;
    }
  }
}

function handleWorldMapTap(ih, x, y) {
  const atelierBtn = ih.infra.getUpgradeButtonRect(ih.canvas.width, ih.canvas.height);
  if (hitBtn(x, y, atelierBtn)) { ih.goToUpgrade(); return; }

  const levels = ih.infra.getAllLevels(ih.currentZoneId());
  const nodes = ih.infra.getNodePositions(ih.canvas.width, ih.canvas.height, levels.length);
  const r = 22;
  for (let i = 0; i < nodes.length; i++) {
    const dx = x - nodes[i].x, dy = y - nodes[i].y;
    if (dx * dx + dy * dy < r * r && ih.progress.isUnlocked(levels[i].id)) {
      ih.mapState.selectedIndex = i;
      ih.launchSelectedLevel();
      return;
    }
  }
}

function handleUpgradeTap(ih, x, y) {
  const infra = ih.infra;
  const upgList = infra.getVisibleUpgrades();
  const btns = infra.getUpgradeScreenButtons(ih.canvas.width, ih.canvas.height, upgList.length);

  for (let i = 0; i < btns.tabs.length; i++) {
    if (hitBtn(x, y, btns.tabs[i])) { infra.nextCategory(); return; }
  }
  if (hitBtn(x, y, btns.buyBtn)) { ih.tryBuySelectedUpgrade(); return; }
  for (let i = 0; i < btns.items.length; i++) {
    if (hitBtn(x, y, btns.items[i])) { infra.selectUpgrade(i); return; }
  }
  if (hitBtn(x, y, btns.backBtn)) ih.goToWorldMap();
}

function handleStatsTap(ih, x, y) {
  const btns = ih.infra.getStatsButtons(ih.canvas.width, ih.canvas.height);
  if (hitBtn(x, y, btns.next)) ih.nextLevelOrMap();
  else if (hitBtn(x, y, btns.map)) ih.statsToMap();
}

function handlePauseTap(ih, x, y) {
  const { resumeBtn, mapBtn, menuBtn } = ih.pauseScreenLayout();
  if (hitBtn(x, y, resumeBtn)) {
    ih.session.resume();
    ih.systems.intensity.onResume();
  }
  if (ih.infra.isLabMode()) {
    if (hitBtn(x, y, mapBtn)) ih.backToDevPanel();
  } else {
    if (hitBtn(x, y, mapBtn)) ih.goToWorldMap();
    if (hitBtn(x, y, menuBtn)) { ih.infra.resetMenu(); ih.session.backToMenu(); }
  }
}

/** Test hit rectangle. */
export function hitBtn(x, y, btn) {
  return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
}
