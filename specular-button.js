/**
 * Specular Button - 原生 WebGL 镜面高光边缘动效
 * 纯原生实现，零第三方依赖，兼容 file:// 本地与 http:// 线上环境
 */

(function () {
  'use strict';

  const PAD = 20;

  const VERT_SRC = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const FRAG_SRC = `
    precision highp float;

    uniform vec2 uCenter;
    uniform vec2 uHalfSize;
    uniform float uRadius;
    uniform float uAngle;
    uniform float uPx;
    uniform vec3 uLineColor;
    uniform vec3 uBaseColor;
    uniform float uIntensity;
    uniform float uShineSize;
    uniform float uShineFade;
    uniform float uThickness;
    uniform float uBaseWidth;

    float sdRoundedRect(vec2 p, vec2 b, float r) {
      vec2 q = abs(p) - b + r;
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    }

    float shapeSDF(vec2 p) {
      return sdRoundedRect(p, uHalfSize, uRadius);
    }

    float gaussianLine(float d, float sigma) {
      float x = d / (sigma + 1e-6);
      float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
      return exp(-k * x * x);
    }

    void main() {
      vec2 p = gl_FragCoord.xy - uCenter;
      float d = shapeSDF(p);
      vec2 L = vec2(cos(uAngle), sin(uAngle));

      // 暗色底边描边，增加立体厚度
      float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

      // 椭圆法线与对称镜面高光反射
      vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
      float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
      float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
      float line = gaussianLine(d, uThickness);
      
      // 适度延展外光晕（从 3.0*uPx 扩大到 6.0*uPx），使发光更有质感与可见度
      float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 6.0 * uPx, abs(d));
      float hi = line * rim * edgeClamp * uIntensity;

      vec3 col = uBaseColor * base + uLineColor * hi;
      float a = clamp(base + hi, 0.0, 1.0);
      gl_FragColor = vec4(col, a);
    }
  `;

  // 颜色解析辅助函数，支持 hex、rgb、rgba
  function parseColor(str, fallback) {
    if (!str) return fallback;
    if (Array.isArray(str)) return str;
    str = String(str).trim();
    if (str.startsWith('#')) {
      let hex = str.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        const num = parseInt(hex, 16);
        return [(num >> 16 & 255) / 255, (num >> 8 & 255) / 255, (num & 255) / 255];
      }
    }
    const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) {
      return [parseInt(m[1], 10) / 255, parseInt(m[2], 10) / 255, parseInt(m[3], 10) / 255];
    }
    return fallback;
  }

  function createShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[SpecularButton] Shader compile failed:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[SpecularButton] Program link failed:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  /**
   * 为目标按钮附加高光边框效果
   */
  function attachSpecularButton(btn, options) {
    if (!btn || btn._specularAttached) return null;
    btn._specularAttached = true;
    options = options || {};

    btn.classList.add('specular-button');

    // 创建 fx 容器与 canvas
    let fx = btn.querySelector('.specular-button__fx');
    if (!fx) {
      fx = document.createElement('span');
      fx.className = 'specular-button__fx';
      fx.setAttribute('aria-hidden', 'true');
      btn.insertBefore(fx, btn.firstChild);
    }

    const canvas = document.createElement('canvas');
    fx.appendChild(canvas);

    // 获取 WebGL 上下文
    let gl = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
      }) || canvas.getContext('experimental-webgl');
    } catch (e) {
      console.warn('[SpecularButton] WebGL context failed:', e);
      return null;
    }

    if (!gl) {
      console.warn('[SpecularButton] WebGL not supported.');
      return null;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const prog = createProgram(gl, VERT_SRC, FRAG_SRC);
    if (!prog) return null;
    gl.useProgram(prog);

    // 绘制铺满平面的大三角形
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // 获取 Uniforms 索引
    const u = {
      center: gl.getUniformLocation(prog, 'uCenter'),
      halfSize: gl.getUniformLocation(prog, 'uHalfSize'),
      radius: gl.getUniformLocation(prog, 'uRadius'),
      angle: gl.getUniformLocation(prog, 'uAngle'),
      px: gl.getUniformLocation(prog, 'uPx'),
      lineColor: gl.getUniformLocation(prog, 'uLineColor'),
      baseColor: gl.getUniformLocation(prog, 'uBaseColor'),
      intensity: gl.getUniformLocation(prog, 'uIntensity'),
      shineSize: gl.getUniformLocation(prog, 'uShineSize'),
      shineFade: gl.getUniformLocation(prog, 'uShineFade'),
      thickness: gl.getUniformLocation(prog, 'uThickness'),
      baseWidth: gl.getUniformLocation(prog, 'uBaseWidth'),
    };

    const dataset = btn.dataset || {};
    const computedStyle = window.getComputedStyle(btn);

    const getRadius = function () {
      if (options.radius !== undefined) return options.radius;
      if (dataset.radius !== undefined) return parseFloat(dataset.radius);
      const br = computedStyle.borderRadius || '16px';
      const parsed = parseFloat(br);
      return isNaN(parsed) ? 16 : parsed;
    };

    const getLineColor = function () {
      return options.lineColor || dataset.lineColor || computedStyle.getPropertyValue('--sb-line-color').trim() || '#ffffff';
    };

    const getBaseColor = function () {
      return options.baseColor || dataset.baseColor || computedStyle.getPropertyValue('--sb-base-color').trim() || '#8d5a2a';
    };

    const props = {
      intensity: options.intensity !== undefined ? options.intensity : (dataset.intensity ? parseFloat(dataset.intensity) : 1.8),
      shineSize: options.shineSize !== undefined ? options.shineSize : (dataset.shineSize ? parseFloat(dataset.shineSize) : 14),
      shineFade: options.shineFade !== undefined ? options.shineFade : (dataset.shineFade ? parseFloat(dataset.shineFade) : 38),
      thickness: options.thickness !== undefined ? options.thickness : (dataset.thickness ? parseFloat(dataset.thickness) : 2.0),
      speed: options.speed !== undefined ? options.speed : (dataset.speed ? parseFloat(dataset.speed) : 0.45),
      followMouse: options.followMouse !== undefined ? options.followMouse : (dataset.followMouse !== 'false'),
      proximity: options.proximity !== undefined ? options.proximity : (dataset.proximity ? parseFloat(dataset.proximity) : 260),
      autoAnimate: options.autoAnimate !== undefined ? options.autoAnimate : (dataset.autoAnimate !== 'false'),
    };

    const sizeRef = { w: 1, h: 1 };
    const resize = function () {
      const rect = btn.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w <= 0 || h <= 0) return;
      sizeRef.w = w;
      sizeRef.h = h;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round((w + PAD * 2) * dpr);
      const ph = Math.round((h + PAD * 2) * dpr);

      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
        gl.viewport(0, 0, pw, ph);
      }

      gl.useProgram(prog);
      gl.uniform2f(u.center, (PAD + w / 2) * dpr, (PAD + h / 2) * dpr);
      gl.uniform2f(u.halfSize, (w / 2) * dpr, (h / 2) * dpr);
      gl.uniform1f(u.px, dpr);
      gl.uniform1f(u.baseWidth, dpr * 1.5);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(btn);
    resize();

    // 鼠标指针交互
    let pointerAngle = null;
    let proximityT = 0;
    let isVisible = true;

    const onPointerMove = function (e) {
      if (!isVisible) return;
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);

      if (dist === 0) {
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (cy - e.clientY) / (rect.height / 2);
        pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
      }

      const t = Math.max(0, 1 - dist / Math.max(props.proximity, 1));
      proximityT = t * t * (3 - 2 * t);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // 渲染循环
    let angle = 2.4;
    let idleAngle = 2.4;
    let bright = 0.8; // 默认初始化保持可见光亮，刷新页面立即可见流动光芒
    let last = performance.now();
    let raf = 0;

    const update = function (now) {
      if (!isVisible) return;
      raf = requestAnimationFrame(update);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      idleAngle += props.speed * dt;
      const steer = props.followMouse && pointerAngle != null && (!props.autoAnimate || proximityT > 0);
      const target = steer ? pointerAngle : idleAngle;
      const diff = ((target - angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      angle += diff * (1 - Math.exp(-dt * 7));

      // 默认流转亮度为 0.75，鼠标靠近时增强至 1.0
      const brightTarget = props.autoAnimate ? Math.max(0.75, proximityT) : proximityT;
      bright += (brightTarget - bright) * (1 - Math.exp(-dt * 8));

      const curLine = getLineColor();
      const curBase = getBaseColor();
      const lineRgb = parseColor(curLine, [1, 1, 1]);
      const baseRgb = parseColor(curBase, [0.55, 0.35, 0.16]);

      const currentDpr = Math.min(window.devicePixelRatio || 1, 2);
      const currentRadius = getRadius();
      const maxAllowedRadius = Math.min(sizeRef.w, sizeRef.h) / 2;

      gl.useProgram(prog);
      gl.uniform1f(u.angle, angle);
      gl.uniform1f(u.radius, Math.min(currentRadius, maxAllowedRadius) * currentDpr);
      gl.uniform3f(u.lineColor, lineRgb[0], lineRgb[1], lineRgb[2]);
      gl.uniform3f(u.baseColor, baseRgb[0], baseRgb[1], baseRgb[2]);
      gl.uniform1f(u.intensity, props.intensity * bright);
      gl.uniform1f(u.shineSize, (props.shineSize * Math.PI) / 180);
      gl.uniform1f(u.shineFade, (props.shineFade * Math.PI) / 180);
      gl.uniform1f(u.thickness, props.thickness * currentDpr);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // 视口观察器，离开可视区域时休眠
    const io = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        if (!isVisible) {
          isVisible = true;
          last = performance.now();
          raf = requestAnimationFrame(update);
        }
      } else {
        isVisible = false;
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.05 });
    io.observe(btn);

    raf = requestAnimationFrame(update);

    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();
        btn._specularAttached = false;
      }
    };
  }

  function initSpecularButtons() {
    const elements = document.querySelectorAll('.specular-button, [data-specular]');
    elements.forEach(function (el) {
      attachSpecularButton(el);
    });
  }

  window.SpecularButton = {
    attach: attachSpecularButton,
    init: initSpecularButtons,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpecularButtons);
  } else {
    initSpecularButtons();
  }
})();
