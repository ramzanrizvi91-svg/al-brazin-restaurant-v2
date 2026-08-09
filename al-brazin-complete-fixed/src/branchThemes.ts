// src/branchThemes.ts — Branch-wise Color Themes

export interface BranchTheme {
  id: string;
  name: string;
  primaryColor: string;      // Main brand color
  accentColor: string;        // Accent/highlight
  backgroundColor: string;    // Page background
  textColor: string;          // Primary text
  borderColor: string;        // Borders
  buttonColor: string;        // CTA button
  statusBg: string;           // Status background
  glowEffect: string;         // Glow/shadow effect
  gradient: string;           // Gradient for headers
}

export const BRANCH_THEMES: { [key: string]: BranchTheme } = {
  golden: {
    id: 'golden',
    name: 'Golden Riyadh',
    primaryColor: '#FFD700',      // Bright Gold
    accentColor: '#FFA500',       // Orange accent
    backgroundColor: '#0A0805',   // Dark brown-black
    textColor: '#FFFFFF',
    borderColor: '#FFD700',
    buttonColor: '#FFD700',
    statusBg: 'rgba(255, 215, 0, 0.1)',
    glowEffect: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
  },

  diamond: {
    id: 'diamond',
    name: 'Diamond Jeddah',
    primaryColor: '#00D9FF',      // Cyan/Diamond blue
    accentColor: '#0099CC',       // Deep blue
    backgroundColor: '#050810',   // Deep navy-black
    textColor: '#FFFFFF',
    borderColor: '#00D9FF',
    buttonColor: '#00D9FF',
    statusBg: 'rgba(0, 217, 255, 0.1)',
    glowEffect: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.5))',
    gradient: 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)'
  },

  prestigino: {
    id: 'prestigino',
    name: 'Prestigino Al Khobar',
    primaryColor: '#FF1493',      // Deep pink/magenta
    accentColor: '#FF69B4',       // Hot pink
    backgroundColor: '#0F0508',   // Dark purple-black
    textColor: '#FFFFFF',
    borderColor: '#FF1493',
    buttonColor: '#FF1493',
    statusBg: 'rgba(255, 20, 147, 0.1)',
    glowEffect: 'drop-shadow(0 0 20px rgba(255, 20, 147, 0.5))',
    gradient: 'linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)'
  },

  mirage: {
    id: 'mirage',
    name: 'Mirage Dammam',
    primaryColor: '#00FF88',      // Neon green
    accentColor: '#00CC66',       // Forest green
    backgroundColor: '#050810',   // Dark black-green
    textColor: '#FFFFFF',
    borderColor: '#00FF88',
    buttonColor: '#00FF88',
    statusBg: 'rgba(0, 255, 136, 0.1)',
    glowEffect: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.5))',
    gradient: 'linear-gradient(135deg, #00FF88 0%, #00CC66 100%)'
  },

  al_rashid: {
    id: 'al_rashid',
    name: 'Al Rashid Khobar',
    primaryColor: '#FF6B35',      // Burnt orange/coral
    accentColor: '#FF8C42',       // Light coral
    backgroundColor: '#0A0805',   // Dark brown
    textColor: '#FFFFFF',
    borderColor: '#FF6B35',
    buttonColor: '#FF6B35',
    statusBg: 'rgba(255, 107, 53, 0.1)',
    glowEffect: 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.5))',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)'
  }
};

// Admin Theme (Neutral, Professional)
export const ADMIN_THEME: BranchTheme = {
  id: 'admin',
  name: 'Admin Panel',
  primaryColor: '#6366F1',        // Indigo (professional)
  accentColor: '#818CF8',         // Light indigo
  backgroundColor: '#0F172A',     // Slate-900
  textColor: '#F1F5F9',
  borderColor: '#475569',
  buttonColor: '#6366F1',
  statusBg: 'rgba(99, 102, 241, 0.1)',
  glowEffect: 'drop-shadow(0 0 15px rgba(99, 102, 241, 0.3))',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)'
};

// Kitchen Display System Theme (High contrast, Clear)
export const KDS_THEME: BranchTheme = {
  id: 'kds',
  name: 'Kitchen Display',
  primaryColor: '#10B981',        // Emerald green (clear, professional)
  accentColor: '#34D399',         // Light emerald
  backgroundColor: '#111827',     // Gray-900
  textColor: '#F3F4F6',
  borderColor: '#4B5563',
  buttonColor: '#10B981',
  statusBg: 'rgba(16, 185, 129, 0.1)',
  glowEffect: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.3))',
  gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
};

/**
 * Get theme by branch ID
 */
export const getThemeByBranch = (branchId: string): BranchTheme => {
  return BRANCH_THEMES[branchId] || BRANCH_THEMES.golden;
};

/**
 * Apply theme to element
 */
export const applyTheme = (element: HTMLElement, theme: BranchTheme) => {
  element.style.setProperty('--primary-color', theme.primaryColor);
  element.style.setProperty('--accent-color', theme.accentColor);
  element.style.setProperty('--bg-color', theme.backgroundColor);
  element.style.setProperty('--text-color', theme.textColor);
  element.style.setProperty('--border-color', theme.borderColor);
  element.style.setProperty('--button-color', theme.buttonColor);
};

/**
 * Get CSS variables for theme
 */
export const getThemeCSS = (theme: BranchTheme): string => {
  return `
    --primary-color: ${theme.primaryColor};
    --accent-color: ${theme.accentColor};
    --bg-color: ${theme.backgroundColor};
    --text-color: ${theme.textColor};
    --border-color: ${theme.borderColor};
    --button-color: ${theme.buttonColor};
    --status-bg: ${theme.statusBg};
    --glow: ${theme.glowEffect};
    --gradient: ${theme.gradient};
  `;
};
