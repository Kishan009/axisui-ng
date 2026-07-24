import type { AxIconName } from '@axisui-ng/icons';

export interface StatItem {
  label: string;
  value: number | string;
  trend?: number;
  prefix?: string;
  suffix?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  features: string[];
  cta?: string;
  highlighted?: boolean;
}

export interface FeatureItem {
  icon: AxIconName;
  title: string;
  description: string;
}

export type AuthMode = 'login' | 'signup';

export interface AuthSubmit {
  email: string;
  password: string;
  name?: string;
}
