import React from 'react';
import { Search, X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelect {
  key: string;
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  ariaLabel?: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterSelect[];
  onClearFilters?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  onClearFilters,
  className = '',
}) => {
  const hasActiveFilters = searchValue || filters.some((f) => f.value !== 'ALL' && f.value !== '');

  return (
    <div
      className={`bg-[#F8F9FA] p-3 rounded-xl border border-[#D8DDE3] flex flex-col md:flex-row items-stretch md:items-center gap-2.5 ${className}`}
    >
      {/* Primary Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E] placeholder-[#94A3B8]"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2 text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Select Filters */}
      {filters.map((f) => (
        <div key={f.key} className="shrink-0 min-w-[140px]">
          <select
            value={f.value}
            aria-label={f.ariaLabel || f.key}
            onChange={(e) => f.onChange(e.target.value)}
            className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E] cursor-pointer"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Clear Filters Action */}
      {onClearFilters && hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-2.5 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1] transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};
