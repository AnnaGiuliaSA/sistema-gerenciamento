import { traduzir } from './i18n.js';

const THEME_STORAGE_KEY = 'theme';
const THEMES = ['light', 'dark'];
let activeTheme = 'light';

function getSavedTheme() {
    try {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        return THEMES.includes(savedTheme) ? savedTheme : null;
    } catch (error) {
        console.error('Could not read the saved color theme preference.', error);
        return null;
    }
}

function applyTheme(theme, toggles) {
    activeTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121826' : '#F5F3FF');
    toggles.forEach(toggle => {
        toggle.setAttribute('aria-pressed', String(theme === 'dark'));
        atualizarRotuloThemeToggle(toggle);
        const sunIcon = toggle.querySelector('[data-theme-icon="sun"]');
        const moonIcon = toggle.querySelector('[data-theme-icon="moon"]');
        if (sunIcon && moonIcon) {
            sunIcon.hidden = theme === 'dark';
            moonIcon.hidden = theme === 'light';
        }
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

export function atualizarRotuloThemeToggle(toggles = document.querySelectorAll('[data-theme-toggle]')) {
    const buttons = toggles instanceof Element ? [toggles] : [...toggles];
    const chave = activeTheme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark';
    const rotulo = traduzir(chave);
    buttons.forEach(toggle => {
        toggle.setAttribute('aria-label', rotulo);
        toggle.title = rotulo;
        const label = toggle.querySelector('[data-theme-toggle-label]');
        if (label) label.textContent = rotulo;
    });
}

export function initThemeToggle() {
    const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
    if (!toggles.length || toggles.some(toggle =>
        !toggle.querySelector('[data-theme-icon="sun"]') ||
        !toggle.querySelector('[data-theme-icon="moon"]')
    )) {
        console.error('Theme toggle is unavailable: expected buttons with sun/moon icons were not found.');
        return;
    }
    if (toggles.every(toggle => toggle.dataset.themeInitialized === 'true')) return;
    toggles.forEach(toggle => {
        toggle.dataset.themeInitialized = 'true';
    });

    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)');
    let savedTheme = getSavedTheme();
    let currentTheme = savedTheme || (systemPreference.matches ? 'dark' : 'light');
    applyTheme(currentTheme, toggles);

    toggles.forEach(toggle => toggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        savedTheme = currentTheme;
        try {
            localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
        } catch (error) {
            console.error('Could not save the color theme preference.', error);
        }
        applyTheme(currentTheme, toggles);
    }));

    systemPreference.addEventListener('change', event => {
        if (savedTheme) return;
        currentTheme = event.matches ? 'dark' : 'light';
        applyTheme(currentTheme, toggles);
    });
}
