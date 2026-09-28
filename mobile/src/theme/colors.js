export const COLORS = {
  // Backgrounds
  background: '#0F172A',      // Slate 900
  surface: '#1E293B',         // Slate 800
  surfaceElevated: '#334155', // Slate 700
  surfaceCard: '#1E293B',     // Slate 800
  
  // Brand & Accents
  primary: '#3B82F6',         // Blue 500
  primaryLight: '#60A5FA',    // Blue 400
  primaryDark: '#1D4ED8',     // Blue 700
  
  // Safety States
  safeGreen: '#10B981',       // Emerald 500 (PASS / Safe / High confidence)
  safeGreenBg: '#064E3B',     // Dark green card bg
  warningYellow: '#F59E0B',   // Amber 500 (Caution / Lower confidence)
  warningYellowBg: '#78350F', // Dark amber card bg
  dangerRed: '#EF4444',       // Red 500 (Emergency / Deviation)
  dangerRedBg: '#7F1D1D',     // Dark red card bg
  
  // Haven Pin Colors
  havenHospital: '#EF4444',   // Red
  havenPolice: '#3B82F6',     // Blue
  havenStore: '#10B981',      // Green
  havenTransit: '#8B5CF6',    // Purple
  
  // Typography
  textPrimary: '#F8FAFC',     // Slate 50
  textSecondary: '#94A3B8',   // Slate 400
  textMuted: '#64748B',       // Slate 500
  textInverse: '#0F172A',
  
  // Borders & Dividers
  border: '#334155',
  borderHighlight: '#475569',
  
  // Demo Mode
  demoBadge: '#F59E0B',
  demoBadgeText: '#000000'
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  body: {
    fontSize: 14,
    color: COLORS.textPrimary
  },
  caption: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary
  }
};
