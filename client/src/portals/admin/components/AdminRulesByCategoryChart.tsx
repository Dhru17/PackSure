import React, { useState } from 'react';
import { FolderTree } from 'lucide-react';
import type { RuleCategoryDistribution } from './AdminAnalyticsData';

interface AdminRulesByCategoryChartProps {
  data: RuleCategoryDistribution[];
  onCategoryClick?: (categoryName: string) => void;
}

export const AdminRulesByCategoryChart: React.FC<AdminRulesByCategoryChartProps> = ({
  data,
  onCategoryClick
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalCount = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#EFF6FF] text-[#174A7E] rounded-lg">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#1E293B]">Rules by Category</h3>
          </div>
          <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
            {totalCount} total mappings
          </span>
        </div>
        <p className="text-xs text-[#64748B] mb-5">
          Distribution of regulatory rules across configured product categories.
        </p>

        {/* Horizontal Bars */}
        <div className="space-y-3.5">
          {data.map((item) => {
            const percentage = Math.round((item.count / maxCount) * 100);
            const isHovered = hoveredCategory === item.category;

            return (
              <div
                key={item.category}
                onMouseEnter={() => setHoveredCategory(item.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => onCategoryClick && onCategoryClick(item.category)}
                className={`p-1.5 rounded-lg transition-colors ${
                  onCategoryClick ? 'cursor-pointer hover:bg-[#F8FAFC]' : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#334155] flex items-center gap-1.5">
                    <span>{item.category}</span>
                    {isHovered && (
                      <span className="text-[10px] font-bold text-[#174A7E] bg-[#EFF6FF] px-1.5 py-0.2 rounded">
                        {Math.round((item.count / totalCount) * 100)}%
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[#1E293B]">{item.count} rules</span>
                </div>

                {/* Bar */}
                <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color || '#174A7E'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F1F5F9] text-[11px] text-[#94A3B8] flex items-center justify-between">
        <span>Standardized Packaged Commodity Rules</span>
        <span>Demo analytics</span>
      </div>
    </div>
  );
};
