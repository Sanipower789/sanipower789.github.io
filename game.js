// Valentine Mini-Game: three levels in one page.

(() => {
  // Elements
  const level1 = document.getElementById('level1');
  const level2 = document.getElementById('level2');
  const level3 = document.getElementById('level3');
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');

  // Level 1: escalating "No"
  const noPhrases = [
    'Bist du sicher?',
    'Ganz sicher?',
    'Wirklich sicher?',
    'Absolut sicher??',
    'Komm schon... 🤨',
    'Sag doch JA!',
    'Letzte Chance! 💕',
    'Ich bring Blumen! 🌹',
    'Schoki wartet! 🍫',
    'Bitteeee? 🥺'
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
    [level1, level2, level3].forEach((el, idx) => {
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
      tile.setAttribute('aria-label', `Tile ${i + 1}`);
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
        finalMessage.textContent = "You found every seal! Happy Valentine's Day! 💞";
        finalMessage.style.display = 'block';
      }
    } else {
      tile.textContent = '💟';
    }
  }

  // Resize adjustments
  window.addEventListener('resize', () => moveBasket(basketX));

  // Start at level 1
  showLevel(1);
})();
