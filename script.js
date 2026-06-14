/* ============================================
   小盒子 · Xiaohezi — Game Engine v2
   Neko Atsume 风格 · 开盒仪式 · 丰富交互
   ============================================ */

// =============================================
// AUDIO ENGINE
// =============================================
class AudioEngine {
  constructor() { this.ctx = null; this.enabled = true; }
  _ctx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  _tone(freq, dur, type='sine', vol=0.12, ramp=true, delay=0) {
    if (!this.enabled) return;
    try {
      const ctx = this._ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      g.gain.setValueAtTime(vol, ctx.currentTime + delay);
      if (ramp) g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + delay);
      o.stop(ctx.currentTime + delay + dur);
    } catch(e) {}
  }
  _noise(dur, vol=0.04) {
    if (!this.enabled) return;
    try {
      const ctx = this._ctx();
      const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(400, ctx.currentTime);
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      src.connect(filter); filter.connect(g); g.connect(ctx.destination);
      src.start(); src.stop(ctx.currentTime + dur);
    } catch(e) {}
  }

  // Box idle float — very subtle
  boxFloat() { this._tone(120, 0.3, 'sine', 0.03); }

  // Box shake — low rumble
  shake() {
    this._noise(0.7, 0.06);
    this._tone(70, 0.8, 'sine', 0.06, true, 0);
    this._tone(55, 0.9, 'triangle', 0.04, true, 0.1);
  }

  // Glow emerging — rising shimmer
  glowEmerging() {
    this._tone(440, 0.5, 'sine', 0.06, true, 0);
    this._tone(554, 0.4, 'sine', 0.05, true, 0.15);
    this._tone(660, 0.3, 'sine', 0.04, true, 0.3);
  }

  // Lid open — bright chime
  lidOpen() {
    this._tone(660, 0.3, 'sine', 0.1, true, 0);
    this._tone(880, 0.4, 'sine', 0.08, true, 0.1);
    this._tone(1100, 0.5, 'sine', 0.06, true, 0.2);
  }

  // Character emerge — sparkle scale
  charEmerge() {
    const notes = [880, 1040, 1320, 1560, 1760];
    notes.forEach((f,i) => this._tone(f, 0.5, 'sine', 0.05, true, i * 0.07));
  }

  // Tap body — pop
  tapBody() {
    this._tone(600, 0.1, 'sine', 0.08, true, 0);
    this._tone(800, 0.12, 'sine', 0.06, true, 0.04);
  }

  // Tap head — softer
  tapHead() {
    this._tone(500, 0.12, 'triangle', 0.06, true, 0);
    this._tone(700, 0.15, 'triangle', 0.04, true, 0.06);
  }

  // Spin — whirly
  spin() {
    this._tone(400, 0.15, 'sine', 0.06, true, 0);
    this._tone(500, 0.15, 'sine', 0.06, true, 0.1);
    this._tone(600, 0.2, 'sine', 0.05, true, 0.2);
  }

  // Heart burst
  heart() {
    this._tone(523, 0.15, 'triangle', 0.07, true, 0);
    this._tone(659, 0.2, 'triangle', 0.06, true, 0.08);
    this._tone(784, 0.3, 'triangle', 0.04, true, 0.16);
  }
}
const audio = new AudioEngine();

// =============================================
// GENTLE MESSAGES
// =============================================
const QUOTES = [
  '今天也很好。','你已经做得很好了，真的。',
  '不赶时间，慢慢来。','焦虑是多余的，你已经足够好了。',
  '休息不是偷懒，是给自己充电。','今天的你也很可爱。',
  '不用急着成为谁，你已经是了。','有些日子就是用来浪费的。',
  '你已经走了很远，别急着跑。','允许自己偶尔什么都不想。',
  '不是每一天都要有意义。','做一颗安安静静的小东西，也挺好。',
  '温柔地对待自己。','别太用力，生活会自己找到答案。',
  '今天是值得的一天，因为你来了。','深呼吸，你已经很棒了。',
  '偶尔掉队也没关系。','快乐不用很大，小小的就够了。',
  '你已经比昨天的自己多走了一步。','不用完美，完整就好。',
  '看到你真好。','有些美好，就藏在什么也不做里。',
  '记得喝水，记得休息，记得笑。','你的存在本身就是意义。',
  '没什么大不了的，反正明天还有新的盲袋。','安安静静地发光就好。',
  '世界很大，但你不用一个人扛。'
];

// =============================================
// CHARACTER DEFINITIONS — 6 normal + 1 hidden
// Neko Atsume inspired: soft, layered, minimal-charming
// Each SVG has CSS-animatable parts:
//   .char-body, .char-head, .char-eyes, .char-cheeks,
//   .char-mouth, .char-accessory, .char-highlight
// =============================================

function makeCharSVG(char, size, state='idle') {
  const s = char.colors;
  const mouthMap = {
    happy:  char.mouthHappy  || char.mouth,
    shy:    char.mouthShy    || char.mouth,
    sleepy: char.mouthSleepy || char.mouth,
    spin:   char.mouthSpin   || char.mouth,
    confused: char.mouthConfused || char.mouth,
    idle:   char.mouth
  };
  const mouth = mouthMap[state] || char.mouth;
  const eyeScaleY = (state === 'sleepy') ? 0.12 : (state === 'shy') ? 0.6 : 1;
  const cheekOpacity = (state === 'shy') ? 0.8 : (state === 'sleepy') ? 0.2 : 0.35;

  return `<svg viewBox="0 0 160 160" width="${size}" height="${size}">
    <defs>
      <radialGradient id="bodyGrad-${char.id}" cx="40%" cy="35%" r="55%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="shadowGrad-${char.id}" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#000" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <filter id="softShadow-${char.id}">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.08"/>
      </filter>
      ${s.glowColor ? `
      <filter id="glow-${char.id}">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>` : ''}
    </defs>

    <!-- Ground shadow -->
    <ellipse cx="80" cy="138" rx="36" ry="10" fill="url(#shadowGrad-${char.id})" class="char-shadow"/>

    <!-- Body group -->
    <g class="char-body" filter="url(#softShadow-${char.id})">
      ${char.bodySVG(s)}
      <g class="char-highlight">
        <ellipse cx="72" cy="${char.highlightY || 65}" rx="${char.highlightRX || 28}" ry="${char.highlightRY || 24}" fill="url(#bodyGrad-${char.id})"/>
      </g>
    </g>

    <!-- Head group (for nodding) -->
    <g class="char-head">

      <!-- Accessory -->
      <g class="char-accessory">${char.accessorySVG ? char.accessorySVG(s) : ''}</g>

      <!-- Cheeks (for blush) -->
      <g class="char-cheeks" opacity="${cheekOpacity}">
        <ellipse cx="${char.cheekLX || 55}" cy="${char.cheekY || 82}" rx="8" ry="5" fill="${s.cheek}"/>
        <ellipse cx="${char.cheekRX || 105}" cy="${char.cheekY || 82}" rx="8" ry="5" fill="${s.cheek}"/>
      </g>

      <!-- Eyes (for blink) -->
      <g class="char-eyes" style="transform-origin:center;transform:scaleY(${eyeScaleY})">
        ${char.eyesSVG ? char.eyesSVG(s) : `
          <ellipse cx="${char.eyeLX || 62}" cy="${char.eyeY || 74}" rx="5.5" ry="5.5" fill="${s.eyeDark}"/>
          <ellipse cx="${char.eyeRX || 98}" cy="${char.eyeY || 74}" rx="5.5" ry="5.5" fill="${s.eyeDark}"/>
          <circle cx="${char.eyeLX+1.5 || 63.5}" cy="${char.eyeY-1.5 || 72.5}" r="2" fill="#fff"/>
          <circle cx="${char.eyeRX+1.5 || 99.5}" cy="${char.eyeY-1.5 || 72.5}" r="2" fill="#fff"/>
        `}
      </g>

      <!-- Mouth -->
      <g class="char-mouth">${mouth}</g>

    </g>

    ${s.glowParticles ? s.glowParticles(s) : ''}
  </svg>`;
}

const CHARACTERS = [
  // ===== 圆圆 — 桃色糯米团 =====
  {
    id: 'yuanyuan', name: '圆圆', tagline: '软乎乎的，喜欢晒太阳', rarity: 'normal',
    colors: { primary: '#FFB8AD', shadow: '#E89888', accent: '#FF8C7A', cheek: '#FFAB91', eyeDark: '#5D4037' },
    highlightY: 62, highlightRX: 30, highlightRY: 26,
    eyeLX: 60, eyeRX: 100, eyeY: 72, cheekLX: 52, cheekRX: 108, cheekY: 82,
    bodySVG(s) {
      return `<ellipse cx="80" cy="78" rx="48" ry="44" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>
        <ellipse cx="46" cy="46" rx="14" ry="12" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>
        <ellipse cx="114" cy="46" rx="14" ry="12" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>`;
    },
    eyesSVG(s) {
      return `<ellipse cx="60" cy="72" rx="5.5" ry="5.5" fill="${s.eyeDark}"/>
        <ellipse cx="100" cy="72" rx="5.5" ry="5.5" fill="${s.eyeDark}"/>
        <circle cx="62" cy="70" r="2.2" fill="#fff"/><circle cx="102" cy="70" r="2.2" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<path d="M80 120 Q82 140 75 148" fill="none" stroke="${s.shadow}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`;
    },
    mouth: '<path d="M72 86 Q80 94 88 86" fill="none" stroke="#5D4037" stroke-width="2.2" stroke-linecap="round"/>',
    mouthHappy: '<path d="M70 86 Q80 98 90 86" fill="none" stroke="#5D4037" stroke-width="2.2" stroke-linecap="round"/>',
    mouthShy: '<path d="M74 88 Q80 85 86 88" fill="none" stroke="#5D4037" stroke-width="1.8" stroke-linecap="round"/>',
    mouthSleepy: '<ellipse cx="80" cy="87" rx="4" ry="3" fill="#5D4037" opacity="0.6"/>',
  },

  // ===== 豆豆 — 绿豆芽 =====
  {
    id: 'doudou', name: '豆豆', tagline: '一颗小豆子，有点害羞', rarity: 'normal',
    colors: { primary: '#B5DCC0', shadow: '#7FB890', accent: '#6AAF7A', cheek: '#C8E6C9', eyeDark: '#3E2723', leaf: '#66BB6A' },
    highlightY: 58, highlightRX: 22, highlightRY: 30,
    eyeLX: 58, eyeRX: 98, eyeY: 70, cheekLX: 50, cheekRX: 106, cheekY: 80,
    bodySVG(s) {
      return `<ellipse cx="80" cy="72" rx="32" ry="42" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2.2"/>`;
    },
    eyesSVG(s) {
      return `<ellipse cx="58" cy="70" rx="4" ry="4.5" fill="${s.eyeDark}"/>
        <ellipse cx="98" cy="70" rx="4" ry="4.5" fill="${s.eyeDark}"/>
        <circle cx="59.5" cy="68" r="1.6" fill="#fff"/><circle cx="99.5" cy="68" r="1.6" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<ellipse cx="80" cy="32" rx="7" ry="12" fill="${s.leaf}" stroke="#4CAF50" stroke-width="1.8"/>
        <path d="M73 32 Q80 20 87 32" fill="none" stroke="#4CAF50" stroke-width="1.5" stroke-linecap="round"/>`;
    },
    mouth: '<path d="M74 78 Q80 82 86 78" fill="none" stroke="#3E2723" stroke-width="1.8" stroke-linecap="round"/>',
    mouthHappy: '<path d="M72 78 Q80 88 88 78" fill="none" stroke="#3E2723" stroke-width="1.8" stroke-linecap="round"/>',
    mouthShy: '<ellipse cx="80" cy="80" rx="3" ry="2" fill="#3E2723" opacity="0.5"/>',
    mouthSleepy: '<ellipse cx="80" cy="80" rx="3.5" ry="2.5" fill="#3E2723" opacity="0.4"/>',
  },

  // ===== 泡泡 — 蓝色气泡 =====
  {
    id: 'paopao', name: '泡泡', tagline: '轻飘飘的，一戳就会笑', rarity: 'normal',
    colors: { primary: '#C0E4F5', shadow: '#7EB8D0', accent: '#68B8D0', cheek: '#DDF0FA', eyeDark: '#37474F' },
    highlightY: 62, highlightRX: 26, highlightRY: 22,
    eyeLX: 60, eyeRX: 96, eyeY: 72, cheekLX: 52, cheekRX: 104, cheekY: 82,
    bodySVG(s) {
      return `<circle cx="80" cy="76" r="44" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>`;
    },
    eyesSVG(s) {
      return `<circle cx="60" cy="72" r="5.5" fill="${s.eyeDark}"/>
        <circle cx="96" cy="72" r="5.5" fill="${s.eyeDark}"/>
        <circle cx="62" cy="70" r="2.2" fill="#fff"/><circle cx="98" cy="70" r="2.2" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<circle cx="80" cy="34" r="10" fill="none" stroke="#fff" stroke-width="3" opacity="0.6"/>
        <path d="M74 28 Q80 20 86 28" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>`;
    },
    mouth: '<circle cx="80" cy="84" r="3" fill="#37474F" opacity="0.5"/>',
    mouthHappy: '<path d="M72 84 Q80 94 88 84" fill="none" stroke="#37474F" stroke-width="2.2" stroke-linecap="round"/>',
    mouthShy: '<circle cx="80" cy="85" r="2.5" fill="#37474F" opacity="0.35"/>',
    mouthSleepy: '<ellipse cx="80" cy="85" rx="3.5" ry="2.5" fill="#37474F" opacity="0.3"/>',
  },

  // ===== 团团 — 奶白糖果 =====
  {
    id: 'tuantuan', name: '团团', tagline: '白白胖胖，像个糯米团子', rarity: 'normal',
    colors: { primary: '#FFF5E8', shadow: '#E0CEB0', accent: '#F0E0C8', cheek: '#FFD8C0', eyeDark: '#5D4037', scarf: '#E88070' },
    highlightY: 64, highlightRX: 32, highlightRY: 28,
    eyeLX: 60, eyeRX: 100, eyeY: 72, cheekLX: 50, cheekRX: 110, cheekY: 82,
    bodySVG(s) {
      return `<ellipse cx="80" cy="78" rx="50" ry="46" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>
        <ellipse cx="48" cy="44" rx="11" ry="9" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>
        <ellipse cx="112" cy="44" rx="11" ry="9" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>`;
    },
    eyesSVG(s) {
      return `<circle cx="60" cy="72" r="5" fill="${s.eyeDark}"/>
        <circle cx="100" cy="72" r="5" fill="${s.eyeDark}"/>
        <circle cx="61.5" cy="70" r="2" fill="#fff"/><circle cx="101.5" cy="70" r="2" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<path d="M58 50 Q80 44 102 50" fill="none" stroke="${s.scarf}" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
        <path d="M100 50 Q106 52 104 62" fill="none" stroke="${s.scarf}" stroke-width="4.5" stroke-linecap="round" opacity="0.7"/>`;
    },
    mouth: '<path d="M72 86 Q80 92 88 86" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>',
    mouthHappy: '<path d="M70 86 Q80 98 90 86" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>',
    mouthShy: '<ellipse cx="80" cy="88" rx="3.5" ry="2.5" fill="#5D4037" opacity="0.4"/>',
    mouthSleepy: '<ellipse cx="80" cy="88" rx="4" ry="3" fill="#5D4037" opacity="0.35"/>',
  },

  // ===== 绵绵 — 紫色云朵 =====
  {
    id: 'mianmian', name: '绵绵', tagline: '像一朵云，安安静静待着', rarity: 'normal',
    colors: { primary: '#D8CDF0', shadow: '#A898C8', accent: '#C0B0E0', cheek: '#E8DDF8', eyeDark: '#4A3F5C' },
    highlightY: 60, highlightRX: 30, highlightRY: 24,
    eyeLX: 60, eyeRY: 88, eyeRX: 100, eyeY: 70, cheekLX: 52, cheekRX: 108, cheekY: 80,
    bodySVG(s) {
      return `<path d="M36 80 Q32 40 80 32 Q110 30 122 50 Q128 72 120 88 Q126 110 104 120 Q80 130 56 120 Q34 108 36 80Z"
        fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>`;
    },
    eyesSVG(s) {
      return `<ellipse cx="58" cy="70" rx="5" ry="5.5" fill="${s.eyeDark}"/>
        <ellipse cx="98" cy="70" rx="5" ry="5.5" fill="${s.eyeDark}"/>
        <circle cx="59.5" cy="68" r="2" fill="#fff"/><circle cx="99.5" cy="68" r="2" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<path d="M42 54 Q30 44 36 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
        <path d="M118 54 Q128 44 124 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
    },
    mouth: '<path d="M72 82 Q80 87 88 82" fill="none" stroke="#4A3F5C" stroke-width="2" stroke-linecap="round"/>',
    mouthHappy: '<path d="M70 82 Q80 94 90 82" fill="none" stroke="#4A3F5C" stroke-width="2" stroke-linecap="round"/>',
    mouthShy: '<ellipse cx="80" cy="84" rx="3" ry="2" fill="#4A3F5C" opacity="0.35"/>',
    mouthSleepy: '<ellipse cx="80" cy="84" rx="3.5" ry="2.5" fill="#4A3F5C" opacity="0.25"/>',
  },

  // ===== 咕噜 — 黄色大耳 =====
  {
    id: 'gulu', name: '咕噜', tagline: '大耳朵总是竖着，眼睛亮亮的', rarity: 'normal',
    colors: { primary: '#FFE2A8', shadow: '#E0C078', accent: '#FFCC80', cheek: '#FFAB91', eyeDark: '#5D4037' },
    highlightY: 64, highlightRX: 30, highlightRY: 26,
    eyeLX: 58, eyeRX: 102, eyeY: 70, cheekLX: 48, cheekRX: 112, cheekY: 82,
    bodySVG(s) {
      return `<ellipse cx="80" cy="78" rx="46" ry="44" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2"/>`;
    },
    eyesSVG(s) {
      return `<circle cx="58" cy="70" r="6" fill="${s.eyeDark}"/>
        <circle cx="102" cy="70" r="6" fill="${s.eyeDark}"/>
        <circle cx="60.5" cy="67.5" r="2.8" fill="#fff"/>
        <circle cx="104.5" cy="67.5" r="2.8" fill="#fff"/>
        <circle cx="61.5" cy="72" r="1.2" fill="#fff"/>
        <circle cx="105.5" cy="72" r="1.2" fill="#fff"/>`;
    },
    accessorySVG(s) {
      return `<ellipse cx="34" cy="48" rx="18" ry="14" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2.2" transform="rotate(-15,34,48)"/>
        <ellipse cx="126" cy="48" rx="18" ry="14" fill="${s.primary}" stroke="${s.shadow}" stroke-width="2.2" transform="rotate(15,126,48)"/>`;
    },
    mouth: '<path d="M72 86 Q80 94 88 86" fill="none" stroke="#5D4037" stroke-width="2.2" stroke-linecap="round"/>',
    mouthHappy: '<path d="M68 86 Q80 100 92 86" fill="none" stroke="#5D4037" stroke-width="2.2" stroke-linecap="round"/>',
    mouthShy: '<ellipse cx="80" cy="88" rx="4" ry="3" fill="#5D4037" opacity="0.4"/>',
    mouthSleepy: '<ellipse cx="80" cy="87" rx="4.5" ry="3" fill="#5D4037" opacity="0.3"/>',
    mouthConfused: '<path d="M72 88 Q80 84 88 88" fill="none" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>',
  }
];

// Hidden character
const HIDDEN_CHARACTER = {
  id: 'xingchen', name: '星尘', tagline: '从星星上掉下来的，会发光', rarity: 'hidden',
  colors: {
    primary: '#3D3D6B', shadow: '#2A2A50', accent: '#5C5C9E',
    cheek: '#6A6AB0', eyeDark: '#FFD54F',
    glowColor: '#FFD54F'
  },
  highlightY: 62, highlightRX: 30, highlightRY: 26,
  eyeLX: 60, eyeRX: 100, eyeY: 72, cheekLX: 50, cheekRX: 110, cheekY: 82,
  bodySVG(s) {
    return `<ellipse cx="80" cy="78" rx="48" ry="45" fill="${s.primary}" stroke="${s.accent}" stroke-width="2.5"/>
      <ellipse cx="44" cy="46" rx="13" ry="11" fill="${s.primary}" stroke="${s.accent}" stroke-width="2"/>
      <ellipse cx="116" cy="46" rx="13" ry="11" fill="${s.primary}" stroke="${s.accent}" stroke-width="2"/>`;
  },
  eyesSVG(s) {
    return `<ellipse cx="60" cy="72" rx="5" ry="5.5" fill="${s.eyeDark}"/>
      <ellipse cx="100" cy="72" rx="5" ry="5.5" fill="${s.eyeDark}"/>
      <circle cx="62" cy="70" r="2" fill="#fff"/><circle cx="102" cy="70" r="2" fill="#fff"/>`;
  },
  accessorySVG(s) {
    return ``; // Stars are separate particles
  },
  glowParticles(s) {
    return `<g class="char-accessory">
      <text x="48" y="44" font-size="12" fill="${s.eyeDark}" filter="url(#glow-xingchen)" opacity="0.9">✦</text>
      <text x="110" y="50" font-size="8" fill="${s.eyeDark}" filter="url(#glow-xingchen)" opacity="0.7">✦</text>
      <text x="56" y="116" font-size="10" fill="${s.eyeDark}" filter="url(#glow-xingchen)" opacity="0.75">✧</text>
      <text x="42" y="102" font-size="7" fill="${s.eyeDark}" filter="url(#glow-xingchen)" opacity="0.6">✧</text>
      <text x="108" y="108" font-size="9" fill="${s.eyeDark}" filter="url(#glow-xingchen)" opacity="0.55">✧</text>
    </g>`;
  },
  mouth: '<path d="M72 86 Q80 94 88 86" fill="none" stroke="#FFD54F" stroke-width="2.2" stroke-linecap="round"/>',
  mouthHappy: '<path d="M70 86 Q80 98 90 86" fill="none" stroke="#FFD54F" stroke-width="2.2" stroke-linecap="round"/>',
  mouthShy: '<ellipse cx="80" cy="88" rx="3.5" ry="2.5" fill="#FFD54F" opacity="0.5"/>',
  mouthSleepy: '<ellipse cx="80" cy="87" rx="4" ry="3" fill="#FFD54F" opacity="0.35"/>',
};

// =============================================
// GAME STATE
// =============================================
const STORE = {
  collection: 'xh_collection',
  lastOpen: 'xh_last_open',
  companion: 'xh_companion',
  todayRevealed: 'xh_today_rev',
  hiddenFound: 'xh_hidden',
  settings: 'xh_settings'
};

class GameState {
  constructor() { this.load(); }

  _hourSlot() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}`; }

  load() {
    try {
      this.collection = JSON.parse(localStorage.getItem(STORE.collection) || '[]');
      if (!Array.isArray(this.collection)) this.collection = [];
    } catch(e) { this.collection = []; }
    this.lastOpen = localStorage.getItem(STORE.lastOpen) || '';
    this.companionId = localStorage.getItem(STORE.companion) || null;
    this.todayCharId = localStorage.getItem(STORE.todayRevealed) || null;
    this.hiddenFound = localStorage.getItem(STORE.hiddenFound) === 'true';
  }

  save() {
    localStorage.setItem(STORE.collection, JSON.stringify(this.collection));
    localStorage.setItem(STORE.lastOpen, this.lastOpen);
    localStorage.setItem(STORE.hiddenFound, this.hiddenFound ? 'true' : 'false');
    if (this.companionId) localStorage.setItem(STORE.companion, this.companionId);
    else localStorage.removeItem(STORE.companion);
    if (this.todayCharId) localStorage.setItem(STORE.todayRevealed, this.todayCharId);
    else localStorage.removeItem(STORE.todayRevealed);
  }

  canOpen() { return this.lastOpen !== this._hourSlot(); }

  getTodayChar() {
    if (this.lastOpen === this._hourSlot() && this.todayCharId) {
      return [...CHARACTERS, HIDDEN_CHARACTER].find(c => c.id === this.todayCharId) || null;
    }
    return null;
  }

  _pool() {
    const collected = this.collection.map(c => c.id);
    const avail = CHARACTERS.filter(c => !collected.includes(c.id));
    if (!this.hiddenFound && !collected.includes(HIDDEN_CHARACTER.id)) {
      if (Math.random() < 0.05) return [HIDDEN_CHARACTER];
    }
    // Pity: all normals collected → guaranteed hidden
    const normalCollected = this.collection.filter(c => c.rarity !== 'hidden').length;
    if (normalCollected >= CHARACTERS.length && !this.hiddenFound) return [HIDDEN_CHARACTER];
    return avail.length > 0 ? avail : [...CHARACTERS, HIDDEN_CHARACTER];
  }

  openBox() {
    const slot = this._hourSlot();
    if (this.lastOpen === slot && this.todayCharId) {
      return [...CHARACTERS, HIDDEN_CHARACTER].find(c => c.id === this.todayCharId) || null;
    }
    const pool = this._pool();
    const char = pool[Math.floor(Math.random() * pool.length)];
    this.lastOpen = slot;
    this.todayCharId = char.id;
    if (!this.collection.find(c => c.id === char.id)) {
      this.collection.push({ id: char.id, name: char.name, rarity: char.rarity, date: today });
      if (char.rarity === 'hidden') this.hiddenFound = true;
    }
    this.save();
    return char;
  }

  setCompanion(id) { this.companionId = id; this.save(); }
  getCompanion() {
    if (!this.companionId) return null;
    return [...CHARACTERS, HIDDEN_CHARACTER].find(c => c.id === this.companionId) || null;
  }
  totalSlots() { return CHARACTERS.length + 1; }

  // Export
  exportJSON() {
    return JSON.stringify({
      collection: this.collection,
      lastOpen: this.lastOpen,
      companionId: this.companionId,
      todayCharId: this.todayCharId,
      hiddenFound: this.hiddenFound,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Import
  importJSON(json) {
    try {
      const data = JSON.parse(json);
      if (!data.collection || !Array.isArray(data.collection)) throw new Error('Invalid format');
      this.collection = data.collection;
      this.lastOpen = data.lastOpen || '';
      this.companionId = data.companionId || null;
      this.todayCharId = data.todayCharId || null;
      this.hiddenFound = data.hiddenFound || false;
      this.save();
      return true;
    } catch(e) { return false; }
  }

  resetToday() { this.lastOpen = ''; this.todayCharId = null; this.save(); }
  resetAll() {
    this.collection = []; this.lastOpen = ''; this.companionId = null;
    this.todayCharId = null; this.hiddenFound = false; this.save();
  }
}
const state = new GameState();
window.__xiaohezi = { state, audio, CHARACTERS, HIDDEN_CHARACTER, resetToday:()=>state.resetToday(), resetAll:()=>state.resetAll() };

// =============================================
// SCREEN MANAGEMENT
// =============================================
const screens = {
  box:       document.getElementById('screen-box'),
  reveal:    document.getElementById('screen-reveal'),
  shelf:     document.getElementById('screen-shelf'),
  companion: document.getElementById('screen-companion'),
  card:      document.getElementById('screen-card'),
};

function showScreen(name) {
  Object.entries(screens).forEach(([k,el]) => {
    if (k === name) el.classList.remove('hidden'); else el.classList.add('hidden');
  });
}

// =============================================
// TOAST
// =============================================
let toastTimer;
function toast(msg, dur=2000) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), dur);
}

// =============================================
// 1. BOX SCREEN — 开盒仪式
// =============================================
const boxWrapper  = document.getElementById('box-wrapper');
const boxLid      = document.getElementById('box-lid');
const boxGlow     = document.getElementById('box-glow');
const lightRays   = document.getElementById('light-rays');
const boxHint     = document.getElementById('box-hint');
const btnOpen     = document.getElementById('btn-open');
const btnGotoShelf= document.getElementById('btn-goto-shelf');

function updateBoxScreen() {
  const todayChar = state.getTodayChar();
  if (todayChar) {
    btnOpen.textContent = '👀 再看看这小东西';
    btnOpen.disabled = false;
    boxHint.textContent = '这小时来过了，一小时后再来看看～';
    boxWrapper.classList.add('opened');
    boxWrapper.classList.remove('shaking','opening');
    boxGlow.style.opacity = '0.5';
    lightRays.classList.add('active');
  } else {
    btnOpen.textContent = '✨ 打开今天的盲袋';
    btnOpen.disabled = false;
    boxHint.textContent = '每小时一个盲袋，有一只新的小东西在等你';
    boxWrapper.classList.remove('shaking','opening','opened');
    boxWrapper.classList.add('no-float');
    void boxWrapper.offsetWidth;
    boxWrapper.classList.remove('no-float');
    boxGlow.style.opacity = '0';
    lightRays.classList.remove('active');
  }
}

async function handleOpenBox() {
  const todayChar = state.getTodayChar();
  if (todayChar) { showReveal(todayChar); return; }
  if (!state.canOpen()) { toast('这小时打开过了，一小时后再来吧～'); return; }

  btnOpen.disabled = true;

  // Phase 1: Shake (0.9s)
  boxWrapper.classList.add('shaking');
  audio.shake();
  await sleep(1000);

  // Phase 2: Glow emerging (0.7s)
  boxWrapper.classList.remove('shaking');
  boxGlow.classList.add('active');
  lightRays.classList.add('active');
  audio.glowEmerging();
  await sleep(750);

  // Phase 3: Lid open (0.7s)
  boxWrapper.classList.add('opening');
  audio.lidOpen();
  await sleep(750);

  // Phase 4: Character emerge
  const char = state.openBox();
  boxWrapper.classList.remove('opening');
  boxWrapper.classList.add('opened');
  boxGlow.style.opacity = '0.6';
  lightRays.classList.add('active');

  await sleep(200);
  audio.charEmerge();
  showReveal(char);
  updateBoxScreen();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

btnOpen.addEventListener('click', handleOpenBox);
btnGotoShelf.addEventListener('click', () => showShelfScreen());

// =============================================
// 2. REVEAL SCREEN
// =============================================
const revealRaysBg  = document.getElementById('reveal-rays');
const revealCharCtr = document.getElementById('reveal-char-container');
const revealName    = document.getElementById('reveal-name');
const revealTagline = document.getElementById('reveal-tagline');
const revealRarity  = document.getElementById('reveal-rarity');
const btnRevealKeep = document.getElementById('btn-reveal-keep');

function showReveal(char) {
  revealCharCtr.innerHTML = makeCharSVG(char, 150, 'happy');
  revealName.textContent = char.name;
  revealTagline.textContent = char.tagline;
  if (char.rarity === 'hidden') {
    revealRarity.textContent = '✦ 隐藏款 ✦'; revealRarity.className = 'reveal-rarity hidden';
  } else {
    revealRarity.textContent = '基础款'; revealRarity.className = 'reveal-rarity normal';
  }
  // Reset & play rays
  revealRaysBg.classList.remove('active');
  void revealRaysBg.offsetWidth;
  revealRaysBg.classList.add('active');
  // Reset & play char animation
  const svg = revealCharCtr.querySelector('svg');
  if (svg) { svg.style.animation = 'none'; void svg.offsetWidth; svg.style.animation = ''; }
  showScreen('reveal');
}

btnRevealKeep.addEventListener('click', () => {
  const all = [...CHARACTERS, HIDDEN_CHARACTER];
  const char = all.find(c => c.id === state.todayCharId);
  if (char) showCardScreen(char);
  else { showScreen('box'); updateBoxScreen(); }
});

// =============================================
// 3. SHELF + SETTINGS
// =============================================
const shelfGrid      = document.getElementById('shelf-grid');
const shelfCount     = document.getElementById('shelf-count');
const pageIndicator  = document.getElementById('page-indicator');
const btnPrevPage    = document.getElementById('btn-prev-page');
const btnNextPage    = document.getElementById('btn-next-page');
const shelfPag       = document.getElementById('shelf-pagination');
const settingsOverlay= document.getElementById('settings-overlay');
const settingsPanel  = document.getElementById('settings-panel');
const fileImport     = document.getElementById('file-import');

const PER_PAGE = 6;
let shelfPage = 0;

function showShelfScreen() {
  shelfPage = 0; renderShelf(); showScreen('shelf');
}

function renderShelf() {
  const coll = state.collection;
  const total = state.totalSlots();
  const pages = Math.ceil(total / PER_PAGE);
  if (shelfPage >= pages) shelfPage = Math.max(0, pages-1);
  const start = shelfPage * PER_PAGE;

  shelfCount.textContent = `${coll.length} / ${total}`;

  shelfGrid.innerHTML = '';
  for (let i = 0; i < PER_PAGE; i++) {
    const idx = start + i;
    const cell = document.createElement('div');
    cell.className = 'shelf-cell';
    if (idx >= total) {
      cell.classList.add('empty'); cell.innerHTML = '';
    } else if (idx < coll.length) {
      const entry = coll[idx];
      const all = [...CHARACTERS, HIDDEN_CHARACTER];
      const char = all.find(c => c.id === entry.id);
      if (char) {
        cell.innerHTML = makeCharSVG(char, 60, 'idle')
          + `<span class="cell-name">${char.name}</span>`
          + `<span class="cell-date">${entry.date.slice(5)}</span>`
          + `<span class="collected-stamp">✓</span>`;
        if (char.rarity === 'hidden') cell.classList.add('hidden-rare');
        cell.addEventListener('click', () => {
          state.setCompanion(char.id); showCompanionScreen(char);
        });
      }
    } else {
      cell.classList.add('empty');
      cell.innerHTML = '<span class="cell-question">?</span>';
      cell.addEventListener('click', () => {
        toast(state.canOpen() ? '先去开盲袋吧！' : '一小时后刷新～');
      });
    }
    shelfGrid.appendChild(cell);
  }

  if (pages <= 1) { shelfPag.style.display = 'none'; }
  else {
    shelfPag.style.display = 'flex';
    pageIndicator.textContent = `${shelfPage+1} / ${pages}`;
    btnPrevPage.disabled = shelfPage === 0;
    btnNextPage.disabled = shelfPage >= pages-1;
  }
}

btnPrevPage.addEventListener('click', ()=>{ if(shelfPage>0){shelfPage--;renderShelf();} });
btnNextPage.addEventListener('click', ()=>{
  const pages = Math.ceil(state.totalSlots()/PER_PAGE);
  if(shelfPage<pages-1){shelfPage++;renderShelf();}
});
document.getElementById('btn-shelf-back').addEventListener('click', ()=>{showScreen('box');updateBoxScreen();});
document.getElementById('btn-shelf-to-box').addEventListener('click', ()=>{showScreen('box');updateBoxScreen();});

// Settings
document.getElementById('btn-settings').addEventListener('click', ()=>{ settingsOverlay.classList.add('active'); });
settingsOverlay.addEventListener('click', (e)=>{
  if (e.target === settingsOverlay) settingsOverlay.classList.remove('active');
});
document.getElementById('btn-settings-close').addEventListener('click', ()=>{ settingsOverlay.classList.remove('active'); });

// Export
document.getElementById('btn-export').addEventListener('click', ()=>{
  const json = state.exportJSON();
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `小盒子-存档-${new Date().toISOString().split('T')[0]}.json`;
  a.click(); URL.revokeObjectURL(url);
  toast('存档已导出！');
});

// Import
document.getElementById('btn-import').addEventListener('click', ()=>{ fileImport.click(); });
fileImport.addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const ok = state.importJSON(ev.target.result);
    if (ok) {
      toast('存档已导入！刷新中…'); setTimeout(()=>location.reload(), 800);
    } else {
      toast('导入失败，文件格式不正确');
    }
  };
  reader.readAsText(file);
  fileImport.value = '';
});

// =============================================
// 4. COMPANION MODE — 丰富交互
// =============================================
const compChar     = document.getElementById('companion-character');
const compFx       = document.getElementById('companion-fx');
const compTitle    = document.getElementById('companion-title');
const compHint     = document.getElementById('companion-hint');
const compRoom     = document.getElementById('companion-room');

let compCurrent = null;
let compState   = 'idle';
let idleTimer   = null;
let sleepTimer  = null;
let idleCycle   = null;
const SLEEP_MS  = 8000;

// Tap detection
let tapCount = 0;
let tapTimer = null;
let pressTimer = null;
let isPressing = false;
let lastTapY = 0; // to detect head vs body tap

function showCompanionScreen(char) {
  compCurrent = char;
  compState = 'idle';
  compTitle.textContent = char.name;
  setCompSVG('idle');
  compHint.textContent = '点点它，它会很高兴';
  compHint.style.opacity = '1';
  resetTimers();
  showScreen('companion');
}

function setCompSVG(st) {
  if (!compCurrent) return;
  compState = st;
  compChar.className = `companion-character ${st}`;
  compChar.innerHTML = makeCharSVG(compCurrent, 170, st);
  compChar.style.transform = '';
}

function resetTimers() {
  clearTimeout(idleTimer); clearTimeout(sleepTimer); clearInterval(idleCycle);
  if (compState === 'sleepy' || compState === 'jerk') {
    setCompSVG('idle');
    compHint.textContent = '点点它，它会很高兴';
  }
  sleepTimer = setTimeout(() => enterSleep(), SLEEP_MS);
  // Random idle micro-actions
  idleCycle = setInterval(() => randomIdle(), 5000 + Math.random() * 4000);
}

function enterSleep() {
  setCompSVG('sleepy');
  compHint.textContent = '它打瞌睡了…点一下叫醒它';
  compHint.style.opacity = '1';
  // Jerk awake cycle
  const jerkCycle = setInterval(() => {
    if (compState !== 'sleepy') { clearInterval(jerkCycle); return; }
    compChar.classList.add('jerk');
    setTimeout(() => compChar.classList.remove('jerk'), 400);
  }, 6000 + Math.random() * 5000);
  // Store for cleanup
  compChar._jerkCycle = jerkCycle;
}

function randomIdle() {
  if (compState !== 'idle' || !compCurrent) return;
  // Small actions: brief head tilt, accessory twitch, etc.
  const actions = ['tilt-l', 'tilt-r', 'bounce-tiny'];
  const act = actions[Math.floor(Math.random() * actions.length)];
  const svg = compChar.querySelector('svg');
  if (!svg) return;
  if (act === 'tilt-l') { svg.style.transform = 'rotate(-5deg)'; setTimeout(()=>{ if(compState==='idle') svg.style.transform='rotate(0)'; }, 400); }
  else if (act === 'tilt-r') { svg.style.transform = 'rotate(5deg)'; setTimeout(()=>{ if(compState==='idle') svg.style.transform='rotate(0)'; }, 400); }
  else if (act === 'bounce-tiny') { svg.style.transform = 'translateY(-6px)'; setTimeout(()=>{ if(compState==='idle') svg.style.transform='translateY(0)'; }, 250); }
}

// ===== Tap handler =====
compChar.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  compChar.setPointerCapture(e.pointerId);
  lastTapY = e.offsetY;
  isPressing = true;
  dragStartX = e.clientX;
  dragMoved = false;

  // Long press detection
  pressTimer = setTimeout(() => {
    if (isPressing && compState !== 'sleepy') {
      setCompSVG('lean');
      audio.heart();
      spawnFx(['🥰','💕','✨']);
      compHint.textContent = '它靠过来了…';
      compHint.style.opacity = '1';
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { setCompSVG('idle'); compHint.style.opacity = '0'; }, 1200);
      isPressing = false;
    }
  }, 500);
});

compChar.addEventListener('pointerup', (e) => {
  clearTimeout(pressTimer);
  if (!isPressing) return;
  isPressing = false;

  if (compState === 'sleepy') {
    // Wake up
    resetTimers();
    setCompSVG('happy');
    audio.tapBody();
    spawnFx(['❤️','💛']);
    compHint.style.opacity = '0';
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => setCompSVG('idle'), 600);
    return;
  }

  // Detect double tap
  tapCount++;
  if (tapCount === 1) {
    tapTimer = setTimeout(() => {
      // Single tap
      const isHead = lastTapY < 60; // Top of character = head area
      if (isHead) {
        setCompSVG('shy');
        audio.tapHead();
        spawnFx(['💕']);
        compHint.textContent = '害羞了…';
      } else {
        setCompSVG('happy');
        audio.tapBody();
        spawnFx(['❤️','✨','💛','🥰']);
        compHint.textContent = '';
      }
      compHint.style.opacity = compState === 'shy' ? '1' : '0';
      resetTimers();
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { setCompSVG('idle'); compHint.style.opacity = '0'; }, 600);
      tapCount = 0;
    }, 280);
  } else {
    // Double tap → spin
    clearTimeout(tapTimer);
    tapCount = 0;
    setCompSVG('spin');
    audio.spin();
    spawnFx(['✨','💫']);
    compHint.textContent = '转起来了！';
    compHint.style.opacity = '1';
    resetTimers();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { setCompSVG('idle'); compHint.style.opacity = '0'; }, 900);
  }
});

compChar.addEventListener('pointerleave', () => {
  clearTimeout(pressTimer);
  isPressing = false;
});

// Effects spawner
function spawnFx(emojis) {
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];
  const el = document.createElement('span');
  el.className = 'heart-fx';
  el.textContent = emoji;
  el.style.left = `${-20 + Math.random()*40}px`;
  el.style.animationDuration = `${0.9 + Math.random()*0.7}s`;
  compFx.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

// ===== Drag to rotate =====
let isDragging = false;
let dragStartX = 0;
let dragRotate = 0;
let dragMoved = false;

compChar.addEventListener('pointermove', (e) => {
  if (!isPressing) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) < 4) return; // dead zone
  dragMoved = true;
  clearTimeout(pressTimer);
  dragRotate = dx * 0.3;
  compChar.style.transform = `rotateY(${dragRotate}deg)`;
  if (Math.abs(dragRotate) > 25 && compState !== 'confused') {
    setCompSVG('confused');
    compHint.textContent = '你在转我…有点晕';
    compHint.style.opacity = '1';
  }
});

compChar.addEventListener('pointerup', (e) => {
  if (dragMoved) {
    compChar.style.transition = 'transform 0.45s var(--ease-bounce)';
    compChar.style.transform = 'rotateY(0deg)';
    dragRotate = 0; dragMoved = false;
    resetTimers();
    if (compState === 'confused') setTimeout(() => setCompSVG('idle'), 500);
    setTimeout(() => { compChar.style.transition = 'transform 0.15s ease-out'; }, 450);
  }
});

// ===== Click room background =====
compRoom.addEventListener('click', (e) => {
  if (e.target.closest('.companion-character')) return;
  if (!compCurrent || compState === 'sleepy') return;
  setCompSVG('happy');
  audio.tapBody();
  spawnFx(['❤️','💛']);
  compHint.style.opacity = '0';
  resetTimers();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => setCompSVG('idle'), 600);
});

// Navigation
document.getElementById('btn-companion-back').addEventListener('click', () => showShelfScreen());
document.getElementById('btn-companion-shelf').addEventListener('click', () => showShelfScreen());

// =============================================
// 5. DAILY CARD
// =============================================
const dailyCard   = document.getElementById('daily-card');
const cardChar    = document.getElementById('card-char');
const cardCharName= document.getElementById('card-char-name');
const cardDate    = document.getElementById('card-date');
const cardQuote   = document.getElementById('card-quote');
const cardCanvas  = document.getElementById('card-canvas');

function showCardScreen(char) {
  cardChar.innerHTML = makeCharSVG(char, 110, 'idle');
  cardCharName.textContent = char.name;
  const now = new Date();
  cardDate.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  cardQuote.textContent = `"${QUOTES[Math.floor(Math.random()*QUOTES.length)]}"`;
  dailyCard.style.background = `linear-gradient(180deg, #fffefb 0%, ${char.colors.primary}14 50%, ${char.colors.primary}28 100%)`;
  renderCanvasCard(char);
  showScreen('card');
}

function renderCanvasCard(char) {
  const canvas = cardCanvas, ctx = canvas.getContext('2d');
  const W=400, H=600;
  ctx.clearRect(0,0,W,H);
  // BG
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#fffefb');
  bg.addColorStop(0.5, char.colors.primary+'14');
  bg.addColorStop(1, char.colors.primary+'28');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  // Rounded rect clip
  ctx.beginPath(); roundRect(ctx,0,0,W,H,24); ctx.clip();
  // SVG → image
  const svgStr = makeCharSVG(char, 170, 'idle');
  const blob = new Blob([svgStr], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, (W-160)/2, 70, 160, 160);
    // Name
    ctx.fillStyle='#4a4458'; ctx.font='bold 26px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    ctx.textAlign='center'; ctx.fillText(char.name, W/2, 270);
    // Date
    const now = new Date();
    ctx.fillStyle='#c5c0c8'; ctx.font='14px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    ctx.fillText(`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`, W/2, 300);
    // Divider
    ctx.strokeStyle='rgba(0,0,0,0.05)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(80,330); ctx.lineTo(W-80,330); ctx.stroke();
    // Quote
    ctx.fillStyle='#8a8498'; ctx.font='italic 15px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    wrapText(ctx, `"${QUOTES[Math.floor(Math.random()*QUOTES.length)]}"`, W/2, 370, W-120, 28);
    // Divider
    ctx.beginPath(); ctx.moveTo(80,450); ctx.lineTo(W-80,450); ctx.stroke();
    // Brand
    ctx.fillStyle='#d8d0d8'; ctx.font='12px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
    ctx.fillText('小盒子', W/2, 500);
    // Decorations
    ctx.fillStyle = char.colors.primary+'28';
    ctx.beginPath(); ctx.arc(50,550,18,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(350,550,18,0,Math.PI*2); ctx.fill();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function roundRect(ctx,x,y,w,h,r) {
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function wrapText(ctx,text,x,y,maxW,lh) {
  const chars = text.split(''); let line='', cy=y;
  for(let i=0;i<chars.length;i++) {
    const t = line+chars[i];
    if(ctx.measureText(t).width>maxW && line.length>0){ctx.fillText(line,x,cy);line=chars[i];cy+=lh;}
    else line=t;
  }
  ctx.fillText(line,x,cy);
}

document.getElementById('btn-card-save').addEventListener('click', ()=>{
  const a = document.createElement('a');
  a.download = `小盒子-${new Date().toISOString().split('T')[0]}.png`;
  a.href = cardCanvas.toDataURL('image/png'); a.click();
  toast('卡片已保存！');
});
document.getElementById('btn-card-close').addEventListener('click', ()=>{ showScreen('box'); updateBoxScreen(); });

// =============================================
// INIT
// =============================================
function init() {
  // Demo mode
  if (window.location.search.includes('demo')) {
    state.collection = [
      {id:'yuanyuan',name:'圆圆',rarity:'normal',date:'2026-06-07'},
      {id:'doudou',name:'豆豆',rarity:'normal',date:'2026-06-08'},
      {id:'paopao',name:'泡泡',rarity:'normal',date:'2026-06-09'},
      {id:'tuantuan',name:'团团',rarity:'normal',date:'2026-06-10'},
      {id:'mianmian',name:'绵绵',rarity:'normal',date:'2026-06-11'},
      {id:'gulu',name:'咕噜',rarity:'normal',date:'2026-06-12'},
      {id:'xingchen',name:'星尘',rarity:'hidden',date:'2026-06-13'},
    ];
    state.hiddenFound = true; state.lastOpen = state._hourSlot(); state.todayCharId = 'gulu'; state.save();
  }

  updateBoxScreen(); showScreen('box');
  console.log('📦 小盒子 v2 ✨');
  console.log('  __xiaohezi.resetToday() — 重置小时冷却');
  console.log('  __xiaohezi.resetAll()   — 重置全部');
  console.log('  加 ?demo 开启全收集');
}
init();
