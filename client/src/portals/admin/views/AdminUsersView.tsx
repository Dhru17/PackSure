import React, { useState } from 'react';
import { 
  UserPlus, 
  Eye, 
  Power 
} from 'lucide-react';
import type { User } from '../../../types';
import { FilterBar, EmptyState } from '../../../components/ui';

interface AdminUsersViewProps {
  users: User[];
  onOpenUserDetail: (user: User) => void;
  onNewUser: () => void;
  onToggleStatus: (user: User) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  onOpenUserDetail,
  onNewUser,
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Filter users
  const filteredUsers = users.filter(u => {
    // Tab filter
    if (activeTab === 'ACTIVE' && !u.is_active) return false;
    if (activeTab === 'INACTIVE' && u.is_active) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchBadge = u.badge_number?.toLowerCase().includes(q);
      const matchDistrict = u.jurisdiction_district?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchBadge && !matchDistrict) return false;
    }

    // Role filter
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

    return true;
  });

  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">Authorized PackSure Users & RBAC</h2>
          <p className="text-xs text-[#64748B]">Manage officer accounts, roles, access permissions, and regional assignments</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-[#F8F9FA] p-1 rounded-xl border border-[#D8DDE3]">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveTab('INACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'INACTIVE'
                  ? 'bg-[#174A7E] text-white shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          <button
            onClick={onNewUser}
            className="px-4 py-2 bg-[#174A7E] hover:bg-[#0F3B66] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, officer ID or email..."
        filters={[
          {
            key: 'role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: 'ALL', label: 'All Roles' },
              { value: 'INSPECTOR', label: 'Inspector Officer' },
              { value: 'SENIOR_OFFICER', label: 'Senior Officer' },
              { value: 'ADMIN', label: 'Administrator' }
            ]
          }
        ]}
        onClearFilters={() => {
          setSearchQuery('');
          setRoleFilter('ALL');
        }}
      />

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No Officers Found"
          description="No user accounts match your search query or filter criteria."
          action={
            <button
              onClick={onNewUser}
              className="px-4 py-2 bg-[#174A7E] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Provision New User
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
          <table className="w-full text-left text-xs text-[#1E293B]">
            <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Officer ID</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Office / Jurisdiction</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {filteredUsers.map((u) => (
                <tr 
                  key={u.id} 
                  className="hover:bg-[#F8FAFC] transition cursor-pointer"
                  onClick={() => onOpenUserDetail(u)}
                >
                  <td className="p-3.5">
                    <div className="font-bold text-[#1E293B]">{u.full_name}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">{u.email}</div>
                  </td>
                  <td className="p-3.5 font-mono text-[#174A7E] font-bold">
                    {u.badge_number || 'N/A'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      u.role === 'ADMIN'
                        ? 'bg-[#EEF2F6] text-[#174A7E] border-[#CBD5E1]'
                        : u.role === 'SENIOR_OFFICER'
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                    }`}>
                      {u.role === 'ADMIN' ? 'Administrator' : u.role === 'SENIOR_OFFICER' ? 'Senior Officer' : 'Inspector'}
                    </span>
                  </td>
                  <td className="p-3.5 text-[#64748B]">
                    {u.jurisdiction_district || 'State Level'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.is_active
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(u)}
                        className={`p-1.5 rounded-lg border text-xs shadow-2xs transition cursor-pointer ${
                          u.is_active
                            ? 'bg-white hover:bg-[#FEE2E2] text-[#991B1B] border-[#CBD5E1]'
                            : 'bg-white hover:bg-[#DCFCE7] text-[#15803D] border-[#CBD5E1]'
                        }`}
                        title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenUserDetail(u)}
                        className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-lg border border-[#CBD5E1] font-bold text-xs shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
