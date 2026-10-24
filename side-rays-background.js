/**
 * Side Rays Background Effect (法洲 - 禅意侧光动态背景)
 * 基于原生 WebGL 实现，零第三方依赖，具备高性能与明暗主题自适应
 */

(function () {
  // 色彩十六进制转 RGB (0.0 - 1.0)
  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m
      ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
      : [1.0, 1.0, 1.0];
  }

  // 根据发射源方向映射翻转值
  function originToFlip(origin) {
    switch (origin) {
      case 'top-left': return [1.0, 0.0];
      case 'bottom-right': return [0.0, 1.0];
      case 'bottom-left': return [1.0, 1.0];
      default: return [0.0, 0.0]; // top-right
    }
  }

  // 顶点着色器：大三角形铺满全屏剪裁空间
  const VERTEX_SHADER_SRC = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // 片元着色器：数学计算 Side Rays 光束效果
  const FRAGMENT_SHADER_SRC = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform float iSpeed;
    uniform vec3 iRayColor1;
    uniform vec3 iRayColor2;
    uniform float iIntensity;
    uniform float iSpread;
    uniform float iFlipX;
    uniform float iFlipY;
    uniform float iTilt;
    uniform float iSaturation;
    uniform float iBlend;
    uniform float iFalloff;
    uniform float iOpacity;
    uniform float iIsDark;

    float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
      vec2 sourceToCoord = coord - raySource;
      float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
      return clamp(
        (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
        (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
        0.0, 1.0) *
        clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
    }

    void main() {
      vec2 fragCoord = gl_FragCoord.xy;
      if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
      if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

      vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
      vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

      float tiltRad = iTilt * 3.14159265 / 180.0;
      float cs = cos(tiltRad);
      float sn = sin(tiltRad);
      vec2 rel = coord - rayPos;
      vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

      float halfSpread = iSpread * 0.275;
      vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
      vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

      float s1 = rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
      float s2 = rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

      vec4 rays1 = vec4(iRayColor1, 1.0) * s1;
      vec4 rays2 = vec4(iRayColor2, 1.0) * s2;

      vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

      float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;

      if (iIsDark > 0.5) {
        // 暗色模式：保留经典深空自发光模型
        float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
        color.rgb *= brightness;

        float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        color.rgb = mix(vec3(gray), color.rgb, iSaturation);

        color.a = clamp(max(color.r, max(color.g, color.b)) * iOpacity, 0.0, 1.0);
        gl_FragColor = vec4(color.rgb * color.a, color.a);
      } else {
        // 亮色模式：温润晨曦菩提光影模型（水彩漫反射与明暗层次）
        float distFactor = clamp(1.0 - distanceToLight * 0.4, 0.35, 1.0);
        float rayVal = mix(s1, s2, iBlend);

        float contrastRays = smoothstep(0.18, 0.82, rayVal);
        vec3 toneCol = mix(iRayColor2, iRayColor1, contrastRays);

        float gray = dot(toneCol, vec3(0.299, 0.587, 0.114));
        vec3 finalRgb = mix(vec3(gray), toneCol, iSaturation);

        float finalA = clamp(contrastRays * distFactor * iOpacity * iIntensity, 0.0, 0.35);
        gl_FragColor = vec4(finalRgb * finalA, finalA);
      }
    }
  `;

  // 创建并编译 Shader
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[SideRays] Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // 初始化侧光背景
  function initSideRays() {
    if (document.getElementById('side-rays-canvas')) return;

    // 创建 Canvas 元素
    const canvas = document.createElement('canvas');
    canvas.id = 'side-rays-canvas';
    Object.assign(canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '-1', // 置于底层背景，不遮挡正文内容
      pointerEvents: 'none',
      overflow: 'hidden'
    });

    document.body.prepend(canvas);

    // 获取 WebGL 上下文
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false })
            || canvas.getContext('experimental-webgl', { alpha: true, antialias: false, depth: false });

    if (!gl) {
      console.warn('[SideRays] WebGL not supported on this device.');
      return;
    }

    // 编译 Program
    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[SideRays] Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // 创建全屏单个三角形几何体: 3个顶点覆盖屏幕 [-1, -1], [3, -1], [-1, 3]
    const positionLocation = gl.getAttribLocation(program, 'position');
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         3.0, -1.0,
        -1.0,  3.0,
      ]),
      gl.STATIC_DRAW
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 获取 Uniforms 位置
    const uLocations = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      iSpeed: gl.getUniformLocation(program, 'iSpeed'),
      iRayColor1: gl.getUniformLocation(program, 'iRayColor1'),
      iRayColor2: gl.getUniformLocation(program, 'iRayColor2'),
      iIntensity: gl.getUniformLocation(program, 'iIntensity'),
      iSpread: gl.getUniformLocation(program, 'iSpread'),
      iFlipX: gl.getUniformLocation(program, 'iFlipX'),
      iFlipY: gl.getUniformLocation(program, 'iFlipY'),
      iTilt: gl.getUniformLocation(program, 'iTilt'),
      iSaturation: gl.getUniformLocation(program, 'iSaturation'),
      iBlend: gl.getUniformLocation(program, 'iBlend'),
      iFalloff: gl.getUniformLocation(program, 'iFalloff'),
      iOpacity: gl.getUniformLocation(program, 'iOpacity'),
      iIsDark: gl.getUniformLocation(program, 'iIsDark')
    };

    // 配置参数定义（专为佛法氛围调优：舒缓沉静、温和护眼、光亮与暗黑双模适配）
    const getThemeConfig = () => {
      const paletteStyle = document.documentElement.dataset.homePalette
        ? getComputedStyle(document.documentElement) : null;
      const paletteColor = (name, fallback) => {
        const value = paletteStyle?.getPropertyValue(name).trim();
        return ({ black: '#000000', crimson: '#dc143c' })[value] || value || fallback;
      };
      const isDark = document.body.classList.contains('dark-theme') ||
                     document.documentElement.classList.contains('dark-theme') ||
                     (window.localStorage && localStorage.getItem('theme') === 'dark');
      return {
        isDark: isDark ? 1.0 : 0.0,
        speed: isDark ? 0.7 : 0.55,                // 亮色模式微风拂动，静谧舒缓
        origin: 'top-right',                       // 晨曦自右上拂下
        tilt: 0,
        spread: isDark ? 2.0 : 2.2,
        saturation: isDark ? 1.2 : 1.35,
        blend: isDark ? 0.75 : 0.65,
        falloff: isDark ? 1.6 : 1.0,
        rayColor1: paletteColor('--color-primary', isDark ? '#f59e0b' : '#c67d30'),
        rayColor2: paletteColor('--color-secondary', isDark ? '#38bdf8' : '#0ea5e9'),
        intensity: isDark ? 1.5 : 1.25,
        opacity: isDark ? 0.6 : 0.28               // 亮色模式舒适可见（约 20%~25%），清晰可辨且阅读舒适
      };
    };

    let currentConfig = getThemeConfig();

    const applyUniformConfig = (cfg) => {
      const [flipX, flipY] = originToFlip(cfg.origin);
      gl.uniform1f(uLocations.iIsDark, cfg.isDark);
      gl.uniform1f(uLocations.iSpeed, cfg.speed);
      const c1 = hexToRgb(cfg.rayColor1);
      gl.uniform3f(uLocations.iRayColor1, c1[0], c1[1], c1[2]);
      const c2 = hexToRgb(cfg.rayColor2);
      gl.uniform3f(uLocations.iRayColor2, c2[0], c2[1], c2[2]);
      gl.uniform1f(uLocations.iIntensity, cfg.intensity);
      gl.uniform1f(uLocations.iSpread, cfg.spread);
      gl.uniform1f(uLocations.iFlipX, flipX);
      gl.uniform1f(uLocations.iFlipY, flipY);
      gl.uniform1f(uLocations.iTilt, cfg.tilt);
      gl.uniform1f(uLocations.iSaturation, cfg.saturation);
      gl.uniform1f(uLocations.iBlend, cfg.blend);
      gl.uniform1f(uLocations.iFalloff, cfg.falloff);
      gl.uniform1f(uLocations.iOpacity, cfg.opacity);
    };

    applyUniformConfig(currentConfig);

    // 视口尺寸处理
    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const renderW = Math.round(w * dpr);
      const renderH = Math.round(h * dpr);

      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        gl.viewport(0, 0, renderW, renderH);
        gl.uniform2f(uLocations.iResolution, renderW, renderH);
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    // 监听暗色模式变化
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class') {
          currentConfig = getThemeConfig();
          applyUniformConfig(currentConfig);
          break;
        }
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('home-palette-changed', () => {
      currentConfig = getThemeConfig();
      applyUniformConfig(currentConfig);
    });

    // 动画循环与能耗优化
    let animId = null;
    let isRunning = false;

    const renderLoop = (timestamp) => {
      gl.uniform1f(uLocations.iTime, timestamp * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(renderLoop);
    };

    const start = () => {
      if (!isRunning) {
        isRunning = true;
        animId = requestAnimationFrame(renderLoop);
      }
    };

    const stop = () => {
      if (isRunning) {
        isRunning = false;
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      }
    };

    // 页面切入后台时暂停 GPU 渲染
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSideRays);
  } else {
    initSideRays();
  }
})();
