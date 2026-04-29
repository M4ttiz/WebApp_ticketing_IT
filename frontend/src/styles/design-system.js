/**
 * Design system tokens — single source of truth for theme values.
 * Use Tailwind semantic classes in JSX (bg-surface-main, text-text-primary, …)
 * imported via tailwind.config.js; this file documents and exports raw values for JS (charts, etc.).
 */

export const colors = {
  background: '#0F1117',
  backgroundCard: '#16181E',
  backgroundHover: '#1E2028',
  sidebar: '#0C0E13',
  borderSubtle: '#2A2D35',
  borderFocus: '#4F6EF7',
  textPrimary: '#F0F2F7',
  textSecondary: '#8B8FA8',
  textDisabled: '#4A4E62',
  accent: '#4F6EF7',
  accentHover: '#3D5CE6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
}

export const ticketStatusColors = {
  APERTO: { bg: 'rgba(79, 110, 247, 0.15)', text: '#4F6EF7', dot: '#4F6EF7' },
  IN_LAVORAZIONE: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', dot: '#F59E0B' },
  IN_ATTESA: { bg: 'rgba(139, 143, 168, 0.15)', text: '#8B8FA8', dot: '#8B8FA8' },
  RISOLTO: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E', dot: '#22C55E' },
  CHIUSO: { bg: 'rgba(74, 78, 98, 0.15)', text: '#4A4E62', dot: '#4A4E62' },
  RIFIUTATO: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', dot: '#EF4444' },
}

export const typography = {
  fontSans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
  display: { fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
  heading: { fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
  subheading: { fontSize: '15px', fontWeight: 500, lineHeight: 1.4 },
  body: { fontSize: '14px', fontWeight: 400, lineHeight: 1.6 },
  caption: { fontSize: '12px', fontWeight: 400, lineHeight: 1.5 },
  code: { fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
}

export const spacing = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80]

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  pill: '9999px',
}

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  elevated: '0 4px 16px rgba(0,0,0,0.5)',
  focusRing: '0 0 0 3px rgba(79,110,247,0.3)',
}

/** Structured accessor for non-JSX usage */
export const ds = {
  color: colors,
  ticketStatus: ticketStatusColors,
  type: typography,
  spacing,
  radius,
  shadow: shadows,
}

/** Chart palette — aligned with accent / semantic colors */
export const chartPalette = [
  colors.accent,
  colors.success,
  colors.warning,
  '#8B5CF6',
  colors.info,
  colors.danger,
]
