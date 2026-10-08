// Entry Gate 交互：
// 左按钮 → 点击仅改文字，不进入主页
// 右按钮 → 播放低频音效 + 幕布式退场（进入主页）
const entryGate = document.getElementById('entryGate');
const gateBtnLeft = document.getElementById('gateBtnLeft');
const gateBtnRight = document.getElementById('gateBtnRight');

gateBtnLeft.addEventListener('click', () => {
  gateBtnLeft.textContent = 'siuuuuuu!!!';
});

gateBtnRight.addEventListener('click', () => {
  playLowSound();
  entryGate.classList.add('is-exit');
});

function playLowSound() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // 低频：正弦波从 80Hz 滑向 35Hz，短促淡入淡出
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.6);

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.75);
}

// Header：顶部（Hero 上）隐形，一开始滚动就切换为毛玻璃气泡框
const header = document.querySelector('.site-header');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Scroll-driven Hero 横向裁剪收缩：两侧向内收窄到一定比例后停止，
// 文字 font-size 不变、只是背景与文字一起被裁出视野（高度保持 100vh，正常上移）
const heroCard = document.querySelector('.hero-card');

function updateHeroZoom() {
  if (!heroCard) return;
  const vh = window.innerHeight;

  // 首屏滚完即完成收缩
  let p = window.scrollY / vh;
  p = Math.max(0, Math.min(1, p));

  // 非线性：cubic ease-out，收尾更「粘」
  let t = 1 - Math.pow(1 - p, 3);

  // 缩小一段后就停住：两侧最多各裁 4%，最终可见 92% 宽度（良好比例）
  t = Math.min(t, 1);
  const side = t * 4; // 百分比，两侧各裁 side%
  heroCard.style.clipPath = `inset(0 ${side}% 0 ${side}%)`;
}

let heroRaf = null;
function scheduleHeroZoom() {
  if (heroRaf) return;
  heroRaf = requestAnimationFrame(() => {
    heroRaf = null;
    updateHeroZoom();
  });
}

window.addEventListener('scroll', scheduleHeroZoom, { passive: true });
window.addEventListener('resize', scheduleHeroZoom, { passive: true });
updateHeroZoom();

// ============ 兴趣爱好：中央聚焦水平轮播 ============
const carousel = document.getElementById('hobbyCarousel');
if (carousel) {
  const track = document.getElementById('carTrack');
  const cards = Array.from(track.children);
  const prevBtn = document.getElementById('carPrev');
  const nextBtn = document.getElementById('carNext');
  const GAP = 32;

  // 首尾各克隆一张，实现无缝循环
  const cloneFirst = cards[0].cloneNode(true);
  const cloneLast = cards[cards.length - 1].cloneNode(true);
  track.insertBefore(cloneLast, cards[0]);
  track.appendChild(cloneFirst);

  // 克隆后物理下标：1=足球 2=听歌 3=篮球；0/4 为克隆缓冲区
  let pos = 2;
  let cardW = 0;

  function position(animate) {
    track.style.transition = animate
      ? 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none';
    const vw = carousel.clientWidth;
    const step = cardW + GAP;
    track.style.transform = `translateX(${(vw - cardW) / 2 - pos * step}px)`;
  }

  function layout() {
    const vw = carousel.clientWidth;
    const ratio = vw < 700 ? 0.9 : 0.72; // 窄屏卡片更大，桌面中央卡约 72% 宽
    cardW = vw * ratio;
    track.querySelectorAll('.car-card').forEach((c) => {
      c.style.width = cardW + 'px';
    });
    // 箭头骑缝：位于中央卡左右边缘
    const side = (vw - cardW) / 2 - 24;
    prevBtn.style.left = side + 'px';
    nextBtn.style.right = side + 'px';
    position(false);
  }

  function go(delta) {
    pos += delta;
    // 快速连点护栏：一旦越过克隆缓冲区，立刻归位到真实卡，避免滑出空白
    if (pos < 0) pos = cards.length;
    if (pos > cards.length + 1) pos = 1;
    position(true);
    updateDots();
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track || e.propertyName !== 'transform') return;
    // 滑进克隆区后，瞬移回对应的真实卡，形成无缝循环
    if (pos === 0) {
      pos = cards.length; // 3 → 篮球
      position(false);
    } else if (pos === cards.length + 1) { // 4 → 足球
      pos = 1;
      position(false);
    }
  });

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));

  // 分页指示器：底部圆点，当前页拉伸为胶囊
  const dotsWrap = document.getElementById('carDots');
  const dots = [];
  for (let i = 0; i < cards.length; i++) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'car-dot';
    dot.setAttribute('aria-label', '跳到第 ' + (i + 1) + ' 张');
    dot.addEventListener('click', () => {
      pos = i + 1;
      position(true);
      updateDots();
    });
    dotsWrap.appendChild(dot);
    dots.push(dot);
  }

  function updateDots() {
    const active = (pos - 1 + cards.length) % cards.length;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  }
  updateDots();

  window.addEventListener('resize', layout);
  layout();
}

// ============ My hobbies 打字机效果：滚动进视野后再逐字打出 ============
const hobbyType = document.getElementById('hobbyType');
if (hobbyType) {
  const fullText = 'My hobbies...';
  let typed = false;

  function typeOnce() {
    if (typed) return;
    typed = true;
    let i = 0;
    function step() {
      hobbyType.textContent = fullText.slice(0, i);
      i++;
      if (i <= fullText.length) setTimeout(step, 140);
    }
    step();
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          typeOnce();
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(hobbyType);
  } else {
    typeOnce();
  }
}

// ============ Hero 流动光晕：canvas 光尘粒子，像水/沙一样向四周荡开、消散 ============
const heroEl = document.getElementById('hero');
const heroLight = document.getElementById('heroLight');
if (heroEl && heroLight) {
  const ctx = heroLight.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = heroEl.clientWidth;
    H = heroEl.clientHeight;
    heroLight.width = W * dpr;
    heroLight.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // 预渲染一颗柔光「光点」精灵，粒子批量 drawImage 省性能
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 128;
  const sctx = sprite.getContext('2d');
  const g = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(200, 224, 255, 0.45)');
  g.addColorStop(0.35, 'rgba(158, 205, 255, 0.24)');
  g.addColorStop(1, 'rgba(140, 190, 255, 0)');
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, 128, 128);

  // 光心（带惯性的平滑坐标）；粒子为向外漾开的「光尘」
  let tx = 0, ty = 0, mx = -999, my = -999;
  let prevX = -999, prevY = -999;
  let vx = 0, vy = 0;
  let active = false;
  const particles = [];

  heroEl.addEventListener('pointermove', (e) => {
    const r = heroEl.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    if (!active) { mx = tx; my = ty; vx = 0; vy = 0; prevX = tx; prevY = ty; } // 首次进入直接落位，并复位上一帧路径，避免首帧拉出长线
    active = true;
    heroLight.style.opacity = '1';
  });

  heroEl.addEventListener('pointerleave', () => {
    active = false;
    heroLight.style.opacity = '0';
  });

  function rand(a, b) { return a + Math.random() * (b - a); }
  function draw(x, y, size, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  }

  (function tick() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; // 不叠加：重叠处亮度封顶，避免静止时刺眼

    if (active) {
      // 惯性跟手：弹簧物理，带动量与轻微过冲
      vx += (tx - mx) * 0.06;
      vy += (ty - my) * 0.06;
      vx *= 0.86;
      vy *= 0.86;
      mx += vx;
      my += vy;

      // 沿移动路径补点撒尘，形成连续光带，快速甩动也不断线
      const move = Math.hypot(mx - prevX, my - prevY);
      if (move > 0.2) {
        const segs = Math.max(1, Math.round(move / 6)); // 每约 6px 补一段点位
        for (let s = 0; s < segs; s++) {
          const k = s / segs;
          const sx = prevX + (mx - prevX) * k;
          const sy = prevY + (my - prevY) * k;
          for (let i = 0; i < 2; i++) {
            particles.push({
              x: sx + rand(-8, 8),
              y: sy + rand(-8, 8),
              vx: rand(-1.4, 1.4),
              vy: rand(-1.4, 1.4),
              life: 0,
              maxLife: rand(70, 120),
              size: rand(24, 48)
            });
          }
        }
      }
      prevX = mx;
      prevY = my;

      // 光心柔光
      draw(mx, my, 340, 0.10);
    }

    // 更新并绘制粒子：向外飘散、逐渐变大变淡，最后熄灭
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.975; // 摩擦：值越大衰减越慢，光尘飘得更远
      p.vy *= 0.975;
      const t = p.life / p.maxLife;
      draw(p.x, p.y, p.size + t * 190, (1 - t) * 0.12);
      if (t >= 1) particles.splice(i, 1);
    }

    requestAnimationFrame(tick);
  })();
}

// ============ 磁吸按钮：鼠标靠近时按钮向鼠标方向轻微吸附，离开后回弹 ============
const magneticBtn = document.querySelector('.nav-feedback');
if (magneticBtn) {
  const strength = 0.35; // 吸附强度：偏移 = 按钮中心到鼠标距离的 35%
  magneticBtn.addEventListener('mousemove', (e) => {
    const r = magneticBtn.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    magneticBtn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
  });
  magneticBtn.addEventListener('mouseleave', () => {
    magneticBtn.style.transform = 'translate(0, 0)';
  });
}

// ============ 兴趣爱好卡片 3D 倾斜：朝鼠标方向倾斜（最大 12 度），内容浮于表面，离开缓弹 ============
const carTrack = document.getElementById('carTrack');
if (carTrack) {
  const MAX_TILT = 6;
  carTrack.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.car-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rotX = (py - 0.5) * 2 * MAX_TILT; // 鼠标在上，上边缘翘起
    const rotY = (0.5 - px) * 2 * MAX_TILT; // 鼠标在右，右边缘翘起
    card.style.transition = 'transform 0.08s ease-out'; // 跟手时近乎即时
    card.style.transform = `perspective(750px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-8px)`;
  });
  carTrack.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.car-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.transition = ''; // 恢复 CSS 的 0.6s 缓弹
      card.style.transform = '';
    }
  });
}