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