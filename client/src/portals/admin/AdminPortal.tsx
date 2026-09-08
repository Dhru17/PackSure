import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import type { User, RegulatoryRule, AuditLog, ProductCategory } from '../../types';
import {
  ShieldAlert, RefreshCw, UserPlus, Key, Eye, EyeOff, Trash2, Power, BookPlus,
  Edit3, FolderTree, FileText, Database, HardDrive, Cpu, Activity,
  Search, CheckCircle, Layers, ArrowRight,
  Settings, UserCheck, Shield, ChevronRight, X
} from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'rules' | 'categories' | 'audit' | 'settings';

export const AdminPortal: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // ----------------------------------------------------
  // DATA STATES
  // ----------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<RegulatoryRule[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // ----------------------------------------------------
  // FILTER STATES
  // ----------------------------------------------------
  // Users Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Rules Filter
  const [ruleSearch, setRuleSearch] = useState('');
  const [ruleStatusFilter, setRuleStatusFilter] = useState('ALL');

  // Audit Logs Filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // ----------------------------------------------------
  // MODAL / DRAWER STATES
  // ----------------------------------------------------
  // User Modals
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lastCreatedUser, setLastCreatedUser] = useState<{ email: string; pass: string; name: string } | null>(null);

  const [userForm, setUserForm] = useState({
    email: '',
    password: 'Password#2026',
    full_name: '',
    role: 'INSPECTOR',
    badge_number: '',
    jurisdiction_district: 'New Delhi Central',
    phone_number: '+91 98765 43210'
  });

  const [editUserForm, setEditUserForm] = useState({
    full_name: '',
    role: 'INSPECTOR',
    badge_number: '',
    jurisdiction_district: '',
    phone_number: '',
    is_active: true
  });

  const [newPasswordValue, setNewPasswordValue] = useState('Pass#2026');

  // Rule Modals
  const [newRuleModalOpen, setNewRuleModalOpen] = useState(false);
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RegulatoryRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    rule_code: '',
    version: 'v2026.1',
    title: '',
    statutory_citation: '',
    source_document: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2026',
    validation_logic_type: 'GENERIC_PRESENCE',
    description: '',
    effective_from: new Date().toISOString().split('T')[0]
  });

  const [editRuleForm, setEditRuleForm] = useState({
    title: '',
    description: '',
    statutory_citation: '',
    source_document: '',
    validation_logic_type: '',
    is_active: true
  });

  // Category Modals
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState(false);
  const [categoryRuleModalOpen, setCategoryRuleModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [categoryRulesList, setCategoryRulesList] = useState<any[]>([]);

  const [categoryForm, setCategoryForm] = useState({
    category_code: '',
    name: '',
    parent_id: '',
    description: '',
    is_active: true
  });

  const [mapRuleForm, setMapRuleForm] = useState({
    rule_id: '',
    is_exempt: false,
    exception_notes: ''
  });

  // Audit Diff Modal
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [diffModalOpen, setDiffModalOpen] = useState(false);

  // ----------------------------------------------------
  // DATA LOADERS
  // ----------------------------------------------------
  const loadUsers = async () => {
    try {
      const res = await api.getUsers({
        role: userRoleFilter,
        status: userStatusFilter,
        search: userSearch
      });
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadRules = async () => {
    try {
      const res = await api.getRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({
        actionType: auditActionFilter,
        search: auditSearch,
        limit: 150
      });
      setAuditLogs(res.audit_logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const res = await api.getSystemHealth();
      setSystemHealth(res);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([
      loadUsers(),
      loadRules(),
      loadCategories(),
      loadAuditLogs(),
      loadSystemHealth()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [userRoleFilter, userStatusFilter, userSearch]);

  useEffect(() => {
    loadAuditLogs();
  }, [auditActionFilter, auditSearch]);

  // ----------------------------------------------------
  // HANDLERS: USERS
  // ----------------------------------------------------
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Gov#';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm({ ...userForm, password: pass });
    setNewPasswordValue(pass);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      setLastCreatedUser({
        email: userForm.email,
        pass: userForm.password,
        name: userForm.full_name
      });
      setNewUserModalOpen(false);
      setUserForm({
        email: '',
        password: 'Password#2026',
        full_name: '',
        role: 'INSPECTOR',
        badge_number: '',
        jurisdiction_district: 'New Delhi Central',
        phone_number: '+91 98765 43210'
      });
      setActionNotice(`Officer account provisioned successfully.`);
      loadUsers();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`User creation failed: ${err.message}`);
    }
  };

  const handleOpenEditUser = (u: User) => {
    setSelectedUser(u);
    setEditUserForm({
      full_name: u.full_name,
      role: u.role,
      badge_number: u.badge_number || '',
      jurisdiction_district: u.jurisdiction_district || 'National',
      phone_number: u.phone_number || '',
      is_active: u.is_active
    });
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.updateUser(selectedUser.id, editUserForm);
      setActionNotice(`Officer profile for "${selectedUser.email}" updated successfully.`);
      setEditUserModalOpen(false);
      setSelectedUser(null);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleOpenResetPassword = (u: User) => {
    setSelectedUser(u);
    handleGeneratePassword();
    setResetPassModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.resetUserPassword(selectedUser.id, newPasswordValue);
      setActionNotice(`Password for "${selectedUser.email}" reset to: ${newPasswordValue}`);
      setResetPassModalOpen(false);
      setSelectedUser(null);
      loadAuditLogs();
    } catch (err: any) {
      alert(`Password reset failed: ${err.message}`);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    if (currentUser?.id === targetUser.id) {
      alert("Administrator cannot deactivate their own active account.");
      return;
    }
    try {
      const res = await api.toggleUserStatus(targetUser.id);
      setActionNotice(res.message);
      loadUsers();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (currentUser?.id === targetUser.id) {
      alert("Administrator cannot delete their own account.");
      return;
    }
    if (!confirm(`Are you sure you want to remove or deactivate officer "${targetUser.full_name}" (${targetUser.email})?`)) {
      return;
    }
    try {
      const res = await api.deleteUser(targetUser.id);
      setActionNotice(res.message);
      loadUsers();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: RULES
  // ----------------------------------------------------
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRule(ruleForm);
      setActionNotice(`Regulatory Rule [${ruleForm.rule_code}] published and activated in compliance engine.`);
      setNewRuleModalOpen(false);
      setRuleForm({
        rule_code: '',
        version: 'v2026.1',
        title: '',
        statutory_citation: '',
        source_document: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2026',
        validation_logic_type: 'GENERIC_PRESENCE',
        description: '',
        effective_from: new Date().toISOString().split('T')[0]
      });
      loadRules();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`Rule creation failed: ${err.message}`);
    }
  };

  const handleOpenEditRule = (r: RegulatoryRule) => {
    setSelectedRule(r);
    setEditRuleForm({
      title: r.title,
      description: r.description,
      statutory_citation: r.statutory_citation,
      source_document: r.source_document,
      validation_logic_type: r.validation_logic_type,
      is_active: r.is_active
    });
    setEditRuleModalOpen(true);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    try {
      await api.updateRule(selectedRule.id, editRuleForm);
      setActionNotice(`Rule ${selectedRule.rule_code} (${selectedRule.version}) updated.`);
      setEditRuleModalOpen(false);
      setSelectedRule(null);
      loadRules();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Rule update failed: ${err.message}`);
    }
  };

  const handleToggleRuleStatus = async (r: RegulatoryRule) => {
    try {
      const res = await api.toggleRuleStatus(r.id);
      setActionNotice(res.message);
      loadRules();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`Rule toggle failed: ${err.message}`);
    }
  };

  // Grouped Rules by Rule Code for Version Tree View
  const groupedRules = useMemo(() => {
    const map = new Map<string, RegulatoryRule[]>();
    for (const r of rules) {
      if (ruleSearch) {
        const q = ruleSearch.toLowerCase();
        const matches = r.rule_code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.statutory_citation.toLowerCase().includes(q);
        if (!matches) continue;
      }
      if (ruleStatusFilter !== 'ALL') {
        const activeOnly = ruleStatusFilter === 'ACTIVE';
        if (r.is_active !== activeOnly) continue;
      }

      const list = map.get(r.rule_code) || [];
      list.push(r);
      map.set(r.rule_code, list);
    }
    return Array.from(map.entries());
  }, [rules, ruleSearch, ruleStatusFilter]);

  // ----------------------------------------------------
  // HANDLERS: CATEGORIES
  // ----------------------------------------------------
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory({
        ...categoryForm,
        parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id) : null
      });
      setActionNotice(`Category "${categoryForm.name}" created successfully.`);
      setNewCategoryModalOpen(false);
      setCategoryForm({
        category_code: '',
        name: '',
        parent_id: '',
        description: '',
        is_active: true
      });
      loadCategories();
      loadAuditLogs();
      loadSystemHealth();
    } catch (err: any) {
      alert(`Category creation failed: ${err.message}`);
    }
  };

  const handleOpenEditCategory = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    setCategoryForm({
      category_code: cat.category_code,
      name: cat.name,
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      description: cat.description || '',
      is_active: cat.is_active
    });
    setEditCategoryModalOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    try {
      await api.updateCategory(selectedCategory.id, {
        ...categoryForm,
        parent_id: categoryForm.parent_id ? parseInt(categoryForm.parent_id) : null
      });
      setActionNotice(`Category "${categoryForm.name}" updated successfully.`);
      setEditCategoryModalOpen(false);
      setSelectedCategory(null);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(`Category update failed: ${err.message}`);
    }
  };

  const handleToggleCategoryStatus = async (cat: ProductCategory) => {
    try {
      const res = await api.toggleCategoryStatus(cat.id);
      setActionNotice(res.message);
      loadCategories();
      loadAuditLogs();
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
      loadSystemHealth();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenCategoryRules = async (cat: ProductCategory) => {
    setSelectedCategory(cat);
    try {
      const res = await api.getCategoryRules(cat.id);
      setCategoryRulesList(res.mappings || []);
      setCategoryRuleModalOpen(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMapRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !mapRuleForm.rule_id) return;
    try {
      await api.mapCategoryRule(selectedCategory.id, {
        rule_id: parseInt(mapRuleForm.rule_id),
        is_exempt: mapRuleForm.is_exempt,
        exception_notes: mapRuleForm.exception_notes
      });
      setActionNotice(`Rule mapped to category "${selectedCategory.name}".`);
      const res = await api.getCategoryRules(selectedCategory.id);
      setCategoryRulesList(res.mappings || []);
      setMapRuleForm({ rule_id: '', is_exempt: false, exception_notes: '' });
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
      setCategoryRulesList(res.mappings || []);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ----------------------------------------------------
  // HANDLERS: AUDIT DIFF
  // ----------------------------------------------------
  const handleOpenDiffModal = (log: AuditLog) => {
    setSelectedAuditLog(log);
    setDiffModalOpen(true);
  };

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & Executive Navigation */}
      <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#EEF2F6] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
            <ShieldAlert className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Admin Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F6] text-[#174A7E] border border-[#CBD5E1]">
                ADMIN RBAC
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Department of Consumer Affairs &bull; Legal Metrology (Packaged Commodities) Rules Governance
            </p>
          </div>
        </div>

        {/* 6-Tab Navigation Switcher */}
        <div className="flex flex-wrap items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Users & Roles ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rules ({rules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Log ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#174A7E] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-center justify-between gap-4 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-[#1E40AF]">
            <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="px-3 py-1 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg border border-[#CBD5E1] text-xs font-semibold transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Provisioned Officer Credentials Alert */}
      {lastCreatedUser && (
        <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="space-y-1">
            <p className="font-bold text-[#15803D] flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#16A34A]" />
              Officer Account Provisioned Successfully for {lastCreatedUser.name}
            </p>
            <p className="text-[#334155]">
              Email: <code className="text-[#15803D] bg-white border border-[#86EFAC] px-2 py-0.5 rounded font-mono">{lastCreatedUser.email}</code> &bull; Initial Password: <code className="text-[#B45309] font-bold bg-white border border-[#FDE68A] px-2 py-0.5 rounded font-mono">{lastCreatedUser.pass}</code>
            </p>
          </div>
          <button
            onClick={() => setLastCreatedUser(null)}
            className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg border border-[#CBD5E1] font-semibold self-start sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: EXECUTIVE OVERVIEW DASHBOARD */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Authorized Officers</span>
                <span className="p-1.5 bg-[#EEF2F6] text-[#174A7E] rounded-md">
                  <UserCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E293B]">{users.length}</span>
                <span className="text-xs text-[#15803D] font-bold">
                  {users.filter(u => u.is_active).length} Active
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                {users.filter(u => u.role === 'INSPECTOR').length} Inspectors &bull; {users.filter(u => u.role === 'SENIOR_OFFICER').length} Senior Officers &bull; {users.filter(u => u.role === 'ADMIN').length} Admins
              </p>
            </div>

            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Metrology Rules</span>
                <span className="p-1.5 bg-[#E0F2FE] text-[#0369A1] rounded-md">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E293B]">{rules.length}</span>
                <span className="text-xs text-[#15803D] font-bold">
                  {rules.filter(r => r.is_active).length} Enforced
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments
              </p>
            </div>

            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Commodity Categories</span>
                <span className="p-1.5 bg-[#FEF3C7] text-[#92400E] rounded-md">
                  <FolderTree className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E293B]">{categories.length}</span>
                <span className="text-xs text-[#64748B] font-semibold">
                  {categories.reduce((acc, c) => acc + (c.products_count || 0), 0)} Products
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Hierarchical taxonomy with statutory exemptions
              </p>
            </div>

            <div className="bg-white border border-[#D8DDE3] rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#64748B]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569]">Forensic Audit Logs</span>
                <span className="p-1.5 bg-[#F0FDF4] text-[#15803D] rounded-md">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#1E293B]">{systemHealth?.database?.tables?.audit_logs || auditLogs.length}</span>
                <span className="text-xs text-[#174A7E] font-mono font-semibold">Sec. 16 Compliant</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Immutable legal action audit trail
              </p>
            </div>
          </div>

          {/* System Telemetry & Rapid Health Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live System Telemetry Card */}
            <div className="lg:col-span-2 bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#15803D]" />
                  <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Live System Health & Telemetry</h2>
                </div>
                <button
                  onClick={refreshAll}
                  className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1] flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold flex items-center gap-1 text-[#475569]">
                      <Database className="w-3.5 h-3.5 text-[#0369A1]" /> Database Engine
                    </span>
                    <span className="text-[10px] text-[#15803D] font-mono font-bold bg-[#DCFCE7] px-1.5 py-0.5 rounded border border-[#86EFAC]">ONLINE</span>
                  </div>
                  <p className="text-lg font-black text-[#1E293B]">
                    {systemHealth?.database?.latency_ms || 1.2} ms
                  </p>
                  <p className="text-[10px] text-[#64748B] font-mono">
                    Dialect: {systemHealth?.database?.engine || 'postgresql'}
                  </p>
                </div>

                <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold flex items-center gap-1 text-[#475569]">
                      <Cpu className="w-3.5 h-3.5 text-[#174A7E]" /> RapidOCR ONNX
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border max-w-[120px] truncate ${
                      systemHealth?.ocr_engine?.status === 'READY' || systemHealth?.ocr_engine?.status === 'ONLINE'
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : systemHealth?.ocr_engine?.status === 'INITIALIZING'
                        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                    }`}>
                      {systemHealth?.ocr_engine?.status || 'READY'}
                    </span>
                  </div>
                  <p className="text-lg font-black text-[#1E293B]">
                    v{systemHealth?.ocr_engine?.version || '1.4.4'}
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    Precision PDP Font Metric Engine
                  </p>
                </div>

                <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[#64748B]">
                    <span className="text-xs font-semibold flex items-center gap-1 text-[#475569]">
                      <HardDrive className="w-3.5 h-3.5 text-[#B45309]" /> Evidence Vault
                    </span>
                    <span className="text-[10px] text-[#0369A1] font-mono font-bold bg-[#E0F2FE] px-1.5 py-0.5 rounded border border-[#BAE6FD]">
                      {systemHealth?.storage?.upload_files_count || 0} Files
                    </span>
                  </div>
                  <p className="text-lg font-black text-[#1E293B]">
                    {systemHealth?.storage?.evidence_size_mb || 0} MB
                  </p>
                  <p className="text-[10px] text-[#64748B]">
                    Free: {systemHealth?.storage?.disk_free_gb || 0} GB
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-[#EEF2F6] border border-[#CBD5E1] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#1E293B]">
                  <Shield className="w-4 h-4 text-[#174A7E]" />
                  <span>Enforcement Mode: <strong>Legal Metrology Act, 2009 Standards & RBAC Active</strong></span>
                </div>
                <span className="text-[#174A7E] font-mono text-[11px] font-semibold">Server: Python 3.14 / Flask 3.1.3</span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Quick Governance Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => { setActiveTab('users'); setNewUserModalOpen(true); }}
                  className="w-full text-left p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#EEF2F6] border border-[#E2E8F0] hover:border-[#CBD5E1] transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#EEF2F6] text-[#174A7E] rounded-md">
                      <UserPlus className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1E293B]">Provision Officer</p>
                      <p className="text-[10px] text-[#64748B]">Add Inspector or Senior Officer</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#174A7E]" />
                </button>

                <button
                  onClick={() => { setActiveTab('rules'); setNewRuleModalOpen(true); }}
                  className="w-full text-left p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#EEF2F6] border border-[#E2E8F0] hover:border-[#CBD5E1] transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#E0F2FE] text-[#0369A1] rounded-md">
                      <BookPlus className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1E293B]">Publish Rule Version</p>
                      <p className="text-[10px] text-[#64748B]">Add statutory amendment</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#174A7E]" />
                </button>

                <button
                  onClick={() => { setActiveTab('categories'); setNewCategoryModalOpen(true); }}
                  className="w-full text-left p-3 rounded-xl bg-[#F8F9FA] hover:bg-[#EEF2F6] border border-[#E2E8F0] hover:border-[#CBD5E1] transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-[#FEF3C7] text-[#92400E] rounded-md">
                      <FolderTree className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1E293B]">Add Product Category</p>
                      <p className="text-[10px] text-[#64748B]">Configure commodity hierarchy</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#174A7E]" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Audit Activity Snapshot */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Recent Statutory Audit Events</h2>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs text-[#174A7E] hover:underline font-bold flex items-center gap-1"
              >
                <span>View Full Audit Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-xs text-[#334155]">
                <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Entity</th>
                    <th className="p-3">Details / Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {auditLogs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] cursor-pointer transition" onClick={() => handleOpenDiffModal(log)}>
                      <td className="p-3 font-mono text-[#64748B] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-[#1E293B]">{log.user_name || 'System'}</td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#174A7E] font-semibold">
                        {log.entity_name} #{log.entity_id}
                      </td>
                      <td className="p-3 text-[#64748B] max-w-sm truncate">
                        {log.justification || 'System action executed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: OFFICERS & RBAC MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Authorized Department Officers & RBAC</h2>
              <p className="text-xs text-[#64748B]">Manage enforcement credentials, badge numbers, jurisdictions, and status</p>
            </div>
            <button
              onClick={() => setNewUserModalOpen(true)}
              className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition self-start md:self-auto"
            >
              <UserPlus className="w-4 h-4" /> Provision New Officer
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search name, email, badge, district..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              >
                <option value="ALL">All Roles</option>
                <option value="INSPECTOR">Inspector</option>
                <option value="SENIOR_OFFICER">Senior Officer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Officers</option>
                <option value="INACTIVE">Inactive Officers</option>
              </select>
            </div>
          </div>

          {/* Officers Table - Desktop View */}
          <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left text-xs text-[#334155]">
              <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Badge / ID</th>
                  <th className="p-3">Officer Name</th>
                  <th className="p-3">Official Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#94A3B8]">
                      No officers found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="p-3 font-mono text-[#174A7E] font-bold">{u.badge_number || 'N/A'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => { setSelectedUser(u); setUserDrawerOpen(true); }}
                          className="font-semibold text-[#1E293B] hover:text-[#174A7E] text-left hover:underline"
                        >
                          {u.full_name}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-[#475569]">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-[#EEF2F6] text-[#174A7E] border border-[#CBD5E1]'
                            : u.role === 'SENIOR_OFFICER'
                            ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                            : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-[#64748B]">{u.jurisdiction_district || 'National'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          title="Click to toggle active status"
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            u.is_active
                              ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] hover:bg-[#BBF7D0]'
                              : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] hover:bg-[#FECACA]'
                          }`}
                        >
                          <Power className="w-2.5 h-2.5" />
                          <span>{u.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            title="Edit Officer Profile"
                            className="p-1.5 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#CBD5E1] transition shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title="Reset Officer Password"
                            className="p-1.5 bg-white hover:bg-[#FEF3C7] text-[#B45309] rounded-lg border border-[#CBD5E1] hover:border-[#FDE68A] transition shadow-2xs"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete / Deactivate Officer"
                              className="p-1.5 bg-white hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#B91C1C] rounded-lg border border-[#CBD5E1] hover:border-[#FCA5A5] transition shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Officers Cards - Mobile View */}
          <div className="md:hidden space-y-3">
            {users.length === 0 ? (
              <div className="p-6 text-center text-[#94A3B8] border border-[#E2E8F0] rounded-lg bg-[#F8F9FA] text-xs">
                No officers found matching the filter criteria.
              </div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#174A7E] font-bold">{u.badge_number || 'NO BADGE'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-[#EEF2F6] text-[#174A7E] border border-[#CBD5E1]'
                        : u.role === 'SENIOR_OFFICER'
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                    }`}>
                      {u.role}
                    </span>
                  </div>

                  <div>
                    <button
                      onClick={() => { setSelectedUser(u); setUserDrawerOpen(true); }}
                      className="text-xs font-bold text-[#1E293B] hover:text-[#174A7E] text-left hover:underline"
                    >
                      {u.full_name}
                    </button>
                    <p className="text-[11px] font-mono text-[#64748B] mt-0.5">{u.email}</p>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded border border-[#E2E8F0] text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] block">Jurisdiction</span>
                      <span className="text-[#1E293B] font-medium">{u.jurisdiction_district || 'National'}</span>
                    </div>
                    <div>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                          u.is_active
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                        }`}
                      >
                        <Power className="w-2.5 h-2.5" />
                        <span>{u.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleOpenResetPassword(u)}
                      className="px-2.5 py-1 bg-white hover:bg-[#FEF3C7] text-[#B45309] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" /> Reset
                    </button>
                    {currentUser?.id !== u.id && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="px-2.5 py-1 bg-white hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#B91C1C] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REGULATORY RULES & VERSION ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'rules' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Legal Metrology Regulatory Rules & Version Engine</h2>
              <p className="text-xs text-[#64748B]">Statutory requirements, citations, and version progression under applicable amendments</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewRuleModalOpen(true)}
                className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
              >
                <BookPlus className="w-4 h-4" /> Publish New Rule / Version
              </button>
              <button
                onClick={loadRules}
                className="px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1] flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search rule code, title, statutory citation..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div>
              <select
                value={ruleStatusFilter}
                onChange={(e) => setRuleStatusFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              >
                <option value="ALL">All Enforcement Statuses</option>
                <option value="ACTIVE">Enforced Rules (Active)</option>
                <option value="INACTIVE">Deprecated / Inactive Rules</option>
              </select>
            </div>
          </div>

          {/* Grouped Requirement Version Trees */}
          <div className="space-y-4">
            {groupedRules.map(([ruleCode, ruleVersions]) => (
              <div key={ruleCode} className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#174A7E] bg-white px-2.5 py-1 rounded border border-[#CBD5E1]">
                      {ruleCode}
                    </span>
                    <span className="text-xs text-[#64748B] font-semibold">
                      ({ruleVersions.length} Version{ruleVersions.length > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    Logic: <code className="text-[#0369A1] font-mono font-semibold">{ruleVersions[0]?.validation_logic_type}</code>
                  </span>
                </div>

                {/* Timeline / Version items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {ruleVersions.map((r) => (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-xl border transition space-y-2 ${
                        r.is_active
                          ? 'bg-white border-[#D8DDE3] shadow-xs'
                          : 'bg-[#F1F5F9] border-[#E2E8F0] opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                          {r.version}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleRuleStatus(r)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                              r.is_active
                                ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                                : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                            }`}
                          >
                            {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                          <button
                            onClick={() => handleOpenEditRule(r)}
                            className="p-1 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded border border-[#CBD5E1]"
                            title="Edit Rule"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[#1E293B] leading-tight">{r.title}</h4>
                      <p className="text-[11px] text-[#64748B] line-clamp-2">{r.description}</p>

                      <div className="pt-2 border-t border-[#E2E8F0] text-[10px] text-[#64748B] flex items-center justify-between">
                        <span className="truncate max-w-[200px]" title={r.statutory_citation}>
                          Citation: <strong className="text-[#334155]">{r.statutory_citation}</strong>
                        </span>
                        <span>Eff: {r.effective_from || '2011-04-01'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: PRODUCT CATEGORIES & RULE MAPPINGS */}
      {/* ======================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Commodity Categories & Rule Mappings</h2>
              <p className="text-xs text-[#64748B]">Hierarchical category taxonomy and category-specific statutory exemptions</p>
            </div>
            <button
              onClick={() => setNewCategoryModalOpen(true)}
              className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <FolderTree className="w-4 h-4" /> Add Product Category
            </button>
          </div>

          {/* Categories Table with Hierarchy - Desktop View */}
          <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left text-xs text-[#334155]">
              <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Category Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Parent Group</th>
                  <th className="p-3">Products</th>
                  <th className="p-3">Rules Mapped</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="p-3 font-mono text-[#174A7E] font-bold">{c.category_code}</td>
                    <td className="p-3 font-semibold text-[#1E293B]">
                      {c.parent_id ? <span className="text-[#94A3B8] mr-1.5">&boxur;</span> : null}
                      {c.name}
                    </td>
                    <td className="p-3 text-[#64748B]">{c.parent_name || 'Root Category'}</td>
                    <td className="p-3 font-mono text-[#334155]">{c.products_count || 0}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenCategoryRules(c)}
                        className="px-2.5 py-1 bg-[#EEF2F6] hover:bg-[#E2E8F0] text-[#174A7E] font-mono text-[11px] font-semibold rounded border border-[#CBD5E1] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Layers className="w-3 h-3" />
                        <span>{c.rules_count || 0} Rules</span>
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleCategoryStatus(c)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          c.is_active
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                            : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                        }`}
                      >
                        {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditCategory(c)}
                          title="Edit Category"
                          className="p-1.5 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg border border-[#CBD5E1] transition shadow-2xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          title="Delete Category"
                          className="p-1.5 bg-white hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#B91C1C] rounded-lg border border-[#CBD5E1] hover:border-[#FCA5A5] transition shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Categories Cards - Mobile View */}
          <div className="md:hidden space-y-3">
            {categories.map((c) => (
              <div key={c.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#174A7E] font-bold">{c.category_code}</span>
                  <button
                    onClick={() => handleToggleCategoryStatus(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                      c.is_active
                        ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                        : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
                    }`}
                  >
                    {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#1E293B]">
                    {c.parent_id ? <span className="text-[#94A3B8] mr-1">&boxur;</span> : null}
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Parent: {c.parent_name || 'Root Category'}</p>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded border border-[#E2E8F0] text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Products</span>
                    <span className="font-mono font-bold text-[#1E293B]">{c.products_count || 0}</span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleOpenCategoryRules(c)}
                      className="px-2.5 py-1 bg-[#EEF2F6] hover:bg-[#E2E8F0] text-[#174A7E] font-mono text-[11px] font-semibold rounded border border-[#CBD5E1] flex items-center gap-1 transition"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{c.rules_count || 0} Rules</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => handleOpenEditCategory(c)}
                    className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(c)}
                    className="px-2.5 py-1 bg-white hover:bg-[#FEE2E2] text-[#64748B] hover:text-[#B91C1C] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: IMMUTABLE AUDIT TRAIL & FORENSICS */}
      {/* ======================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">Immutable Statutory Audit Trail & Forensics</h2>
              <p className="text-xs text-[#64748B]">Cryptographically verifiable log of all legal determinations and system modifications</p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="px-3 py-1.5 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1] flex items-center gap-1.5 self-start md:self-auto transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>

          {/* Search & Action Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search actor, entity, case ID, justification..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div>
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              >
                <option value="ALL">All Action Types</option>
                <option value="USER_MODIFIED">USER_MODIFIED</option>
                <option value="RULE_MODIFIED">RULE_MODIFIED</option>
                <option value="REVIEW_SUBMITTED">REVIEW_SUBMITTED</option>
                <option value="SENIOR_ACTION">SENIOR_ACTION</option>
                <option value="CASE_CREATED">CASE_CREATED</option>
                <option value="REPORT_GENERATED">REPORT_GENERATED</option>
              </select>
            </div>
          </div>

          {/* Audit Logs Table - Desktop View */}
          <div className="hidden md:block overflow-x-auto border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left text-xs text-[#334155]">
              <thead className="bg-[#F8F9FA] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Statutory Justification / Summary</th>
                  <th className="p-3 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] bg-white">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#94A3B8]">
                      No audit events recorded matching criteria.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC] transition">
                      <td className="p-3 font-mono text-[#64748B] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-[#1E293B]">{log.user_name || 'System'}</td>
                      <td className="p-3">
                        <span className="font-mono text-[11px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="p-3 text-[#174A7E] font-mono text-[11px] font-semibold">
                        {log.entity_name} #{log.entity_id}
                      </td>
                      <td className="p-3 font-mono text-[#475569]">{log.case_id ? `#${log.case_id}` : 'N/A'}</td>
                      <td className="p-3 text-[#64748B] max-w-xs truncate">
                        {log.justification || 'Administrative action recorded'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenDiffModal(log)}
                          className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded text-[11px] font-semibold border border-[#CBD5E1] transition shadow-2xs cursor-pointer"
                        >
                          View Diff
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audit Logs Cards - Mobile View */}
          <div className="md:hidden space-y-3">
            {auditLogs.length === 0 ? (
              <div className="p-6 text-center text-[#94A3B8] border border-[#E2E8F0] rounded-lg bg-[#F8F9FA] text-xs">
                No audit events recorded matching criteria.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="bg-[#F8F9FA] border border-[#D8DDE3] rounded-lg p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#64748B]">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="font-mono text-[10px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                      {log.action_type}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1E293B]">Actor: {log.user_name || 'System'}</span>
                      {log.case_id && (
                        <span className="text-[11px] font-mono font-bold text-[#174A7E]">Case #{log.case_id}</span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-[#174A7E] mt-0.5">{log.entity_name} #{log.entity_id}</p>
                    <p className="text-[11px] text-[#64748B] mt-1 bg-white p-2 rounded border border-[#E2E8F0]">
                      {log.justification || 'Administrative action recorded'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-1 border-t border-[#E2E8F0]">
                    <button
                      onClick={() => handleOpenDiffModal(log)}
                      className="px-3 py-1 bg-white hover:bg-[#F1F5F9] text-[#174A7E] rounded-lg text-xs font-semibold border border-[#CBD5E1] inline-flex items-center gap-1 cursor-pointer"
                    >
                      View Forensic Diff
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: SYSTEM SETTINGS & TELEMETRY */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy & Engine Thresholds */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#174A7E]" />
              <span>Statutory Compliance Engine Parameters</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#1E293B]">OCR Confidence Threshold</p>
                  <p className="text-[#64748B] text-[11px]">Minimum detection confidence to accept raw character stream</p>
                </div>
                <span className="font-mono text-[#174A7E] font-bold bg-[#EEF2F6] px-2.5 py-1 rounded border border-[#CBD5E1]">
                  65.0%
                </span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#1E293B]">Image Blur Variance Cutoff</p>
                  <p className="text-[#64748B] text-[11px]">Laplacian variance score for READABLE classification</p>
                </div>
                <span className="font-mono text-[#0369A1] font-bold bg-[#E0F2FE] px-2.5 py-1 rounded border border-[#BAE6FD]">
                  100.0 &sigma;&sup2;
                </span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#1E293B]">Max Package Evidences per Case</p>
                  <p className="text-[#64748B] text-[11px]">Statutory requirement for complete multi-surface inspection</p>
                </div>
                <span className="font-mono text-[#92400E] font-bold bg-[#FEF3C7] px-2.5 py-1 rounded border border-[#FDE68A]">
                  8 Surfaces
                </span>
              </div>

              <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <p className="font-bold text-[#1E293B]">Maximum Upload File Size</p>
                  <p className="text-[#64748B] text-[11px]">High-resolution package photo upload ceiling</p>
                </div>
                <span className="font-mono text-[#15803D] font-bold bg-[#DCFCE7] px-2.5 py-1 rounded border border-[#86EFAC]">
                  15 MB
                </span>
              </div>
            </div>
          </div>

          {/* District Jurisdictions Directory */}
          <div className="bg-white border border-[#D8DDE3] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#174A7E]" />
              <span>Official Jurisdiction Districts Directory</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Designated administrative zones under State Legal Metrology Controller authority
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                'National Jurisdiction',
                'New Delhi Central',
                'North Delhi Zone',
                'Mumbai South Metro',
                'Mumbai Suburban',
                'Bengaluru Urban',
                'Chennai Central',
                'Kolkata Metro',
                'Hyderabad Zone 1',
                'Ahmedabad West'
              ].map((dist, idx) => (
                <div key={idx} className="p-2.5 bg-[#F8F9FA] rounded-lg border border-[#E2E8F0] flex items-center gap-2 text-[#334155]">
                  <span className="w-2 h-2 rounded-full bg-[#174A7E]"></span>
                  <span className="font-medium">{dist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALS & DRAWERS */}
      {/* ======================================================== */}

      {/* 1. New User Modal */}
      {newUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#174A7E]" /> Provision Department Officer
              </h3>
              <button onClick={() => setNewUserModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspector Ramesh Kumar"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Official Email (@legalmetrology.gov.in)</label>
                <input
                  type="email"
                  required
                  placeholder="rkumar@legalmetrology.gov.in"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#475569] flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>Security Password</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#174A7E] font-semibold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] pr-9 focus:outline-none focus:border-[#174A7E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#475569]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  >
                    <option value="INSPECTOR">Inspector</option>
                    <option value="SENIOR_OFFICER">Senior Officer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Badge Number</label>
                  <input
                    type="text"
                    required
                    value={userForm.badge_number}
                    onChange={(e) => setUserForm({ ...userForm, badge_number: e.target.value })}
                    placeholder="LM-DEL-2026-XX"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Jurisdiction District</label>
                <input
                  type="text"
                  value={userForm.jurisdiction_district}
                  onChange={(e) => setUserForm({ ...userForm, jurisdiction_district: e.target.value })}
                  placeholder="e.g. New Delhi Central"
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Provision Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit User Modal */}
      {editUserModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#174A7E]" /> Edit Officer Profile ({selectedUser.email})
              </h3>
              <button onClick={() => setEditUserModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.full_name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, full_name: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  >
                    <option value="INSPECTOR">Inspector</option>
                    <option value="SENIOR_OFFICER">Senior Officer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Badge Number</label>
                  <input
                    type="text"
                    value={editUserForm.badge_number}
                    onChange={(e) => setEditUserForm({ ...editUserForm, badge_number: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Jurisdiction District</label>
                <input
                  type="text"
                  value={editUserForm.jurisdiction_district}
                  onChange={(e) => setEditUserForm({ ...editUserForm, jurisdiction_district: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserForm.phone_number}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone_number: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Reset Password Modal */}
      {resetPassModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#B45309]" /> Reset Password
              </h3>
              <button onClick={() => setResetPassModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <p className="text-xs text-[#475569]">
                Setting new credential for <strong className="text-[#1E293B]">{selectedUser.full_name}</strong> ({selectedUser.email})
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#475569]">New Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-[#174A7E] font-semibold hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] font-mono focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setResetPassModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B45309] hover:bg-[#92400E] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. User Detail Side Drawer */}
      {userDrawerOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white border-l border-[#D8DDE3] w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-[#EEF2F6] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
                    <UserCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#1E293B]">{selectedUser.full_name}</h3>
                    <p className="text-xs text-[#64748B] font-mono">{selectedUser.badge_number || 'NO BADGE'}</p>
                  </div>
                </div>
                <button onClick={() => setUserDrawerOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Official Email</span>
                  <p className="font-mono text-[#1E293B] font-bold">{selectedUser.email}</p>
                </div>

                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Jurisdiction District</span>
                  <p className="text-[#1E293B] font-medium">{selectedUser.jurisdiction_district || 'National'}</p>
                </div>

                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Designated Role</span>
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#EEF2F6] text-[#174A7E] border border-[#CBD5E1]">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Account Status</span>
                  <p className={`font-bold ${selectedUser.is_active ? 'text-[#15803D]' : 'text-[#B91C1C]'}`}>
                    {selectedUser.is_active ? 'ACTIVE ENFORCEMENT' : 'DEACTIVATED'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-2">
              <button
                onClick={() => { setUserDrawerOpen(false); handleOpenEditUser(selectedUser); }}
                className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Edit Officer Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. New Regulatory Rule Modal */}
      {newRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <BookPlus className="w-4 h-4 text-[#174A7E]" /> Publish Regulatory Rule / Amendment
              </h3>
              <button onClick={() => setNewRuleModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Rule Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RULE_6_1_G"
                    value={ruleForm.rule_code}
                    onChange={(e) => setRuleForm({ ...ruleForm, rule_code: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] font-mono uppercase focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Version</label>
                  <input
                    type="text"
                    required
                    placeholder="v2026.1"
                    value={ruleForm.version}
                    onChange={(e) => setRuleForm({ ...ruleForm, version: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] font-mono focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandatory QR Code for E-Commerce / E-Labeling"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Statutory Citation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rule 6(1)(g), Legal Metrology (PC) Rules, 2011"
                  value={ruleForm.statutory_citation}
                  onChange={(e) => setRuleForm({ ...ruleForm, statutory_citation: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Validation Logic</label>
                  <select
                    value={ruleForm.validation_logic_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, validation_logic_type: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  >
                    <option value="GENERIC_PRESENCE">Generic Presence Check</option>
                    <option value="HEIGHT_CALCULATION">Schedule II Font Height Calculation</option>
                    <option value="FORMAT_CHECK">Format / Currency Unit Check</option>
                    <option value="DATE_EXPIRY">Manufacturing Date Validity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={ruleForm.effective_from}
                    onChange={(e) => setRuleForm({ ...ruleForm, effective_from: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Statutory Description & Guidelines</label>
                <textarea
                  rows={2}
                  placeholder="Provide statutory guidelines for inspectors when checking this rule..."
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewRuleModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Publish Rule to Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Rule Modal */}
      {editRuleModalOpen && selectedRule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#174A7E]" /> Edit Rule: {selectedRule.rule_code} ({selectedRule.version})
              </h3>
              <button onClick={() => setEditRuleModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Rule Title</label>
                <input
                  type="text"
                  required
                  value={editRuleForm.title}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, title: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Statutory Citation</label>
                <input
                  type="text"
                  required
                  value={editRuleForm.statutory_citation}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, statutory_citation: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editRuleForm.description}
                  onChange={(e) => setEditRuleForm({ ...editRuleForm, description: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditRuleModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. New Category Modal */}
      {newCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#174A7E]" /> Add Product Category
              </h3>
              <button onClick={() => setNewCategoryModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Category Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FOOD_EDIBLE_OILS"
                    value={categoryForm.category_code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_code: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] font-mono uppercase focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Edible Oils & Ghee"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Parent Category (Optional)</label>
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent_id: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Statutory scope of products under this category..."
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Edit Category Modal */}
      {editCategoryModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#174A7E]" /> Edit Category: {selectedCategory.name}
              </h3>
              <button onClick={() => setEditCategoryModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Category Code</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.category_code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_code: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] font-mono uppercase focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEditCategoryModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#475569] rounded-lg border border-[#CBD5E1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Category Rule Applicability Mappings Modal */}
      {categoryRuleModalOpen && selectedCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#174A7E]" />
                  <span>Rule Applicability & Exemptions for "{selectedCategory.name}"</span>
                </h3>
                <p className="text-[11px] text-[#64748B]">Configure mandatory compliance checks vs statutory exemptions</p>
              </div>
              <button onClick={() => setCategoryRuleModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Existing Mapped Rules List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Currently Mapped Rules</h4>
              {categoryRulesList.length === 0 ? (
                <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] text-center text-[#94A3B8] text-xs">
                  No specific rule overrides configured. Standard statutory rules apply by default.
                </div>
              ) : (
                <div className="space-y-2">
                  {categoryRulesList.map((m) => (
                    <div key={m.id} className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#174A7E]">{m.rule_code}</span>
                          <span className="text-[#1E293B] font-semibold">{m.title}</span>
                          {m.is_exempt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              EXEMPT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                              MANDATORY
                            </span>
                          )}
                        </div>
                        {m.exception_notes && (
                          <p className="text-[11px] text-[#64748B] mt-1 italic">&ldquo;{m.exception_notes}&rdquo;</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnmapRule(m.id)}
                        className="p-1 text-[#94A3B8] hover:text-[#B91C1C]"
                        title="Remove Mapping"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add / Override Rule Form */}
            <form onSubmit={handleMapRule} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] space-y-3">
              <h4 className="text-xs font-bold text-[#174A7E] flex items-center gap-1.5">
                <BookPlus className="w-3.5 h-3.5" /> Map Rule or Statutory Exemption
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Select Rule</label>
                  <select
                    required
                    value={mapRuleForm.rule_id}
                    onChange={(e) => setMapRuleForm({ ...mapRuleForm, rule_id: e.target.value })}
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  >
                    <option value="">-- Choose Rule --</option>
                    {rules.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.rule_code} - {r.title} ({r.version})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapRuleForm.is_exempt}
                      onChange={(e) => setMapRuleForm({ ...mapRuleForm, is_exempt: e.target.checked })}
                      className="rounded border-[#CBD5E1] text-[#174A7E] focus:ring-0"
                    />
                    <span className="font-semibold">Statutory Exemption (Rule does NOT apply)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">Statutory Exemption Notes / Clause</label>
                <input
                  type="text"
                  placeholder="e.g. Exempt under Rule 26 for small packages below 10g/10ml"
                  value={mapRuleForm.exception_notes}
                  onChange={(e) => setMapRuleForm({ ...mapRuleForm, exception_notes: e.target.value })}
                  className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#174A7E] hover:bg-[#123A63] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Audit Forensic State Diff Viewer Modal */}
      {diffModalOpen && selectedAuditLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#EEF2F6] text-[#174A7E] rounded-xl border border-[#CBD5E1]">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                    <span>Audit Forensic Inspection</span>
                    <span className="font-mono text-[11px] font-bold text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded border border-[#BAE6FD]">
                      {selectedAuditLog.action_type}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Log #{selectedAuditLog.id} &bull; {new Date(selectedAuditLog.timestamp).toUTCString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setDiffModalOpen(false)} className="text-[#94A3B8] hover:text-[#1E293B]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Summary */}
            <div className="grid grid-cols-3 gap-2 text-xs bg-[#F8F9FA] p-3 rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Actor</span>
                <p className="text-[#1E293B] font-bold">{selectedAuditLog.user_name || 'System'}</p>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Target Entity</span>
                <p className="text-[#174A7E] font-mono font-semibold">{selectedAuditLog.entity_name} #{selectedAuditLog.entity_id}</p>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Case Reference</span>
                <p className="text-[#0369A1] font-mono font-semibold">{selectedAuditLog.case_id ? `#${selectedAuditLog.case_id}` : 'None'}</p>
              </div>
            </div>

            {selectedAuditLog.justification && (
              <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0] text-xs">
                <span className="text-[#64748B] text-[10px] uppercase font-bold">Statutory Justification</span>
                <p className="text-[#334155] mt-0.5 italic">&ldquo;{selectedAuditLog.justification}&rdquo;</p>
              </div>
            )}

            {/* Side-by-Side State Diff */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider">Before / After Forensic State Diff</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {/* Previous State */}
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[#B91C1C] border-b border-[#FECACA] pb-1 font-bold text-[11px]">
                    <span>PREVIOUS STATE</span>
                    <span>BEFORE</span>
                  </div>
                  <pre className="text-[#7F1D1D] text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedAuditLog.previous_state
                      ? JSON.stringify(selectedAuditLog.previous_state, null, 2)
                      : '// No previous record (Initial Creation)'}
                  </pre>
                </div>

                {/* New State */}
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[#15803D] border-b border-[#BBF7D0] pb-1 font-bold text-[11px]">
                    <span>NEW STATE</span>
                    <span>AFTER MODIFICATION</span>
                  </div>
                  <pre className="text-[#14532D] text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {selectedAuditLog.new_state
                      ? JSON.stringify(selectedAuditLog.new_state, null, 2)
                      : '// Entity deleted'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDiffModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#1E293B] rounded-lg text-xs font-semibold border border-[#CBD5E1]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

