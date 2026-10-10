import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, StyleSheet } from 'react-native';

const mono = (iosName) => (Platform.OS === 'ios' ? iosName : 'monospace');

export const THEMES = {
  matrix: {
    name: 'Matrix',
    price: 0,
    font: mono('Courier'),
    glow: 4,
    colors: { bg: '#000000', primary: '#00ff66', dim: '#2a6b3a', danger: '#ff3355', tint: '#052a12' },
  },
  cyberpunk: {
    name: 'Cyberpunk Neón',
    price: 100,
    font: mono('Menlo'),
    glow: 10,
    colors: { bg: '#0a0014', primary: '#00f0ff', dim: '#2a7f8f', danger: '#ff2bd6', tint: '#06222a' },
  },
  amber: {
    name: 'Terminal Ámbar',
    price: 100,
    font: mono('Courier New'),
    glow: 6,
    colors: { bg: '#0d0800', primary: '#ffb000', dim: '#7a5500', danger: '#ff4422', tint: '#2a1c00' },
  },
};

const STORAGE_KEY = 'cyberescape_theme';

export const theme = {
  id: 'matrix',
  font: 'Courier',
  glow: THEMES.matrix.glow,
  ...THEMES.matrix.colors,
};

const BASE_TO_KEY = {
  '#000000': 'bg',
  '#00ff66': 'primary',
  '#2a6b3a': 'dim',
  '#ff3355': 'danger',
  '#052a12': 'tint',
};

function remap(style) {
  if (!style || typeof style !== 'object' || Array.isArray(style)) return style;
  const out = {};
  for (const k in style) {
    const v = style[k];
    if (k === 'fontFamily' && (v === 'Courier' || v === 'monospace')) {
      out[k] = theme.font;
      continue;
    }
    const key = typeof v === 'string' ? BASE_TO_KEY[v.toLowerCase()] : undefined;
    out[k] = key ? theme[key] : v;
  }
  if (typeof style.color === 'string' && style.color.toLowerCase() === '#00ff66' && theme.glow > 0) {
    out.textShadowColor = theme.primary;
    out.textShadowRadius = theme.glow;
    out.textShadowOffset = { width: 0, height: 0 };
  }
  return out;
}

export function createStyles(defs) {
  const created = StyleSheet.create(defs);
  return new Proxy(created, {
    get(target, name) {
      return remap(target[name]);
    },
  });
}

export function applyTheme(id) {
  const t = THEMES[id];
  if (!t) return;
  Object.assign(theme, t.colors, { id, font: t.font, glow: t.glow });
}

export async function persistTheme(id) {
  await AsyncStorage.setItem(STORAGE_KEY, id);
}

export async function loadTheme() {
  try {
    const id = await AsyncStorage.getItem(STORAGE_KEY);
    if (id) applyTheme(id);
  } catch (e) {
    console.warn('No se pudo cargar el tema', e);
  }
}