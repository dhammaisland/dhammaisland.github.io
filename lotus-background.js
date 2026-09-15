/**
 * Lotus Background Generator
 * 随机生成并分布莲花纹样背景
 */

(function() {
    // 莲花纹样 SVG 路径数据 (基于用户提供的传统纹样素材)
    const LOTUS_PATTERNS = [
        // 纹样 1: 经典八瓣莲花 (类似北魏风格，简洁庄严)
        '<path d="M50 0C55 20 70 30 100 50C70 70 55 80 50 100C45 80 30 70 0 50C30 30 45 20 50 0Z" />' +
        '<circle cx="50" cy="50" r="10" />',
        
        // 纹样 2: 多层重瓣莲花 (唐代风格，丰满华丽)
        '<path d="M50 10C60 30 90 40 90 50C90 60 60 70 50 90C40 70 10 60 10 50C10 40 40 30 50 10Z" />' +
        '<path d="M50 0C65 25 100 35 100 50C100 65 65 75 50 100C35 75 0 65 0 50C0 35 35 25 50 0Z" fill-opacity="0.5" />',
        
        // 纹样 3: 宝相花风格 (辽代风格，带卷叶纹)
        '<path d="M50 20C60 35 80 40 80 50C80 60 60 65 50 80C40 65 20 60 20 50C20 40 40 35 50 20Z" />' +
        '<path d="M50 50Q70 10 90 30T70 70Q30 90 10 70T30 30Q50 10 70 30" fill="none" stroke="currentColor" stroke-width="2" />',
        
        // 纹样 4: 几何抽象莲花
        '<path d="M50 15 L65 40 L90 50 L65 60 L50 85 L35 60 L10 50 L35 40 Z" />' +
        '<circle cx="50" cy="50" r="5" />' +
        '<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="1" />',
        
        // 纹样 5: 禅意简约瓣
        '<path d="M50 5C60 25 95 45 50 95C5 45 40 25 50 5Z" />'
    ];

    function initLotusBackground() {
        // 创建背景容器
        const container = document.createElement('div');
        container.className = 'lotus-bg-container';
        // 确保容器在最底层
        Object.assign(container.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            pointerEvents: 'none',
            overflow: 'hidden'
        });
        document.body.prepend(container);

        // 随机生成的配置
        const count = window.innerWidth < 768 ? 10 : 18; // 移动端稍微少一点
        
        for (let i = 0; i < count; i++) {
            createLotus(container);
        }
    }

    function createLotus(container) {
        const lotus = document.createElement('div');
        lotus.className = 'lotus-item';
        
        // 随机选择纹样
        const patternIndex = Math.floor(Math.random() * LOTUS_PATTERNS.length);
        const pattern = LOTUS_PATTERNS[patternIndex];
        
        // 随机属性
        const size = Math.floor(Math.random() * 250) + 150; // 150px - 400px
        const left = Math.random() * 110 - 5; // -5% 到 105%
        const top = Math.random() * 110 - 5;
        const rotation = Math.floor(Math.random() * 360);
        const opacity = (Math.random() * 0.08 + 0.04).toFixed(3); // 0.04 - 0.12 的极低透明度
        
        lotus.innerHTML = `
            <svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="currentColor">
                ${pattern}
            </svg>
        `;

        Object.assign(lotus.style, {
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
            width: `${size}px`,
            height: `${size}px`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            opacity: opacity,
            color: 'var(--lotus-color, #8d5a2a)',
            transition: 'opacity 0.5s ease'
        });

        container.appendChild(lotus);
    }

    // 监听主题变化 (如果需要根据主题动态调整)
    // 主要是通过 CSS 变量 --lotus-color 来实现的，所以这里不需要额外逻辑

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLotusBackground);
    } else {
        initLotusBackground();
    }
})();
