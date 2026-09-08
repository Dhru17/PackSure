import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { User, RegulatoryRule, AuditLog, ProductCategory, UserRole } from '../../types';

// Admin Components & Views
import { AdminSidebar, type AdminNavTab } from './components/AdminSidebar';
import { AdminTopbar } from './components/AdminTopbar';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminUserDetailsView } from './views/AdminUserDetailsView';
import { AdminRulesView } from './views/AdminRulesView';
import { AdminRuleDetailsView } from './views/AdminRuleDetailsView';
import { AdminCategoriesView } from './views/AdminCategoriesView';
import { AdminCategoryDetailsView } from './views/AdminCategoryDetailsView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { AdminProfileView } from './views/AdminProfileView';

// Modals
import { UserFormModal } from './views/modals/UserFormModal';
import { RuleFormModal } from './views/modals/RuleFormModal';
import { CategoryFormModal } from './views/modals/CategoryFormModal';
import { CategoryRuleMapModal } from './views/modals/CategoryRuleMapModal';
import { AuditDiffDrawer } from './views/modals/AuditDiffDrawer';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminNavTab | 'user_detail' | 'rule_detail' | 'category_detail'>('home');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Selected Detail States
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRule, setSelectedRule] = useState<RegulatoryRule | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [mappedCategoryRules, setMappedCategoryRules] = useState<any[]>([]);

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalTarget, setUserModalTarget] = useState<User | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalTarget, setRuleModalTarget] = useState<RegulatoryRule | null>(null);
  const [isNewRuleVersionMode, setIsNewRuleVersionMode] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTarget, setCategoryModalTarget] = useState<ProductCategory | null>(null);

  const [isCategoryRuleMapModalOpen, setIsCategoryRuleMapModalOpen] = useState(false);
  const [selectedAuditLogForDiff, setSelectedAuditLogForDiff] = useState<AuditLog | null>(null);

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // ----------------------------------------------------
  // DATA LOADERS
  // ----------------------------------------------------
  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadRules = async () => {
    try {
      const res = await api.getRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error('Error loading rules:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({ limit: 150 });
      setAuditLogs(res.audit_logs || []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  const refreshAll = () => {
    loadUsers();
    loadRules();
    loadCategories();
    loadAuditLogs();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // ----------------------------------------------------
  // USER HANDLERS
  // ----------------------------------------------------
  const handleOpenUserDetail = (u: User) => {
    setSelectedUser(u);
    setActiveTab('user_detail');
  };

  const handleSaveUser = async (formData: any) => {
    try {
      if (userModalTarget) {
        await api.updateUser(userModalTarget.id, formData);
        setActionNotice(`Officer profile "${formData.full_name}" updated successfully.`);
      } else {
        await api.createUser(formData);
        setActionNotice(`New officer "${formData.full_name}" provisioned successfully.`);
      }
      setIsUserModalOpen(false);
      setUserModalTarget(null);
      loadUsers();
      loadAuditLogs();
      if (selectedUser && userModalTarget && selectedUser.id === userModalTarget.id) {
        setSelectedUser({ ...selectedUser, ...formData });
      }
    } catch (err: any) {
      alert(`User operation failed: ${err.message}`);
    }
  };

  const handleChangeUserRole = async (newRole: UserRole) => {
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, {
        ...selectedUser,
        role: newRole
      });
      setActionNotice(`Officer "${selectedUser.full_name}" role updated to ${newRole}.`);
      setSelectedUser({ ...selectedUser, role: newRole });
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Role change failed: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      const res = await api.toggleUserStatus(targetUser.id);
      setActionNotice(res.message);
      loadUsers();
      loadAuditLogs();
      if (selectedUser && selectedUser.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, is_active: !selectedUser.is_active });
      }
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleResetUserPassword = async (targetUser: User) => {
    const newPass = prompt(`Enter new password for ${targetUser.full_name} (${targetUser.email}):`, 'Pass#2026');
    if (!newPass) return;
    try {
      await api.resetUserPassword(targetUser.id, newPass);
      setActionNotice(`Password for ${targetUser.email} reset successfully.`);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Password reset failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    try {
      const res = await api.deleteUser(targetUser.id);
      setActionNotice(res.message);
      loadUsers();
      loadAuditLogs();
      setActiveTab('users');
      setSelectedUser(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // RULE HANDLERS
  // ----------------------------------------------------
  const handleOpenRuleDetail = (r: RegulatoryRule) => {
    setSelectedRule(r);
    setActiveTab('rule_detail');
  };

  const handleSaveRule = async (formData: any) => {
    try {
      if (isNewRuleVersionMode || !ruleModalTarget) {
        await api.createRule(formData);
        setActionNotice(`Regulatory Rule [${formData.rule_code} (${formData.version})] published successfully.`);
      } else {
        await api.updateRule(ruleModalTarget.id, formData);
        setActionNotice(`Rule [${ruleModalTarget.rule_code}] updated successfully.`);
      }
      setIsRuleModalOpen(false);
      setRuleModalTarget(null);
      setIsNewRuleVersionMode(false);
      loadRules();
      loadAuditLogs();
      if (selectedRule) {
        setSelectedRule({ ...selectedRule, ...formData });
      }
    } catch (err: any) {
      alert(`Rule operation failed: ${err.message}`);
    }
  };

  const handleToggleRuleStatus = async (r: RegulatoryRule) => {
    try {
      const res = await api.toggleRuleStatus(r.id);
      setActionNotice(res.message);
      loadRules();
      loadAuditLogs();
      if (selectedRule && selectedRule.id === r.id) {
        setSelectedRule({ ...selectedRule, is_active: !selectedRule.is_active });
      }
    } catch (err: any) {
      alert(`Rule toggle failed: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // CATEGORY HANDLERS
  // ----------------------------------------------------
  const handleOpenCategoryDetail = async (cat: ProductCategory) => {
    setSelectedCategory(cat);
    try {
      const res = await api.getCategoryRules(cat.id);
      setMappedCategoryRules(res.mappings || []);
    } catch {
      setMappedCategoryRules([]);
    }
    setActiveTab('category_detail');
  };

  const handleOpenCategoryRuleMappings = async (cat: ProductCategory) => {
    setSelectedCategory(cat);
    try {
      const res = await api.getCategoryRules(cat.id);
      setMappedCategoryRules(res.mappings || []);
    } catch {
      setMappedCategoryRules([]);
    }
    setIsCategoryRuleMapModalOpen(true);
  };

  const handleSaveCategory = async (formData: any) => {
    try {
      if (categoryModalTarget) {
        await api.updateCategory(categoryModalTarget.id, formData);
        setActionNotice(`Category "${formData.name}" updated successfully.`);
      } else {
        await api.createCategory(formData);
        setActionNotice(`Category "${formData.name}" added successfully.`);
      }
      setIsCategoryModalOpen(false);
      setCategoryModalTarget(null);
      loadCategories();
      loadAuditLogs();
      if (selectedCategory) {
        setSelectedCategory({ ...selectedCategory, ...formData });
      }
    } catch (err: any) {
      alert(`Category operation failed: ${err.message}`);
    }
  };

  const handleToggleCategoryStatus = async (cat: ProductCategory) => {
    try {
      const res = await api.toggleCategoryStatus(cat.id);
      setActionNotice(res.message);
      loadCategories();
      loadAuditLogs();
      if (selectedCategory && selectedCategory.id === cat.id) {
        setSelectedCategory({ ...selectedCategory, is_active: !selectedCategory.is_active });
      }
    } catch (err: any) {
      alert(`Category toggle failed: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      const res = await api.deleteCategory(cat.id);
      setActionNotice(res.message);
      loadCategories();
      loadAuditLogs();
      setActiveTab('categories');
      setSelectedCategory(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMapRule = async (data: { rule_id: number; is_exempt?: boolean; exception_notes?: string }) => {
    if (!selectedCategory) return;
    try {
      await api.mapCategoryRule(selectedCategory.id, data);
      setActionNotice(`Rule mapped to category "${selectedCategory.name}".`);
      const res = await api.getCategoryRules(selectedCategory.id);
      setMappedCategoryRules(res.mappings || []);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnmapRule = async (ruleId: number) => {
    if (!selectedCategory) return;
    try {
      await api.unmapCategoryRule(selectedCategory.id, ruleId);
      const res = await api.getCategoryRules(selectedCategory.id);
      setMappedCategoryRules(res.mappings || []);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentNavTab: AdminNavTab = 
    (activeTab === 'home' || activeTab === 'users' || activeTab === 'rules' || activeTab === 'categories' || activeTab === 'audit' || activeTab === 'settings' || activeTab === 'profile')
      ? activeTab
      : 'home';

  return (
    <div className="bg-[#F4F6F8] rounded-2xl border border-[#D8DDE3] shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-8rem)]">
      {/* Left Navigation Sidebar */}
      <AdminSidebar
        activeTab={currentNavTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'home') refreshAll();
          if (tab === 'users') loadUsers();
          if (tab === 'rules') loadRules();
          if (tab === 'categories') loadCategories();
          if (tab === 'audit') loadAuditLogs();
        }}
        pendingRequestsCount={users.filter(u => !u.is_active).length}
      />

      {/* Main Workstation View Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Topbar Header */}
        <AdminTopbar
          activeTab={activeTab}
          onOpenProfile={() => setActiveTab('profile')}
          onNewUser={() => {
            setUserModalTarget(null);
            setIsUserModalOpen(true);
          }}
          onNewRule={() => {
            setRuleModalTarget(null);
            setIsNewRuleVersionMode(false);
            setIsRuleModalOpen(true);
          }}
          onNewCategory={() => {
            setCategoryModalTarget(null);
            setIsCategoryModalOpen(true);
          }}
          pendingAlertsCount={users.filter(u => !u.is_active).length}
        />

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="mx-6 mt-4 p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-center justify-between gap-4 text-xs shadow-xs">
            <span className="font-semibold text-[#1E40AF]">{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="px-2.5 py-1 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded text-[11px] font-bold border border-[#CBD5E1] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Routing */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {/* SCREEN 1: DASHBOARD (HOME) */}
          {activeTab === 'home' && (
            <AdminDashboard
              users={users}
              rules={rules}
              categories={categories}
              auditLogs={auditLogs}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'users') loadUsers();
                if (tab === 'rules') loadRules();
                if (tab === 'categories') loadCategories();
                if (tab === 'audit') loadAuditLogs();
              }}
              onNewUser={() => {
                setUserModalTarget(null);
                setIsUserModalOpen(true);
              }}
              onNewRule={() => {
                setRuleModalTarget(null);
                setIsNewRuleVersionMode(false);
                setIsRuleModalOpen(true);
              }}
              onNewCategory={() => {
                setCategoryModalTarget(null);
                setIsCategoryModalOpen(true);
              }}
            />
          )}

          {/* SCREEN 2: USERS VIEW */}
          {activeTab === 'users' && (
            <AdminUsersView
              users={users}
              onOpenUserDetail={handleOpenUserDetail}
              onNewUser={() => {
                setUserModalTarget(null);
                setIsUserModalOpen(true);
              }}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {/* SCREEN 3: USER DETAILS VIEW */}
          {activeTab === 'user_detail' && selectedUser && (
            <AdminUserDetailsView
              user={selectedUser}
              auditLogs={auditLogs}
              onBack={() => {
                setActiveTab('users');
                loadUsers();
              }}
              onEditUser={(u) => {
                setUserModalTarget(u);
                setIsUserModalOpen(true);
              }}
              onChangeRole={handleChangeUserRole}
              onToggleStatus={handleToggleUserStatus}
              onResetPassword={handleResetUserPassword}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {/* SCREEN 4: RULES VIEW */}
          {activeTab === 'rules' && (
            <AdminRulesView
              rules={rules}
              onOpenRuleDetail={handleOpenRuleDetail}
              onNewRule={() => {
                setRuleModalTarget(null);
                setIsNewRuleVersionMode(false);
                setIsRuleModalOpen(true);
              }}
              onToggleStatus={handleToggleRuleStatus}
            />
          )}

          {/* SCREEN 5: RULE DETAILS VIEW */}
          {activeTab === 'rule_detail' && selectedRule && (
            <AdminRuleDetailsView
              rule={selectedRule}
              allRuleVersions={rules}
              categories={categories}
              onBack={() => {
                setActiveTab('rules');
                loadRules();
              }}
              onEditRule={(r) => {
                setRuleModalTarget(r);
                setIsNewRuleVersionMode(false);
                setIsRuleModalOpen(true);
              }}
              onNewVersion={(r) => {
                setRuleModalTarget(r);
                setIsNewRuleVersionMode(true);
                setIsRuleModalOpen(true);
              }}
              onToggleStatus={handleToggleRuleStatus}
            />
          )}

          {/* SCREEN 6: CATEGORIES VIEW */}
          {activeTab === 'categories' && (
            <AdminCategoriesView
              categories={categories}
              onOpenCategoryDetail={handleOpenCategoryDetail}
              onNewCategory={() => {
                setCategoryModalTarget(null);
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setCategoryModalTarget(cat);
                setIsCategoryModalOpen(true);
              }}
              onToggleStatus={handleToggleCategoryStatus}
              onDeleteCategory={handleDeleteCategory}
              onOpenRuleMappings={handleOpenCategoryRuleMappings}
            />
          )}

          {/* SCREEN 7: CATEGORY DETAILS VIEW */}
          {activeTab === 'category_detail' && selectedCategory && (
            <AdminCategoryDetailsView
              category={selectedCategory}
              mappedRules={mappedCategoryRules}
              onBack={() => {
                setActiveTab('categories');
                loadCategories();
              }}
              onEditCategory={(cat) => {
                setCategoryModalTarget(cat);
                setIsCategoryModalOpen(true);
              }}
              onOpenRuleMapModal={() => setIsCategoryRuleMapModalOpen(true)}
              onUnmapRule={handleUnmapRule}
            />
          )}

          {/* SCREEN 8: AUDIT LOGS VIEW */}
          {activeTab === 'audit' && (
            <AdminAuditLogsView
              auditLogs={auditLogs}
              onOpenDiff={(log) => setSelectedAuditLogForDiff(log)}
              onRefresh={loadAuditLogs}
            />
          )}

          {/* SCREEN 9: SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <AdminSettingsView />
          )}

          {/* SCREEN 10: PROFILE VIEW */}
          {activeTab === 'profile' && (
            <AdminProfileView />
          )}
        </div>
      </div>

      {/* User Add/Edit Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserModalTarget(null);
        }}
        user={userModalTarget}
        onSave={handleSaveUser}
      />

      {/* Rule Add/Edit/New Version Modal */}
      <RuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => {
          setIsRuleModalOpen(false);
          setRuleModalTarget(null);
          setIsNewRuleVersionMode(false);
        }}
        rule={ruleModalTarget}
        isNewVersionMode={isNewRuleVersionMode}
        onSave={handleSaveRule}
      />

      {/* Category Add/Edit Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryModalTarget(null);
        }}
        category={categoryModalTarget}
        parentOptions={categories}
        onSave={handleSaveCategory}
      />

      {/* Category Rule Mapping Modal */}
      <CategoryRuleMapModal
        isOpen={isCategoryRuleMapModalOpen}
        onClose={() => setIsCategoryRuleMapModalOpen(false)}
        category={selectedCategory}
        mappedRules={mappedCategoryRules}
        allRules={rules}
        onMapRule={handleMapRule}
        onUnmapRule={handleUnmapRule}
      />

      {/* Audit Forensic State Diff Drawer */}
      <AuditDiffDrawer
        isOpen={!!selectedAuditLogForDiff}
        onClose={() => setSelectedAuditLogForDiff(null)}
        log={selectedAuditLogForDiff}
      />
    </div>
  );
};
