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