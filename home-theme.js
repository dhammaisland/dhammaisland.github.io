/* 首页配色控制。沿用 dark-theme，供墨竹、页脚和侧光识别明暗。 */
(function () {
    'use strict';

    const palettes = window.DharmaPalettes;
    const storageKey = 'dhamma-home-palette';
    const darkThemes = new Set([
        'aruna', 'candima', 'yakkha', 'asura', 'gandhabba', 'mara',
        'samādhi', 'shuyuan-yamo', 'kasaya', 'canghai-liujin', 'cangsong-liujin'
    ]);
    const labels = {
        'gongque-danqing': '宫阙丹青', 'jiangnan-yanyu': '江南烟雨',
        'chunshan-xincha': '春山新茶', 'shuyuan-yamo': '书院雅墨',
        'tianqing-ruci': '天青汝瓷', 'kasaya': '袈裟',
        'pancavanna': '五色', 'chanlin': '禅林', 'ruihe': '瑞鹤',
        'canghai-liujin': '沧海流金', 'cangsong-liujin': '苍松流金'
    };
    const isValid = name => Object.hasOwn(palettes, name);
    // 浅色主色上的按钮使用深色文字，避免原始白字在浅金、浅蓝上失去对比。
    function primaryText(color) {
        const hex = ({ black: '#000000', crimson: '#dc143c' })[color] || color;
        const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255);
        const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
        return (1.05 / (luminance + 0.05)) >= ((luminance + 0.05) / 0.05) ? '#ffffff' : '#000000';
    }
    const read = key => {
        try { return localStorage.getItem(key); } catch { return null; }
    };
    const write = (key, value) => {
        try { localStorage.setItem(key, value); } catch { /* 禁用存储时仍可切换。 */ }
    };
    let current = read(storageKey);
    if (!isValid(current)) {
        current = read('theme') === 'light' ? 'suriya' : 'aruna';
    }

    function apply(name) {
        if (!isValid(name)) name = 'aruna';
        current = name;
        const tone = darkThemes.has(name) ? 'dark' : 'light';
        const root = document.documentElement;
        for (const [key, value] of Object.entries(palettes[name])) {
            root.style.setProperty(`--${key}`, value);
        }
        root.style.setProperty('--home-on-primary', primaryText(palettes[name]['color-primary']));
        root.dataset.homePalette = name;
        root.style.colorScheme = tone;
        write(storageKey, name);
        write(`${storageKey}-${tone}`, name);
        // 与其他页面现有的明暗设置兼容。
        write('theme', tone);
        if (document.body) {
            document.body.classList.toggle('dark-theme', tone === 'dark');
            document.body.dataset.themeTone = tone;
        }
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = tone === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            const label = tone === 'dark' ? '切换为亮色配色' : '切换为暗色配色';
            toggle.title = label;
            toggle.setAttribute('aria-label', label);
        }
        const selector = document.getElementById('home-palette');
        if (selector) selector.value = name;
        document.dispatchEvent(new CustomEvent('home-palette-changed', { detail: { name, tone } }));
    }

    function toggle() {
        const target = darkThemes.has(current) ? 'light' : 'dark';
        const saved = read(`${storageKey}-${target}`);
        const matchesTone = isValid(saved) && darkThemes.has(saved) === (target === 'dark');
        apply(matchesTone ? saved : (target === 'dark' ? 'aruna' : 'suriya'));
    }

    function initSelector() {
        const selector = document.getElementById('home-palette');
        if (!selector || selector.options.length) return;
        for (const tone of ['light', 'dark']) {
            const group = document.createElement('optgroup');
            group.label = tone === 'dark' ? '暗色配色' : '亮色配色';
            for (const name of Object.keys(palettes)) {
                if (darkThemes.has(name) !== (tone === 'dark')) continue;
                const option = document.createElement('option');
                option.value = name;
                option.textContent = labels[name] || name[0].toUpperCase() + name.slice(1);
                group.appendChild(option);
            }
            selector.appendChild(group);
        }
        selector.value = current;
        selector.addEventListener('change', () => apply(selector.value));
    }

    window.DharmaTheme = { apply, toggle, restore: () => apply(current) };
    // 在正文绘制前设置变量，刷新时沿用已选配色。
    apply(current);
    document.addEventListener('DOMContentLoaded', () => {
        apply(current);
        initSelector();
    });
})();
