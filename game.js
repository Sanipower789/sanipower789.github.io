// Valentine Mini-Game: three levels in one page.

(() => {
  // Elements
  const level1 = document.getElementById('level1');
  const level2 = document.getElementById('level2');
  const level3 = document.getElementById('level3');
  const level4 = document.getElementById('level4');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');

  // Level 1: escalating "No"
  const noPhrases = [
    'Are you sure?',
    'Like, really sure?',
    'Super sure?',
    '100% sure??',
    'Think again... 🤨',
    'Pretty please?',
    'I’ll bring flowers! 🌹',
    'There will be chocolate! 🍫',
    'A playlist is ready! 🎵',
    'We would be cute together!',
    'Okay, now you’re teasing me!',
    'Final final chance! 💕'
  ];
  let noClicks = 0;

  noBtn.addEventListener('click', () => {
    noClicks++;
    const phrase = noPhrases[Math.min(noClicks - 1, noPhrases.length - 1)];
    noBtn.textContent = phrase;

    // Make No smaller and Yes bigger after several clicks
    if (noClicks >= 2) {
      const shrink = Math.max(0.65, 1 - (noClicks - 1) * 0.08);
      const grow = 1 + Math.min(0.9, (noClicks - 1) * 0.18);
      noBtn.style.transform = `scale(${shrink})`;
      yesBtn.style.transform = `scale(${grow})`;
    }
    if (noClicks >= noPhrases.length + 2) {
      noBtn.disabled = true;
      noBtn.style.opacity = 0.5;
    }
  });

  yesBtn.addEventListener('click', () => {
    showLevel(2);
    startCatchGame();
  });

  function showLevel(n) {
    [level1, level2, level3, level4].forEach((el, idx) => {
      el.classList.toggle('active', idx === n - 1);
    });
  }

  // Level 2: Catch game
  const catchArea = document.getElementById('catchArea');
  const basket = document.getElementById('basket');
  const catchScore = document.getElementById('catchScore');
  let basketX = catchArea.clientWidth / 2;
  let pods = [];
  let catchCount = 0;
  let spawnTimer = null;
  let rafId = null;
  const targetCatches = 10;

  function startCatchGame() {
    resetCatchGame();
    spawnTimer = setInterval(spawnPod, 900);
    rafId = requestAnimationFrame(tick);
  }

  function resetCatchGame() {
    pods.forEach(p => p.el.remove());
    pods = [];
    catchCount = 0;
    catchScore.textContent = `0 / ${targetCatches}`;
    moveBasket(catchArea.clientWidth / 2);
  }

  function spawnPod() {
    const el = document.createElement('div');
    el.className = 'pod';
    el.textContent = '🫛';
    const size = 30;
    const x = Math.random() * (catchArea.clientWidth - size) + size / 2;
    el.style.left = `${x}px`;
    catchArea.appendChild(el);
    pods.push({ el, x, y: -40, speed: 1.0 + Math.random() * 0.6 });
  }

  function tick() {
    pods.forEach((p, i) => {
      p.y += p.speed * 3.2; // fall speed (slower for easier play)
      p.el.style.transform = `translate(-50%, ${p.y}px)`;
      // Collision with basket
      const basketRect = basket.getBoundingClientRect();
      const podRect = p.el.getBoundingClientRect();
      if (rectsOverlap(basketRect, podRect)) {
        catchArea.removeChild(p.el);
        pods.splice(i, 1);
        catchCount++;
        catchScore.textContent = `${catchCount} / ${targetCatches}`;
        checkCatchWin();
      } else if (p.y > catchArea.clientHeight + 60) {
        catchArea.removeChild(p.el);
        pods.splice(i, 1);
      }
    });
    rafId = requestAnimationFrame(tick);
  }

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function checkCatchWin() {
    if (catchCount >= targetCatches) {
      clearInterval(spawnTimer);
      cancelAnimationFrame(rafId);
      setTimeout(() => {
        showLevel(3);
        buildSealGrid();
      }, 350);
    }
  }

  // Basket movement (touch + mouse fallback)
  const drag = { active: false, offset: 0 };
  basket.addEventListener('touchstart', startDrag, { passive: true });
  basket.addEventListener('touchmove', onDrag, { passive: false });
  basket.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchend', endDrag);

  function startDrag(e) {
    drag.active = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const basketRect = basket.getBoundingClientRect();
    drag.offset = clientX - (basketRect.left + basketRect.width / 2);
  }

  function onDrag(e) {
    if (!drag.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const areaRect = catchArea.getBoundingClientRect();
    const x = clientX - areaRect.left - drag.offset;
    moveBasket(x);
    if (e.cancelable) e.preventDefault();
  }

  function endDrag() {
    drag.active = false;
  }

  function moveBasket(x) {
    const half = basket.offsetWidth / 2;
    const clamped = Math.max(half, Math.min(catchArea.clientWidth - half, x));
    basketX = clamped;
    basket.style.left = `${clamped}px`;
  }

  // Level 3: Seal hunt
  const gridEl = document.getElementById('grid');
  const sealScore = document.getElementById('sealScore');
  const finalMessage = document.getElementById('finalMessage');
  const gridSize = 16; // 4x4
  const sealsTotal = 5;
  let sealsFound = 0;
  let sealPositions = new Set();

  function buildSealGrid() {
    gridEl.innerHTML = '';
    sealsFound = 0;
    finalMessage.style.display = 'none';
    sealPositions = new Set(pickUnique(sealsTotal, gridSize));
    sealScore.textContent = `0 / ${sealsTotal}`;
    for (let i = 0; i < gridSize; i++) {
      const tile = document.createElement('button');
      tile.className = 'tile';
      tile.setAttribute('aria-label', `Kachel ${i + 1}`);
      tile.addEventListener('click', () => revealTile(tile, i));
      gridEl.appendChild(tile);
    }
  }

  function pickUnique(count, max) {
    const set = new Set();
    while (set.size < count) set.add(Math.floor(Math.random() * max));
    return set;
  }

  function revealTile(tile, index) {
    if (tile.classList.contains('revealed')) return;
    tile.classList.add('revealed');
    if (sealPositions.has(index)) {
      tile.textContent = '🦭';
      sealsFound++;
      sealScore.textContent = `${sealsFound} / ${sealsTotal}`;
      if (sealsFound === sealsTotal) {
        finalMessage.style.display = 'none';
        startMazeLevel(); // jump straight to maze
      }
    } else {
      tile.textContent = '💟';
    }
  }

  // Resize adjustments
  window.addEventListener('resize', () => moveBasket(basketX));

  // Start at level 1
  showLevel(1);

  // Level 4: Heart maze
  const mazeGrid = document.getElementById('mazeGrid');
  const moveCountEl = document.getElementById('moveCount');
  const mazeStatus = document.getElementById('mazeStatus');
  const mazeReset = document.getElementById('mazeReset');
  const mazeLayout = [
    '#######',
    '#S...G#',
    '#.#.#.#',
    '#.#...#',
    '#.###.#',
    '#.....#',
    '#######'
  ];
  let playerPos = { r: 0, c: 0 };
  let goalPos = { r: 0, c: 0 };
  let mazeCells = [];
  let mazeMoves = 0;
  let mazeWon = false;

  function startMazeLevel() {
    buildMaze();
    mazeMoves = 0;
    mazeWon = false;
    updateMoves();
    mazeStatus.style.display = 'none';
    showLevel(4);
  }

  function buildMaze() {
    mazeGrid.innerHTML = '';
    mazeCells = [];
    mazeLayout.forEach((rowStr, r) => {
      const rowCells = [];
      [...rowStr].forEach((ch, c) => {
        const cell = document.createElement('div');
        cell.className = 'maze-cell';
        if (ch === '#') cell.classList.add('wall');
        if (ch === 'G') {
          cell.classList.add('goal');
          cell.textContent = '🎯';
          goalPos = { r, c };
        }
        if (ch === 'S') {
          playerPos = { r, c };
        }
        mazeGrid.appendChild(cell);
        rowCells.push(cell);
      });
      mazeCells.push(rowCells);
    });
    paintPlayer();
  }

  function paintPlayer() {
    mazeCells.flat().forEach((cell, idx) => {
      cell.classList.remove('player');
      const r = Math.floor(idx / mazeLayout[0].length);
      const c = idx % mazeLayout[0].length;
      const isGoal = goalPos.r === r && goalPos.c === c;
      cell.textContent = isGoal ? '🎯' : '';
    });
    const cell = mazeCells[playerPos.r][playerPos.c];
    cell.classList.add('player');
    cell.textContent = '❤️';
  }

  function updateMoves() {
    moveCountEl.textContent = `${mazeMoves} Züge`;
  }

  function tryMove(dr, dc) {
    if (mazeWon) return;
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;
    if (nr < 0 || nc < 0 || nr >= mazeLayout.length || nc >= mazeLayout[0].length) return;
    if (mazeLayout[nr][nc] === '#') return;
    playerPos = { r: nr, c: nc };
    mazeMoves++;
    updateMoves();
    paintPlayer();
    checkMazeWin();
  }

  function checkMazeWin() {
    if (playerPos.r === goalPos.r && playerPos.c === goalPos.c) {
      mazeWon = true;
      mazeStatus.textContent = 'Geschafft! Das Herz ist am Ziel! 💖';
      mazeStatus.style.display = 'block';
    }
  }

  // Swipe controls
  let touchStart = null;
  mazeGrid.addEventListener('touchstart', e => {
    if (!level4.classList.contains('active')) return;
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  mazeGrid.addEventListener('touchend', e => {
    if (!level4.classList.contains('active')) return;
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const threshold = 20;
    if (absX < threshold && absY < threshold) return;
    if (absX > absY) {
      tryMove(0, dx > 0 ? 1 : -1);
    } else {
      tryMove(dy > 0 ? 1 : -1, 0);
    }
    touchStart = null;
  }, { passive: true });

  // Keyboard arrows fallback
  window.addEventListener('keydown', e => {
    if (!level4.classList.contains('active')) return;
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') tryMove(-1, 0);
    if (key === 'arrowdown' || key === 's') tryMove(1, 0);
    if (key === 'arrowleft' || key === 'a') tryMove(0, -1);
    if (key === 'arrowright' || key === 'd') tryMove(0, 1);
  });

  mazeReset.addEventListener('click', startMazeLevel);
})();
