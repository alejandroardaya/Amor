// ==========================================================
// JUEGO: "Te amo mi amor" - Plataformas de un solo botón
// El personaje avanza SOLO hacia la derecha en todo momento.
// El jugador únicamente puede saltar (espacio o botón táctil)
// para esquivar los huecos/obstáculos y llegar hasta el corazón.
// ==========================================================

(function () {
  // -----------------------------
  // Referencias a elementos del DOM
  // -----------------------------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const winMessage = document.getElementById('winMessage');
  const jumpButton = document.getElementById('jumpButton');

  const W = canvas.width;   // ancho visible del canvas
  const H = canvas.height;  // alto visible del canvas

  // -----------------------------
  // Constantes de física / velocidad
  // -----------------------------
  const GRAVITY = 0.7;
  const JUMP_FORCE = -13;
  const AUTO_SPEED = 1;       // velocidad de avance automático (scroll del mundo)
  const GROUND_Y = H - 60;    // altura del piso base

  // -----------------------------
  // Estado del juego
  // -----------------------------
  let gameRunning = true;
  let cameraX = 0; // cuánto se ha desplazado el "mundo" hacia la izquierda

  // Jugador (su posición X en pantalla es fija, el mundo se mueve)
  const player = {
    screenX: 120,
    y: GROUND_Y - 34,
    w: 30,
    h: 34,
    vy: 0,
    onGround: true
  };

  // Posición del jugador en el "mundo" (coordenada absoluta, no en pantalla)
  let worldX = player.screenX;

  // -----------------------------
  // Diseño del nivel
  // Cada plataforma de piso es un tramo {x, w} en coordenadas del mundo.
  // Los huecos entre tramos son los obstáculos que hay que saltar.
  // -----------------------------
  const groundSegments = [
    { x: 0,    w: 400 },
    { x: 470,  w: 250 },
    { x: 800,  w: 200 },
    { x: 1080, w: 300 },
    { x: 1460, w: 180 },
    { x: 1720, w: 260 },
    { x: 2060, w: 220 },
    { x: 2360, w: 400 },
    { x: 2840, w: 500 } // tramo final donde está el corazón
  ];

  // Bloques elevados (obstáculos que también se pueden saltar por arriba,
  // simplemente decorativos/obstáculo bajo, el jugador los esquiva saltando)
  const lowObstacles = [
    { x: 650,  w: 20, h: 20 },
    { x: 1200, w: 20, h: 20 },
    { x: 1900, w: 20, h: 20 },
    { x: 2500, w: 20, h: 20 }
  ];

  // Corazón (meta final) en coordenadas del mundo
  const heart = { x: 3150, y: GROUND_Y - 50, size: 40 };

  // Largo total del mundo (un poco después del corazón)
  const WORLD_LENGTH = heart.x + 300;

  // -----------------------------
  // Entradas del jugador
  // -----------------------------
  function doJump() {
    if (!gameRunning) return;
    if (player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
    }
  }

  // Teclado: barra espaciadora
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      doJump();
    }
  });

  // Botón táctil / click (para celulares y Safari en general)
  jumpButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    doJump();
  });
  jumpButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    doJump();
  });

  // -----------------------------
  // Utilidad: ¿hay piso debajo de esta posición X del mundo?
  // -----------------------------
  function isGroundAt(worldPosX) {
    return groundSegments.some(seg => worldPosX >= seg.x && worldPosX <= seg.x + seg.w);
  }

  // ¿El jugador choca contra algún obstáculo bajo?
  function hitsLowObstacle() {
    const playerLeft = worldX;
    const playerRight = worldX + player.w;
    const playerBottom = player.y + player.h;

    return lowObstacles.some(obs => {
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.w;
      const obsTop = GROUND_Y - obs.h;
      const overlapX = playerRight > obsLeft && playerLeft < obsRight;
      const overlapY = playerBottom > obsTop;
      return overlapX && overlapY;
    });
  }

  // -----------------------------
  // Reiniciar al jugador si cae en un hueco
  // -----------------------------
  function resetPlayer() {
    worldX = 0;
    cameraX = 0;
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // -----------------------------
  // Actualización del estado cada frame
  // -----------------------------
  function update() {
    if (!gameRunning) return;

    // Avance automático hacia la derecha
    worldX += AUTO_SPEED;
    cameraX = worldX - player.screenX;

    // Gravedad
    player.vy += GRAVITY;
    player.y += player.vy;

    // Chequeo de piso en la posición actual del jugador (usamos su centro)
    const centerX = worldX + player.w / 2;
    const standingOnGround = isGroundAt(centerX);

    if (standingOnGround && player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Si no hay piso y ya cayó por debajo de la pantalla -> reinicia
    if (player.y > H + 50) {
      resetPlayer();
      return;
    }

    // Colisión con obstáculos bajos -> reinicia el recorrido
    if (hitsLowObstacle()) {
      resetPlayer();
      return;
    }

    // Colisión con el corazón (meta) -> GANA
    const heartLeft = heart.x - heart.size / 2;
    const heartRight = heart.x + heart.size / 2;
    const heartTop = heart.y - heart.size / 2;
    const heartBottom = heart.y + heart.size / 2;

    const playerLeft = worldX;
    const playerRight = worldX + player.w;
    const playerTop = player.y;
    const playerBottom = player.y + player.h;

    const overlapX = playerRight > heartLeft && playerLeft < heartRight;
    const overlapY = playerBottom > heartTop && playerTop < heartBottom;

    if (overlapX && overlapY) {
      winGame();
    }
  }

  // -----------------------------
  // Finalizar el juego mostrando el mensaje
  // -----------------------------
  function winGame() {
    gameRunning = false;
    winMessage.classList.remove('hidden');
  }

  // -----------------------------
  // Dibujo de cada frame
  // -----------------------------
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Nubes decorativas (fijas relativas a la cámara, efecto parallax suave)
    drawClouds();

    // Piso (tramos con huecos)
    ctx.fillStyle = '#8d6e63';
    groundSegments.forEach(seg => {
      const screenSegX = seg.x - cameraX;
      if (screenSegX + seg.w > 0 && screenSegX < W) {
        ctx.fillRect(screenSegX, GROUND_Y, seg.w, H - GROUND_Y);
        ctx.fillStyle = '#7cb342';
        ctx.fillRect(screenSegX, GROUND_Y, seg.w, 8);
        ctx.fillStyle = '#8d6e63';
      }
    });

    // Obstáculos bajos
    ctx.fillStyle = '#d6336c';
    lowObstacles.forEach(obs => {
      const screenObsX = obs.x - cameraX;
      if (screenObsX + obs.w > 0 && screenObsX < W) {
        ctx.fillRect(screenObsX, GROUND_Y - obs.h, obs.w, obs.h);
      }
    });

    // Corazón (meta)
    drawHeart(heart.x - cameraX, heart.y);

    // Jugador
    ctx.fillStyle = '#4a4a8a';
    ctx.fillRect(player.screenX, player.y, player.w, player.h);
    // ojitos
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.screenX + 5, player.y + 8, 6, 6);
    ctx.fillRect(player.screenX + 18, player.y + 8, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(player.screenX + 7, player.y + 10, 3, 3);
    ctx.fillRect(player.screenX + 20, player.y + 10, 3, 3);
  }

  // Dibuja un corazón simple usando dos círculos y un triángulo
  function drawHeart(x, y) {
    const s = heart.size / 2;
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.6);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.6);
    ctx.bezierCurveTo(x - s, y + s * 1.3, x, y + s * 1.6, x, y + s * 2);
    ctx.bezierCurveTo(x, y + s * 1.6, x + s, y + s * 1.3, x + s, y + s * 0.6);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.6);
    ctx.fill();
  }

  // Nubes de fondo con parallax leve
  function drawClouds() {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const positions = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
    positions.forEach((baseX, i) => {
      const parallaxX = baseX - cameraX * 0.4;
      const wrapped = ((parallaxX % (W + 200)) + (W + 200)) % (W + 200) - 100;
      const y = 50 + (i % 3) * 20;
      ctx.beginPath();
      ctx.ellipse(wrapped, y, 28, 15, 0, 0, Math.PI * 2);
      ctx.ellipse(wrapped + 22, y + 5, 20, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(wrapped - 22, y + 5, 20, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // -----------------------------
  // Bucle principal del juego
  // -----------------------------
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Inicio
  resetPlayer();
  loop();
})();
