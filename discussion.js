// 法义讨论页面 - 主题切换
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const isDark = body.classList.toggle('dark-theme');

    if (isDark) {
        themeIcon.className = 'bi bi-sun-fill';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'bi bi-moon-stars-fill';
        localStorage.setItem('theme', 'light');
    }
}

// 页面加载时恢复主题
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.className = 'bi bi-sun-fill';
    }
});
