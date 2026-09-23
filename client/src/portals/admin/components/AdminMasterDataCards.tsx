import React from 'react';
import { Building2, Factory, Package, ShieldCheck, Scale } from 'lucide-react';
import type { AdminMasterDataMetrics } from './AdminAnalyticsData';

interface AdminMasterDataCardsProps {
  metrics: AdminMasterDataMetrics;
}

export const AdminMasterDataCards: React.FC<AdminMasterDataCardsProps> = ({ metrics }) => {
  const cards = [
    {
      id: 'companies',
      label: 'Companies',
      value: metrics.companies,
      subtext: 'Registered',
      icon: Building2,
      iconBg: 'bg-[#EFF6FF]',
      iconColor: 'text-[#174A7E]',
      borderHover: 'hover:border-[#174A7E]'
    },
    {
      id: 'plants',
      label: 'Plants',
      value: metrics.plants,
      subtext: 'Configured',
      icon: Factory,
      iconBg: 'bg-[#F0FDF4]',
      iconColor: 'text-[#15803D]',
      borderHover: 'hover:border-[#15803D]'
    },
    {
      id: 'products',
      label: 'Products',
      value: metrics.products,
      subtext: 'Registered',
      icon: Package,
      iconBg: 'bg-[#F5F3FF]',
      iconColor: 'text-[#7C3AED]',
      borderHover: 'hover:border-[#7C3AED]'
    },
    {
      id: 'inspectors',
      label: 'Inspectors',
      value: metrics.inspectors,
      subtext: 'Configured',
      icon: ShieldCheck,
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]',
      borderHover: 'hover:border-[#D97706]'
    },
    {
      id: 'rules',
      label: 'Regulatory Rules',
      value: metrics.regulatoryRules,
      subtext: 'Managed',
      icon: Scale,
      iconBg: 'bg-[#F1F5F9]',
      iconColor: 'text-[#334155]',
      borderHover: 'hover:border-[#334155]'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`bg-white border border-[#D8DDE3] rounded-xl p-4 shadow-xs transition-all ${c.borderHover}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] tracking-tight">{c.label}</span>
              <div className={`p-2 rounded-lg ${c.iconBg} ${c.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#1E293B] tracking-tight">
              {c.value}
            </div>
            <div className="text-[11px] font-semibold text-[#94A3B8] mt-0.5">
              {c.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
