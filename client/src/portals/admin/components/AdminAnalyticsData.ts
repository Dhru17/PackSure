/**
 * Static Demo Analytics Definitions for Admin Dashboard
 * 
 * Note: These are structured static values representing administrative master data scale
 * and Rule Book distribution. They are centralized here with full TypeScript typing so they
 * can be seamlessly replaced with real API data in the future.
 */

export interface AdminMasterDataMetrics {
  companies: number;
  plants: number;
  products: number;
  inspectors: number;
  regulatoryRules: number;
}

export interface RuleCategoryDistribution {
  category: string;
  count: number;
  color?: string;
}

export interface RuleStatusDistribution {
  activeCount: number;
  inactiveCount: number;
  activePercentage: number;
  inactivePercentage: number;
  totalCount: number;
}

export interface AdminDashboardAnalytics {
  masterData: AdminMasterDataMetrics;
  rulesByCategory: RuleCategoryDistribution[];
  ruleStatus: RuleStatusDistribution;
}

export const staticAdminDashboardAnalytics: AdminDashboardAnalytics = {
  masterData: {
    companies: 42,
    plants: 78,
    products: 426,
    inspectors: 31,
    regulatoryRules: 49
  },
  rulesByCategory: [
    { category: 'Food', count: 24, color: '#174A7E' },
    { category: 'Beverages', count: 11, color: '#0F766E' },
    { category: 'Electronics', count: 8, color: '#7C3AED' },
    { category: 'Other', count: 6, color: '#D97706' }
  ],
  ruleStatus: {
    activeCount: 40,
    inactiveCount: 9,
    activePercentage: 82,
    inactivePercentage: 18,
    totalCount: 49
  }
};
