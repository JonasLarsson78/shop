export type ThemeMode = 'default' | 'teal' | 'rose' | 'custom'

export type ThemeSelection = {
  mode: ThemeMode
  customAccentHex: string
  customMutedHex: string
  customDangerHex: string
}

type ThemePalette = {
  accent: string
  secondary: string
  danger: string
}

const THEME_STORAGE_KEY = 'template-shop-theme-v1'
const DEFAULT_CUSTOM_ACCENT_HEX = '#4f46e5'
const DEFAULT_CUSTOM_MUTED_HEX = '#0f766e'
const DEFAULT_CUSTOM_DANGER_HEX = '#be123c'

const presetPalettes: Record<Exclude<ThemeMode, 'custom'>, ThemePalette> = {
  default: {
    accent: '#4f46e5',
    secondary: '#0f766e',
    danger: '#be123c',
  },
  teal: {
    accent: '#0f766e',
    secondary: '#4f46e5',
    danger: '#be123c',
  },
  rose: {
    accent: '#be123c',
    secondary: '#4f46e5',
    danger: '#4f46e5',
  },
}

export const themeOptions: Array<{ id: ThemeMode; label: string }> = [
  { id: 'default', label: 'Blå' },
  { id: 'teal', label: 'Grön' },
  { id: 'rose', label: 'Rosa' },
  { id: 'custom', label: 'Custom' },
]

const isThemeMode = (value: unknown): value is ThemeMode => value === 'default' || value === 'teal' || value === 'rose' || value === 'custom'

const normalizeHex = (value: string) => {
  const trimmed = value.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const expanded = trimmed
      .slice(1)
      .split('')
      .map((character) => `${character}${character}`)
      .join('')

    return `#${expanded.toLowerCase()}`
  }

  return ''
}

export const isValidHex = (value: string) => normalizeHex(value).length > 0

const parseStoredTheme = (raw: string | null): ThemeSelection | null => {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ThemeSelection> & { customHex?: unknown }

    if (!isThemeMode(parsed.mode)) {
      return null
    }

    const legacyCustomHex = typeof parsed.customHex === 'string' ? normalizeHex(parsed.customHex) : ''
    const customAccentHex = typeof parsed.customAccentHex === 'string'
      ? normalizeHex(parsed.customAccentHex)
      : legacyCustomHex
    const customMutedHex = typeof parsed.customMutedHex === 'string'
      ? normalizeHex(parsed.customMutedHex)
      : DEFAULT_CUSTOM_MUTED_HEX
    const customDangerHex = typeof parsed.customDangerHex === 'string'
      ? normalizeHex(parsed.customDangerHex)
      : DEFAULT_CUSTOM_DANGER_HEX

    return {
      mode: parsed.mode,
      customAccentHex: customAccentHex || DEFAULT_CUSTOM_ACCENT_HEX,
      customMutedHex: customMutedHex || DEFAULT_CUSTOM_MUTED_HEX,
      customDangerHex: customDangerHex || DEFAULT_CUSTOM_DANGER_HEX,
    }
  } catch {
    return null
  }
}

export const getStoredTheme = (): ThemeSelection => {
  if (typeof window === 'undefined') {
    return {
      mode: 'default',
      customAccentHex: DEFAULT_CUSTOM_ACCENT_HEX,
      customMutedHex: DEFAULT_CUSTOM_MUTED_HEX,
      customDangerHex: DEFAULT_CUSTOM_DANGER_HEX,
    }
  }

  const parsedTheme = parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY))

  return parsedTheme ?? {
    mode: 'default',
    customAccentHex: DEFAULT_CUSTOM_ACCENT_HEX,
    customMutedHex: DEFAULT_CUSTOM_MUTED_HEX,
    customDangerHex: DEFAULT_CUSTOM_DANGER_HEX,
  }
}

const hexToRgb = (hex: string) => {
  const normalizedHex = normalizeHex(hex)

  if (!normalizedHex) {
    return null
  }

  const value = normalizedHex.slice(1)
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return { red, green, blue }
}

const toRgba = (hex: string, alpha: number) => {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return `rgba(79, 70, 229, ${alpha})`
  }

  return `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, ${alpha})`
}

const getContrastTextColor = (hex: string) => {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return '#ffffff'
  }

  const red = rgb.red / 255
  const green = rgb.green / 255
  const blue = rgb.blue / 255

  const linearize = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

  const luminance =
    0.2126 * linearize(red) +
    0.7152 * linearize(green) +
    0.0722 * linearize(blue)

  return luminance > 0.55 ? '#000000' : '#ffffff'
}

const getPalette = (selection: ThemeSelection): ThemePalette => {
  if (selection.mode === 'custom') {
    const customAccentHex = normalizeHex(selection.customAccentHex)
    const customMutedHex = normalizeHex(selection.customMutedHex)
    const customDangerHex = normalizeHex(selection.customDangerHex)

    return {
      accent: customAccentHex || DEFAULT_CUSTOM_ACCENT_HEX,
      secondary: customMutedHex || DEFAULT_CUSTOM_MUTED_HEX,
      danger: customDangerHex || DEFAULT_CUSTOM_DANGER_HEX,
    }
  }

  return presetPalettes[selection.mode]
}

export const applyTheme = (selection: ThemeSelection) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const palette = getPalette(selection)

  root.setAttribute('data-theme', selection.mode)
  root.style.setProperty('--theme-accent', palette.accent)
  root.style.setProperty('--theme-accent-soft', toRgba(palette.accent, 0.16))
  root.style.setProperty('--theme-accent-border', palette.accent)
  root.style.setProperty('--theme-page-top', toRgba(palette.accent, 0.1))
  root.style.setProperty('--theme-page-mid', toRgba(palette.secondary, 0.08))
  root.style.setProperty('--theme-topbar-top', toRgba(palette.accent, 0.12))
  root.style.setProperty('--theme-topbar-mid', toRgba(palette.secondary, 0.1))
  root.style.setProperty('--theme-hero-top', toRgba(palette.accent, 0.09))
  root.style.setProperty('--theme-hero-mid', toRgba(palette.secondary, 0.14))
  root.style.setProperty('--theme-button-primary-bg', palette.accent)
  root.style.setProperty('--theme-button-primary-text', getContrastTextColor(palette.accent))
  root.style.setProperty('--theme-button-muted-bg', palette.secondary)
  root.style.setProperty('--theme-button-muted-text', getContrastTextColor(palette.secondary))
  root.style.setProperty('--theme-button-danger-bg', palette.danger)
  root.style.setProperty('--theme-button-danger-text', getContrastTextColor(palette.danger))
}

export const setTheme = (selection: ThemeSelection) => {
  const normalizedSelection: ThemeSelection = {
    mode: selection.mode,
    customAccentHex: normalizeHex(selection.customAccentHex) || DEFAULT_CUSTOM_ACCENT_HEX,
    customMutedHex: normalizeHex(selection.customMutedHex) || DEFAULT_CUSTOM_MUTED_HEX,
    customDangerHex: normalizeHex(selection.customDangerHex) || DEFAULT_CUSTOM_DANGER_HEX,
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalizedSelection))
  }

  applyTheme(normalizedSelection)
}