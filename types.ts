
export interface CalculationRecord {
  id: string;
  fare: number;
  received: number;
  change: number;
  tip: number;
  timestamp: Date;
}

export type InputMode = 'FARE' | 'RECEIVED' | 'TIP';

export type ThemeId = 'midnight' | 'volt' | 'lava' | 'cyber';

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  primary: string;    // e.g. 'blue'
  secondary: string;  // e.g. 'green'
  bgGlow: string;     // Tailwind color class for bg glow
}

export type CurrencyId = 'EUR' | 'USD' | 'MXN' | 'ARS' | 'COP' | 'GBP' | 'BRL';

export interface CurrencyConfig {
  id: CurrencyId;
  label: string;
  symbol: string;
}
