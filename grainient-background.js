/**
 * Grainient Background Component for Vanilla JS (React Bits adaptation)
 * WebGL2 fluid-like gradient with film grain, satin wave flow, and interactive stirring.
 */
(function() {
  'use strict';

  const MAX_COLORS = 8;
  const MAX_STIRS = 32;
  const MAX_TWIRLS = 4;
  const STIR_LIFE = 3.6;
  const STIR_STEP = 0.05;
  const TWIRL_LIFE = 3.8;
  const INTRO_SECONDS = 1.6;
  const DEFAULT_COLORS = ['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'];
  const TYPES = { linear: 0, radial: 1 };
  const LIFT = 0.2;

  const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const FIELD = `#version 300 es
precision highp float;
precision highp int;
uniform float uAspect;
uniform float uTime;
uniform vec3 uRamp[8];
uniform int uCount;
uniform int uType;
uniform vec2 uDir;
uniform float uExtent;
uniform float uBands;
uniform float uSoftness;
uniform float uFlow;
uniform float uScale;
uniform float uSilk;
uniform vec4 uStir[32];
uniform float uStirWeight[32];
uniform vec4 uTwirl[4];
uniform vec2 uSeed;
uniform float uContrast;
uniform float uSaturation;
uniform float uSettle;
uniform float uReveal;
in vec2 vUv;
out vec4 outColor;

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy) * 2.0 - 1.0;
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash2(i), f);
  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

vec2 drift(vec2 p, float t) {
  vec2 w1 = vec2(
    noise(p * 0.85 + vec2(t * 0.11, t * 0.07)),
    noise(p * 0.85 + vec2(4.1, 1.7) - vec2(t * 0.08, t * 0.12))
  );
  vec2 w2 = vec2(
    noise(p * 1.55 + w1 * 1.8 + vec2(1.3, 7.1) + t * 0.05),
    noise(p * 1.55 + w1 * 1.8 + vec2(6.4, 2.2) - t * 0.06)
  );
  return (w1 - 0.5) * 1.1 + (w2 - 0.5) * 0.55;
}

vec2 warp(vec2 p) {
  vec2 q = p / uScale;
  if (uType == 1) {
    float turn = uTime * 0.35;
    q = mat2(cos(turn), sin(turn), -sin(turn), cos(turn)) * q;
  } else {
    q += vec2(-uDir.y, uDir.x) * uTime * 0.45;
  }
  return p + drift(q + uSeed, uTime) * uFlow * uScale * uSettle;
}

float coord(vec2 p) {
  vec2 w = warp(p);
  return uType == 1 ? 1.0 - length(w) * 1.1 : dot(w, uDir) / uExtent + 0.5;
}

vec3 labToRgb(vec3 lab) {
  float l = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  );
}

vec3 encode(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  for (int i = 0; i < 32; i++) {
    float w = uStirWeight[i];
    if (w <= 0.0) continue;
    vec2 d = p - uStir[i].xy;
    float distSq = dot(d, d);
    if (distSq > 0.22) continue;
    float r = sqrt(distSq);
    // 枯山水沙脊波纹模型：中心主凹槽 + 两侧扩散的细密沙脊涟漪
    float ripple = exp(-distSq / 0.065) * (1.0 + 0.42 * cos(r * 38.0)) * (1.0 - smoothstep(0.22, 0.46, r));
    p -= uStir[i].zw * w * ripple;
  }
  for (int i = 0; i < 4; i++) {
    float angle = uTwirl[i].z;
    if (angle == 0.0) continue;
    vec2 d = p - uTwirl[i].xy;
    float a = angle * exp(-dot(d, d) / (uTwirl[i].w * uTwirl[i].w));
    float c = cos(a);
    float s = sin(a);
    p = uTwirl[i].xy + mat2(c, -s, s, c) * d;
  }
  float raw = coord(p);
  float s = raw;
  if (uBands > 1.0) {
    s *= uBands;
    float cycle = floor(s);
    s = fract(s);
    if (mod(cycle, 2.0) > 0.5) s = 1.0 - s;
  }
  s = clamp(s, 0.0, 1.0);
  float scaled = s * float(uCount - 1);
  int index = int(min(floor(scaled), float(uCount - 2)));
  float f = scaled - float(index);
  float edge = max(uSoftness * 0.5, fwidth(scaled) * 0.75);
  float shaped = smoothstep(0.5 - edge, 0.5 + edge, f);
  vec3 from = uRamp[0];
  vec3 to = uRamp[1];
  for (int i = 0; i < 7; i++) {
    if (i == index) {
      from = uRamp[i];
      to = uRamp[i + 1];
    }
  }
  vec3 lab = mix(from, to, shaped);
  if (uSilk > 0.0) {
    vec2 grad = vec2(coord(p + vec2(0.004, 0.0)) - raw, coord(p + vec2(0.0, 0.004)) - raw) / 0.004;
    vec2 slope = grad * sin(3.14159265 * clamp(raw, 0.0, 1.0) * uBands) * uSilk * 4.0;
    vec3 normal = normalize(vec3(-slope, 1.0));
    vec3 light = normalize(vec3(-uDir.y, uDir.x, 1.2));
    float diffuse = dot(normal, light) - light.z;
    lab = uRamp[0] + (lab - uRamp[0]) * (1.0 + (diffuse * 0.35 + max(diffuse, 0.0) * diffuse * 0.6) * uSilk);
  }
  lab = mix(uRamp[0], lab, smoothstep(0.0, 1.0, uReveal * 1.5 - length(vUv - 0.5) * 0.6));
  lab.x = (lab.x - 0.55) * uContrast + 0.55;
  lab.yz *= uSaturation;
  outColor = vec4(encode(labToRgb(lab)), 1.0);
}`;

  const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform float uGrain;
uniform float uGrainSize;
uniform float uFrame;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float clump(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec3 color = texture(uField, vUv).rgb;
  vec2 pixel = gl_FragCoord.xy + uFrame * vec2(17.0, 59.0);
  float fine = hash(pixel) + hash(pixel + 7.13) - 1.0;
  float coarse = (clump(pixel / max(uGrainSize, 1.0)) - 0.5) * 2.0;
  float grain = mix(fine, coarse, clamp(uGrainSize - 1.0, 0.0, 1.0) * 0.8);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color += grain * uGrain * (0.45 + 2.2 * luma * (1.0 - luma));
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const toLinear = value => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

  const toLab = ([r, g, b]) => {
    const lr = toLinear(r);
    const lg = toLinear(g);
    const lb = toLinear(b);
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
  };

  const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.warn('[Grainient] Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  };

  const link = (gl, fragmentSource) => {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[Grainient] Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (!info) continue;
      const name = info.name.replace(/\[0\]$/, '');
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    return { program, uniforms };
  };

  // --- 天地四时与月相引擎 (Cosmic Diurnal & Lunar Engine) ---
  const COSMIC_SEASONS = [
    {
      id: 'dawn',
      name: '拂晓破晓',
      hour: 6.0,
      colors: ['#0a1215', '#122026', '#28424d', '#68868c', '#c9d8d6'],
      silk: 0.28,
      contrast: 0.95
    },
    {
      id: 'noon',
      name: '正午遍照',
      hour: 13.0,
      colors: ['#150f0c', '#2a170e', '#8d5a2a', '#c26d24', '#fde0b4'],
      silk: 0.38,
      contrast: 1.05
    },
    {
      id: 'dusk',
      name: '薄暮斜阳',
      hour: 18.5,
      colors: ['#130c14', '#28111e', '#6e253e', '#af4f35', '#fad5b0'],
      silk: 0.42,
      contrast: 1.08
    },
    {
      id: 'night',
      name: '子夜幽冥',
      hour: 23.5,
      colors: ['#07080c', '#0d121c', '#172033', '#2c3b52', '#7d91aa'],
      silk: 0.30,
      contrast: 0.92
    }
  ];

  function hexToRgb(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }

  function rgbToHex(rgb) {
    const to255 = v => Math.min(255, Math.max(0, Math.round(v * 255)));
    return '#' + [to255(rgb[0]), to255(rgb[1]), to255(rgb[2])].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  function getLunarState(date = new Date()) {
    const epoch = Date.UTC(2000, 0, 6, 18, 14, 0); // 2000年已知新月时刻 (朔)
    const diffDays = (date.getTime() - epoch) / 86400000;
    const cycle = 29.53058867; // 朔望月均长
    const phase = ((diffDays % cycle) + cycle) % cycle / cycle; // [0, 1)
    const illumination = 0.5 * (1 - Math.cos(phase * 2 * Math.PI)); // 照度
    const lunarDay = Math.floor(phase * 29.53) + 1; // 农历初一至三十

    let phaseName = '朔月 · 初一';
    let icon = '🌑';
    if (phase < 0.03 || phase > 0.97) { phaseName = '朔月 · 幽冥初一'; icon = '🌑'; }
    else if (phase < 0.22) { phaseName = '新月 · 蛾眉微弦'; icon = '🌒'; }
    else if (phase < 0.28) { phaseName = '上弦之月 · 半照'; icon = '🌓'; }
    else if (phase < 0.47) { phaseName = '渐盈凸月 · 澄澈'; icon = '🌔'; }
    else if (phase < 0.53) { phaseName = '满月望日 · 皎洁'; icon = '🌕'; }
    else if (phase < 0.72) { phaseName = '渐亏凸月 · 敛芒'; icon = '🌖'; }
    else if (phase < 0.78) { phaseName = '下弦之月 · 半沉'; icon = '🌗'; }
    else { phaseName = '残月斜晖 · 归寂'; icon = '🌘'; }

    return { phase, illumination, lunarDay, phaseName, icon };
  }

  function calculateCosmicTheme(targetHour, lunar = getLunarState()) {
    let h = ((targetHour % 24) + 24) % 24;
    let s1, s2;
    let t = 0;

    if (h >= 6.0 && h < 13.0) {
      s1 = COSMIC_SEASONS[0]; // dawn (6.0)
      s2 = COSMIC_SEASONS[1]; // noon (13.0)
      t = (h - 6.0) / (13.0 - 6.0);
    } else if (h >= 13.0 && h < 18.5) {
      s1 = COSMIC_SEASONS[1]; // noon (13.0)
      s2 = COSMIC_SEASONS[2]; // dusk (18.5)
      t = (h - 13.0) / (18.5 - 13.0);
    } else if (h >= 18.5 && h < 23.5) {
      s1 = COSMIC_SEASONS[2]; // dusk (18.5)
      s2 = COSMIC_SEASONS[3]; // night (23.5)
      t = (h - 18.5) / (23.5 - 18.5);
    } else {
      s1 = COSMIC_SEASONS[3]; // night (23.5)
      s2 = COSMIC_SEASONS[0]; // dawn (6.0)
      const dist = (24.0 - 23.5) + 6.0;
      const currentDist = (h >= 23.5) ? (h - 23.5) : (h + 0.5);
      t = currentDist / dist;
    }

    const weight = 0.5 - 0.5 * Math.cos(t * Math.PI);
    const rgb1List = s1.colors.map(hexToRgb);
    const rgb2List = s2.colors.map(hexToRgb);
    const blendedRgb = rgb1List.map((c1, i) => {
      const c2 = rgb2List[i];
      return [
        c1[0] + (c2[0] - c1[0]) * weight,
        c1[1] + (c2[1] - c1[1]) * weight,
        c1[2] + (c2[2] - c1[2]) * weight
      ];
    });

    // 月相调制夜色冷辉
    const nightProximity = Math.max(0, 1 - Math.min(Math.abs(h - 23.5), Math.abs(h + 0.5)) / 4.0);
    if (nightProximity > 0.05) {
      const moonFactor = nightProximity * (lunar.illumination - 0.5);
      blendedRgb[4][0] = Math.min(1, Math.max(0, blendedRgb[4][0] + moonFactor * 0.12));
      blendedRgb[4][1] = Math.min(1, Math.max(0, blendedRgb[4][1] + moonFactor * 0.18));
      blendedRgb[4][2] = Math.min(1, Math.max(0, blendedRgb[4][2] + moonFactor * 0.25));
    }

    const blendedHex = blendedRgb.map(rgbToHex);
    const blendedSilk = s1.silk + (s2.silk - s1.silk) * weight + (nightProximity > 0.1 ? (lunar.illumination - 0.5) * 0.08 : 0);
    const blendedContrast = s1.contrast + (s2.contrast - s1.contrast) * weight;

    let currentSeasonName = '';
    if (h >= 5.0 && h < 9.0) currentSeasonName = '清晨 · 拂晓晨霭';
    else if (h >= 9.0 && h < 16.5) currentSeasonName = '日丽 · 正午遍照';
    else if (h >= 16.5 && h < 20.5) currentSeasonName = '薄暮 · 落日斜阳';
    else currentSeasonName = '子夜 · 幽冥禅定';

    return {
      colors: blendedHex,
      silk: Math.min(0.6, Math.max(0.2, blendedSilk)),
      contrast: blendedContrast,
      seasonName: currentSeasonName,
      hour: h,
      lunar
    };
  }

  function initGrainient(userOptions = {}) {
    const palette = (Array.isArray(userOptions.colors) && userOptions.colors.length
      ? userOptions.colors
      : DEFAULT_COLORS
    ).slice(0, MAX_COLORS);

    const settings = {
      colors: palette.length > 1 ? palette : [palette[0], palette[0]],
      type: TYPES[userOptions.type] ?? 0,
      angle: userOptions.angle ?? 55,
      bands: clamp(userOptions.bands ?? 1, 1, 8),
      speed: Math.max(0, userOptions.speed ?? 1),
      flow: clamp(userOptions.flow ?? 0.8, 0, 3),
      scale: clamp(userOptions.scale ?? 1, 0.25, 3),
      softness: clamp(userOptions.softness ?? 1, 0, 1),
      silk: clamp(userOptions.silk ?? 0.35, 0, 1),
      grainAmount: clamp(userOptions.grainAmount ?? 0.08, 0, 0.5),
      grainSize: clamp(userOptions.grainSize ?? 1.2, 0.5, 4),
      grainAnimated: userOptions.grainAnimated ?? true,
      contrast: clamp(userOptions.contrast ?? 1, 0.2, 2),
      saturation: clamp(userOptions.saturation ?? 1, 0, 2),
      variation: Math.max(0, userOptions.variation ?? 0),
      interactive: userOptions.interactive ?? true,
      stir: clamp(userOptions.stir ?? 1, 0, 2),
      clickSwirl: userOptions.clickSwirl ?? true,
      intro: userOptions.intro ?? true,
      lightMode: userOptions.lightMode ?? false,
      diurnalShift: userOptions.diurnalShift ?? true,
      dpr: userOptions.dpr || Math.min(window.devicePixelRatio || 1, 2)
    };

    // If lightMode is explicitly true, adapt body class to ensure accessible contrast
    if (settings.lightMode) {
      document.body.classList.add('light-mode');
    }

    // Get or create container
    let container = document.getElementById('grainient-bg');
    if (!container) {
      container = document.createElement('div');
      container.id = 'grainient-bg';
      container.className = 'grainient-container';
      container.setAttribute('aria-hidden', 'true');
      container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-1;overflow:hidden;pointer-events:none;';
      document.body.prepend(container);
    }

    let canvas = container.querySelector('canvas.grainient-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'grainient-canvas';
      canvas.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;';
      container.appendChild(canvas);
    }

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false
    });

    if (!gl) {
      console.warn('[Grainient] WebGL2 not supported on this device.');
      container.style.background = settings.colors[0];
      return null;
    }

    const field = link(gl, FIELD);
    const composite = link(gl, COMPOSITE);
    if (!field || !composite) return null;

    const fu = field.uniforms;
    const cu = composite.uniforms;
    const vao = gl.createVertexArray();
    const target = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const buffer = gl.createFramebuffer();
    const fieldSize = { width: 0, height: 0 };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colorCache = new Map();
    const parse = value => {
      const key = String(value);
      const cached = colorCache.get(key);
      if (cached) return cached;
      let rgb = [0, 0, 0];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000000';
        probe.fillStyle = key;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colorCache.set(key, rgb);
      return rgb;
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const view = { width: 1, height: 1, ratio: 1 };
    const ramp = new Float32Array(MAX_COLORS * 3);
    const stirs = new Float32Array(MAX_STIRS * 4);
    const stirWeights = new Float32Array(MAX_STIRS);
    const twirls = new Float32Array(MAX_TWIRLS * 4);
    const trail = [];
    const spins = [];
    const pointer = { x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, vx: 0, inside: false, fresh: true };
    let paletteKey = '';
    let time = 0;
    let introClock = settings.intro && !reduce ? 0 : 1;
    let frameSeed = 0;
    let grainClock = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const syncPalette = () => {
      const s = settings;
      const key = `${s.colors.join(',')}|${s.lightMode}`;
      if (key === paletteKey) return;
      paletteKey = key;
      const labs = s.colors.map(color => toLab(parse(color)));
      if (!s.lightMode) {
        labs.forEach((lab, i) => ramp.set(lab, i * 3));
      } else {
        const blank = labs.map(([L]) => Math.abs(L - labs[0][0]) < 0.1);
        const tints = labs.filter((_, i) => !blank[i]).reverse();
        labs.forEach((_, i) => {
          const [L, a, b] = blank[i] ? [1, 0, 0] : tints.shift();
          ramp.set([L + (1 - L) * LIFT, a * (1 - LIFT), b * (1 - LIFT)], i * 3);
        });
      }
    };

    const draw = (breath = 0) => {
      const s = settings;
      const aspect = view.width / view.height;
      syncPalette();
      gl.bindVertexArray(vao);
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
      gl.viewport(0, 0, fieldSize.width, fieldSize.height);
      gl.useProgram(field.program);
      gl.uniform1f(fu.uAspect, aspect);
      gl.uniform1f(fu.uTime, time);
      gl.uniform3fv(fu.uRamp, ramp);
      gl.uniform1i(fu.uCount, s.colors.length);
      const radians = (s.angle * Math.PI) / 180;
      gl.uniform1i(fu.uType, s.type);
      gl.uniform2f(fu.uDir, Math.sin(radians), Math.cos(radians));
      gl.uniform1f(fu.uExtent, aspect * Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)));
      gl.uniform1f(fu.uBands, s.bands);
      gl.uniform1f(fu.uSoftness, s.softness);
      gl.uniform1f(fu.uFlow, s.flow);
      gl.uniform1f(fu.uScale, s.scale);
      // 出入息微律动调制丝绸光影与对比度 (沉静安稳，微幅漫反射呼吸)
      gl.uniform1f(fu.uSilk, s.silk * (0.92 + breath * 0.16));
      gl.uniform4fv(fu.uStir, stirs);
      gl.uniform1fv(fu.uStirWeight, stirWeights);
      gl.uniform4fv(fu.uTwirl, twirls);
      gl.uniform2f(fu.uSeed, s.variation * 3.17, s.variation * 1.91);
      gl.uniform1f(fu.uContrast, s.contrast * (0.97 + breath * 0.06));
      gl.uniform1f(fu.uSaturation, s.saturation);
      gl.uniform1f(fu.uSettle, introClock * introClock * (3 - 2 * introClock));
      gl.uniform1f(fu.uReveal, introClock);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(composite.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, target);
      gl.uniform1i(cu.uField, 0);
      gl.uniform1f(cu.uGrain, s.grainAmount);
      gl.uniform1f(cu.uGrainSize, s.grainSize * view.ratio);
      gl.uniform1f(cu.uFrame, frameSeed);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      const s = settings;
      view.width = Math.max(1, window.innerWidth);
      view.height = Math.max(1, window.innerHeight);
      view.ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(view.width * view.ratio));
      canvas.height = Math.max(1, Math.round(view.height * view.ratio));
      const width = Math.max(1, Math.round(canvas.width / 2));
      const height = Math.max(1, Math.round(canvas.height / 2));
      if (width !== fieldSize.width || height !== fieldSize.height) {
        fieldSize.width = width;
        fieldSize.height = height;
        gl.bindTexture(gl.TEXTURE_2D, target);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      draw();
      wake();
    };

    const updateTouches = (dt, aspect) => {
      const s = settings;
      const follow = 1 - Math.exp(-dt / 0.06);
      const px = pointer.sx;
      const py = pointer.sy;
      pointer.sx += (pointer.x - pointer.sx) * follow;
      pointer.sy += (pointer.y - pointer.sy) * follow;
      const vx = ((pointer.sx - px) / dt) * aspect;
      const vy = (pointer.sy - py) / dt;
      pointer.vx = vx;
      const head = trail[0];
      trail.forEach(sample => {
        if (sample.done) sample.age += dt;
      });
      if (s.interactive && pointer.inside && Math.hypot(vx, vy) > 0.02 && !reduce) {
        if (!head || head.done) {
          trail.unshift({ x: 0, y: 0, vx: 0, vy: 0, age: 0, grow: 0, done: false });
          if (trail.length > MAX_STIRS) trail.pop();
        }
        const live = trail[0];
        live.x = (pointer.sx - 0.5) * aspect;
        live.y = pointer.sy - 0.5;
        live.vx = vx;
        live.vy = vy;
        live.grow = Math.min(1, live.grow + dt / STIR_STEP);
        live.done = live.grow >= 1;
      } else if (head) {
        head.done = true;
      }
      while (trail.length && trail[trail.length - 1].age > STIR_LIFE) trail.pop();
      for (let i = 0; i < MAX_STIRS; i++) {
        const sample = trail[i];
        if (!sample) {
          stirWeights[i] = 0;
          continue;
        }
        const fade = Math.max(0, 1 - sample.age / STIR_LIFE);
        const cap = Math.min(1, 2.2 / Math.max(Math.hypot(sample.vx, sample.vy), 0.001));
        stirs.set([sample.x, sample.y, sample.vx * cap, sample.vy * cap], i * 4);
        // 枯山水细沙抚平（三次幂平滑非线性消融：初划如刀刻分明，中程向外扩散，终了如鸟飞虚空无痕可寻）
        stirWeights[i] = fade * fade * fade * sample.grow * s.stir * 0.065;
      }
      spins.forEach(spin => {
        spin.age += dt;
      });
      while (spins.length && spins[spins.length - 1].age > TWIRL_LIFE) spins.pop();
      for (let i = 0; i < MAX_TWIRLS; i++) {
        const spin = spins[i];
        if (!spin) {
          twirls[i * 4 + 2] = 0;
          continue;
        }
        const k = spin.age / TWIRL_LIFE;
        // 旋转激荡渐缓并化解抚平
        const envelope = Math.min(1, spin.age / 0.22) * (1 - k) * (1 - k) * (1 - k);
        twirls.set([spin.x, spin.y, spin.direction * 2.6 * envelope, 0.16 + 0.14 * Math.min(1, spin.age / 0.6)], i * 4);
      }
    };

    const frame = now => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settings;
      const dt = last ? clamp((now - last) / 1000, 0.001, 0.05) : 1 / 60;
      last = now;
      if (!reduce) time += dt * s.speed * 0.16;
      if (introClock < 1) introClock = Math.min(1, introClock + dt / INTRO_SECONDS);
      grainClock += dt;
      if (s.grainAnimated && !reduce && grainClock > 1 / 24) {
        grainClock = 0;
        frameSeed = (frameSeed + 1) % 97;
      }
      updateTouches(dt, view.width / view.height);
      // 出入息念环境微律动 (4秒吸气，6秒呼气，周期 10 秒)
      const breathSec = (now * 0.001) % 10.0;
      let breath = 0.0;
      if (breathSec < 4.0) {
        const p = breathSec / 4.0;
        breath = p * p * (3.0 - 2.0 * p);
      } else {
        const p = (breathSec - 4.0) / 6.0;
        breath = 1.0 - p * p * (3.0 - 2.0 * p);
      }
      draw(breath);
      const busy =
        (!reduce && (s.speed > 0 || s.grainAnimated)) || introClock < 1 || trail.length > 0 || spins.length > 0;
      if (busy) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    function wake() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }

    const locate = event => {
      const x = event.clientX / Math.max(1, window.innerWidth);
      const y = 1 - event.clientY / Math.max(1, window.innerHeight);
      pointer.inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      pointer.x = x;
      pointer.y = y;
      if (pointer.fresh || !pointer.inside) {
        pointer.sx = x;
        pointer.sy = y;
        pointer.fresh = false;
      }
    };

    const onPointerMove = event => {
      locate(event);
      if (pointer.inside || trail.length) wake();
    };

    const onPointerDown = event => {
      locate(event);
      const s = settings;
      if (!pointer.inside || !s.clickSwirl || reduce) return;
      spins.unshift({
        x: (pointer.x - 0.5) * (view.width / view.height),
        y: pointer.y - 0.5,
        age: 0,
        direction: pointer.vx < 0 ? 1 : -1
      });
      if (spins.length > MAX_TWIRLS) spins.pop();
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    let cosmicCruiseHour = null; // null: 随真实时钟运转; number: 巡礼模式固定小时
    let lastCosmicMinute = -1;
    const cosmicListeners = new Set();

    const applyCosmicTheme = (force = false) => {
      if (!settings.diurnalShift) return;
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      if (!force && cosmicCruiseHour === null && currentMin === lastCosmicMinute) return;
      lastCosmicMinute = currentMin;

      const hourToUse = (typeof cosmicCruiseHour === 'number')
        ? cosmicCruiseHour
        : (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);

      const theme = calculateCosmicTheme(hourToUse);
      settings.colors = theme.colors;
      settings.silk = theme.silk;
      settings.contrast = theme.contrast;
      paletteKey = '';

      if (document.body && !document.body.classList.contains('light-mode')) {
        document.body.style.backgroundColor = theme.colors[0];
      }
      wake();

      const state = {
        ...theme,
        isCruise: typeof cosmicCruiseHour === 'number'
      };
      cosmicListeners.forEach(fn => {
        try { fn(state); } catch(e) {}
      });
    };

    applyCosmicTheme(true);

    const cosmicTimer = setInterval(() => {
      applyCosmicTheme(false);
    }, 20000);

    resize();

    return {
      setOptions: newOpts => {
        Object.assign(settings, newOpts);
        paletteKey = '';
        wake();
      },
      setCosmicCruise: hour => {
        cosmicCruiseHour = (typeof hour === 'number') ? hour : null;
        applyCosmicTheme(true);
      },
      getCosmicState: () => {
        const now = new Date();
        const hour = (typeof cosmicCruiseHour === 'number')
          ? cosmicCruiseHour
          : (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
        return {
          ...calculateCosmicTheme(hour),
          isCruise: typeof cosmicCruiseHour === 'number'
        };
      },
      onCosmicUpdate: cb => {
        if (typeof cb === 'function') {
          cosmicListeners.add(cb);
          const now = new Date();
          const hour = (typeof cosmicCruiseHour === 'number')
            ? cosmicCruiseHour
            : (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
          try {
            cb({
              ...calculateCosmicTheme(hour),
              isCruise: typeof cosmicCruiseHour === 'number'
            });
          } catch(e) {}
        }
        return () => cosmicListeners.delete(cb);
      },
      destroy: () => {
        clearInterval(cosmicTimer);
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        document.documentElement.removeEventListener('pointerleave', onPointerLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        gl.deleteTexture(target);
        gl.deleteFramebuffer(buffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(field.program);
        gl.deleteProgram(composite.program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }

  // Auto initialize on DOM ready
  const defaultOptions = {
    colors: ['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'],
    angle: 55,
    flow: 0.8,
    silk: 0.35,
    grainAmount: 0.08,
    grainSize: 1.2,
    grainAnimated: true,
    diurnalShift: true,
    lightMode: false // Matches about.html dark theme
  };

  function start() {
    const opts = Object.assign({}, defaultOptions, window.GRAINIENT_OPTIONS || {});
    window.GrainientInstance = initGrainient(opts);
  }

  // 挂载全局天文引擎
  window.GrainientCosmic = {
    COSMIC_SEASONS,
    getLunarState,
    calculateCosmicTheme
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
