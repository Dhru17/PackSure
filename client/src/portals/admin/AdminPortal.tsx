import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { 
  User, 
  RegulatoryRule, 
  AuditLog, 
  ProductCategory, 
  Company, 
  Plant, 
  Jurisdiction 
} from '../../types';

// Admin Components & Views
import { AdminSidebar, type AdminNavTab } from './components/AdminSidebar';
import { AdminTopbar } from './components/AdminTopbar';
import { AdminDashboard } from './views/AdminDashboard';
import { AdminCompaniesView } from './views/AdminCompaniesView';
import { AdminJurisdictionsView } from './views/AdminJurisdictionsView';
import { AdminInspectorsView } from './views/AdminInspectorsView';
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
import { CompanyFormModal } from './views/modals/CompanyFormModal';
import { PlantFormModal } from './views/modals/PlantFormModal';
import { JurisdictionFormModal } from './views/modals/JurisdictionFormModal';
import { InspectorEligibilityModal } from './views/modals/InspectorEligibilityModal';
import { RuleImpactModal } from './views/modals/RuleImpactModal';
import { RuleRequirementModal } from './views/modals/RuleRequirementModal';
import { RuleFormModal } from './views/modals/RuleFormModal';
import { CategoryFormModal } from './views/modals/CategoryFormModal';
import { CategoryRuleMapModal } from './views/modals/CategoryRuleMapModal';
import { AuditDiffDrawer } from './views/modals/AuditDiffDrawer';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminNavTab | 'user_detail' | 'rule_detail' | 'category_detail'>('home');

  // Master Data states
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
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

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyModalTarget, setCompanyModalTarget] = useState<Company | null>(null);

  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [plantModalTarget, setPlantModalTarget] = useState<Plant | null>(null);
  const [plantDefaultCompanyId, setPlantDefaultCompanyId] = useState<number | null>(null);

  const [isJurisdictionModalOpen, setIsJurisdictionModalOpen] = useState(false);
  const [jurisdictionModalTarget, setJurisdictionModalTarget] = useState<Jurisdiction | null>(null);

  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const [eligibilityModalTarget, setEligibilityModalTarget] = useState<User | null>(null);

  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactModalTargetRule, setImpactModalTargetRule] = useState<RegulatoryRule | null>(null);

  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [requirementModalTargetRule, setRequirementModalTargetRule] = useState<RegulatoryRule | null>(null);

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalTarget, setRuleModalTarget] = useState<RegulatoryRule | null>(null);
  const [isNewRuleVersionMode, setIsNewRuleVersionMode] = useState(false);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTarget, setCategoryModalTarget] = useState<ProductCategory | null>(null);

  const [isCategoryRuleMapModalOpen, setIsCategoryRuleMapModalOpen] = useState(false);
  const [selectedAuditLogForDiff, setSelectedAuditLogForDiff] = useState<AuditLog | null>(null);

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

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

  const loadCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.companies || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadPlants = async () => {
    try {
      const res = await api.getPlants();
      setPlants(res.plants || []);
    } catch (err) {
      console.error('Error loading plants:', err);
    }
  };

  const loadJurisdictions = async () => {
    try {
      const res = await api.getJurisdictions();
      setJurisdictions(res.jurisdictions || []);
    } catch (err) {
      console.error('Error loading jurisdictions:', err);
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
    loadCompanies();
    loadPlants();
    loadJurisdictions();
    loadRules();
    loadCategories();
    loadAuditLogs();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // ----------------------------------------------------
  // COMPANY HANDLERS
  // ----------------------------------------------------
  const handleSaveCompany = async (formData: any) => {
    setIsProcessing(true);
    try {
      if (companyModalTarget) {
        await api.updateCompany(companyModalTarget.id, formData);
        showNotice(`Company '${formData.name}' updated successfully.`);
      } else {
        await api.createCompany(formData);
        showNotice(`New enterprise '${formData.name}' registered.`);
      }
      setIsCompanyModalOpen(false);
      loadCompanies();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save company.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCompanyStatus = async (companyId: number) => {
    try {
      await api.toggleCompanyStatus(companyId);
      showNotice('Company status toggled.');
      loadCompanies();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  // ----------------------------------------------------
  // PLANT HANDLERS
  // ----------------------------------------------------
  const handleSavePlant = async (formData: any) => {
    setIsProcessing(true);
    try {
      if (plantModalTarget) {
        await api.updatePlant(plantModalTarget.id, formData);
        showNotice(`Plant '${formData.name}' updated.`);
      } else {
        await api.createPlant(formData);
        showNotice(`New facility '${formData.name}' registered.`);
      }
      setIsPlantModalOpen(false);
      loadPlants();
      loadCompanies();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save plant.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePlantStatus = async (plantId: number) => {
    try {
      await api.togglePlantStatus(plantId);
      showNotice('Plant status toggled.');
      loadPlants();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle plant status.');
    }
  };

  // ----------------------------------------------------
  // JURISDICTION HANDLERS
  // ----------------------------------------------------
  const handleSaveJurisdiction = async (formData: any) => {
    setIsProcessing(true);
    try {
      if (jurisdictionModalTarget) {
        await api.updateJurisdiction(jurisdictionModalTarget.id, formData);
        showNotice(`Jurisdiction '${formData.name}' updated.`);
      } else {
        await api.createJurisdiction(formData);
        showNotice(`New statutory jurisdiction '${formData.name}' created.`);
      }
      setIsJurisdictionModalOpen(false);
      loadJurisdictions();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save jurisdiction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleJurisdictionStatus = async (jurId: number) => {
    try {
      await api.toggleJurisdictionStatus(jurId);
      showNotice('Jurisdiction status toggled.');
      loadJurisdictions();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle jurisdiction status.');
    }
  };

  // ----------------------------------------------------
  // INSPECTOR ELIGIBILITY HANDLERS
  // ----------------------------------------------------
  const handleSaveEligibility = async (
    inspectorId: number,
    data: { category_ids: number[]; jurisdiction_ids: number[] }
  ) => {
    setIsProcessing(true);
    try {
      await api.configureInspectorEligibility(inspectorId, data);
      showNotice('Inspector permanent qualifications updated successfully.');
      setIsEligibilityModalOpen(false);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to configure inspector eligibility.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------
  // RULE REQUIREMENTS & VERSIONING HANDLERS
  // ----------------------------------------------------
  const handleSaveRequirement = async (ruleId: number, data: any) => {
    setIsProcessing(true);
    try {
      await api.addRuleRequirement(ruleId, data);
      showNotice('Statutory requirement added to rule.');
      setIsRequirementModalOpen(false);
      loadRules();
      if (selectedRule && selectedRule.id === ruleId) {
        const updatedRules = await api.getRules();
        const found = (updatedRules.rules || []).find((r: any) => r.id === ruleId);
        if (found) setSelectedRule(found);
      }
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to add requirement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRequirement = async (ruleId: number, reqId: number) => {
    if (!confirm('Are you sure you want to delete this statutory requirement?')) return;
    try {
      await api.deleteRuleRequirement(ruleId, reqId);
      showNotice('Requirement removed.');
      loadRules();
      if (selectedRule && selectedRule.id === ruleId) {
        const updatedRules = await api.getRules();
        const found = (updatedRules.rules || []).find((r: any) => r.id === ruleId);
        if (found) setSelectedRule(found);
      }
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete requirement.');
    }
  };

  // ----------------------------------------------------
  // USER HANDLERS
  // ----------------------------------------------------
  const handleSaveUser = async (userData: any) => {
    setIsProcessing(true);
    try {
      if (userModalTarget) {
        await api.updateUser(userModalTarget.id, userData);
        showNotice(`User '${userData.full_name}' updated.`);
      } else {
        await api.createUser(userData);
        showNotice(`User '${userData.full_name}' created.`);
      }
      setIsUserModalOpen(false);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save user.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await api.toggleUserStatus(user.id);
      showNotice(`User account ${user.is_active ? 'deactivated' : 'activated'}.`);
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status.');
    }
  };

  // ----------------------------------------------------
  // RULE & CATEGORY HANDLERS
  // ----------------------------------------------------
  const handleSaveRule = async (ruleData: any) => {
    setIsProcessing(true);
    try {
      if (isNewRuleVersionMode && ruleModalTarget) {
        await api.createRuleVersion(ruleModalTarget.id, ruleData);
        showNotice(`New version '${ruleData.version}' for ${ruleData.rule_code} created.`);
      } else if (ruleModalTarget) {
        await api.updateRule(ruleModalTarget.id, ruleData);
        showNotice(`Rule '${ruleData.rule_code}' updated.`);
      } else {
        await api.createRule(ruleData);
        showNotice(`Rule '${ruleData.rule_code}' published.`);
      }
      setIsRuleModalOpen(false);
      loadRules();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save rule.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRuleStatus = async (rule: RegulatoryRule) => {
    try {
      await api.toggleRuleStatus(rule.id);
      showNotice(`Rule ${rule.rule_code} status updated.`);
      loadRules();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle rule status.');
    }
  };

  const handleSaveCategory = async (catData: any) => {
    setIsProcessing(true);
    try {
      if (categoryModalTarget) {
        await api.updateCategory(categoryModalTarget.id, catData);
        showNotice(`Category '${catData.name}' updated.`);
      } else {
        await api.createCategory(catData);
        showNotice(`Category '${catData.name}' created.`);
      }
      setIsCategoryModalOpen(false);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to save category.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCategoryStatus = async (category: ProductCategory) => {
    try {
      await api.toggleCategoryStatus(category.id);
      showNotice(`Category ${category.name} status updated.`);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle category status.');
    }
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    try {
      await api.deleteCategory(category.id);
      showNotice(`Category '${category.name}' deleted successfully.`);
      loadCategories();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* Fixed Sidebar */}
      <AdminSidebar
        activeTab={
          activeTab === 'user_detail' ? 'users' :
          activeTab === 'rule_detail' ? 'rules' :
          activeTab === 'category_detail' ? 'categories' :
          (activeTab as AdminNavTab)
        }
        onSelectTab={(tab) => {
          setSelectedUser(null);
          setSelectedRule(null);
          setSelectedCategory(null);
          setActiveTab(tab);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          activeTab={activeTab as any}
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
        />

        {/* Global Action Notification Banner */}
        {actionNotice && (
          <div className="mx-6 mt-4 p-3 bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-bold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice(null)} className="text-[#15803D] hover:text-[#14532D] cursor-pointer">
              ✕
            </button>
          </div>
        )}

        <main className="p-6 flex-1 overflow-y-auto">
          {/* 1. Overview Dashboard */}
          {activeTab === 'home' && (
            <AdminDashboard
              users={users}
              rules={rules}
              categories={categories}
              auditLogs={auditLogs}
              companies={companies}
              plants={plants}
              jurisdictions={jurisdictions}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onNewCompany={() => {
                setCompanyModalTarget(null);
                setIsCompanyModalOpen(true);
              }}
              onNewJurisdiction={() => {
                setJurisdictionModalTarget(null);
                setIsJurisdictionModalOpen(true);
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

          {/* 2. Companies & Plants Master Data */}
          {activeTab === 'companies' && (
            <AdminCompaniesView
              companies={companies}
              plants={plants}
              jurisdictions={jurisdictions}
              onAddCompany={() => {
                setCompanyModalTarget(null);
                setIsCompanyModalOpen(true);
              }}
              onEditCompany={(c) => {
                setCompanyModalTarget(c);
                setIsCompanyModalOpen(true);
              }}
              onToggleCompanyStatus={handleToggleCompanyStatus}
              onSelectCompany={() => {}}
              onAddPlant={(defaultCompanyId) => {
                setPlantModalTarget(null);
                setPlantDefaultCompanyId(defaultCompanyId || null);
                setIsPlantModalOpen(true);
              }}
              onEditPlant={(p) => {
                setPlantModalTarget(p);
                setPlantDefaultCompanyId(p.company_id);
                setIsPlantModalOpen(true);
              }}
              onTogglePlantStatus={handleTogglePlantStatus}
            />
          )}

          {/* 3. Jurisdictions Master Data */}
          {activeTab === 'jurisdictions' && (
            <AdminJurisdictionsView
              jurisdictions={jurisdictions}
              onAddJurisdiction={() => {
                setJurisdictionModalTarget(null);
                setIsJurisdictionModalOpen(true);
              }}
              onEditJurisdiction={(j) => {
                setJurisdictionModalTarget(j);
                setIsJurisdictionModalOpen(true);
              }}
              onToggleJurisdictionStatus={handleToggleJurisdictionStatus}
            />
          )}

          {/* 4. Inspector Qualification Matrix */}
          {activeTab === 'inspectors' && (
            <AdminInspectorsView
              inspectors={users.filter(u => u.role === 'INSPECTOR')}
              categories={categories}
              jurisdictions={jurisdictions}
              onConfigureEligibility={(insp) => {
                setEligibilityModalTarget(insp);
                setIsEligibilityModalOpen(true);
              }}
              onAddInspectorUser={() => {
                setUserModalTarget(null);
                setIsUserModalOpen(true);
              }}
            />
          )}

          {/* 5. Users & Roles Management */}
          {activeTab === 'users' && (
            <AdminUsersView
              users={users}
              onOpenUserDetail={(u) => {
                setSelectedUser(u);
                setActiveTab('user_detail');
              }}
              onNewUser={() => {
                setUserModalTarget(null);
                setIsUserModalOpen(true);
              }}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {/* User Details View */}
          {activeTab === 'user_detail' && selectedUser && (
            <AdminUserDetailsView
              user={selectedUser}
              auditLogs={auditLogs.filter(l => l.user_id === selectedUser.id || (l.justification && l.justification.includes(selectedUser.email)))}
              onBack={() => setActiveTab('users')}
              onEditUser={(u) => {
                setUserModalTarget(u);
                setIsUserModalOpen(true);
              }}
              onToggleStatus={handleToggleUserStatus}
              onResetPassword={(u) => { showNotice(`Password reset initiated for ${u.email}`); }}
              onChangeRole={async (newRole: any) => {
                if (selectedUser) {
                  await handleSaveUser({ role: newRole });
                }
              }}
              onDeleteUser={handleToggleUserStatus}
            />
          )}

          {/* 6. Regulatory Rule Book & Versioning */}
          {activeTab === 'rules' && (
            <AdminRulesView
              rules={rules}
              onOpenRuleDetail={(r) => {
                setSelectedRule(r);
                setActiveTab('rule_detail');
              }}
              onNewRule={() => {
                setRuleModalTarget(null);
                setIsNewRuleVersionMode(false);
                setIsRuleModalOpen(true);
              }}
              onToggleStatus={handleToggleRuleStatus}
              onOpenImpactSimulator={(r) => {
                setImpactModalTargetRule(r);
                setIsImpactModalOpen(true);
              }}
            />
          )}

          {/* Rule Details View */}
          {activeTab === 'rule_detail' && selectedRule && (
            <AdminRuleDetailsView
              rule={selectedRule}
              allRuleVersions={rules}
              categories={categories}
              onBack={() => setActiveTab('rules')}
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
              onOpenImpactSimulator={(r) => {
                setImpactModalTargetRule(r);
                setIsImpactModalOpen(true);
              }}
              onAddRequirement={(r) => {
                setRequirementModalTargetRule(r);
                setIsRequirementModalOpen(true);
              }}
              onDeleteRequirement={handleDeleteRequirement}
            />
          )}

          {/* 7. Product Categories Master Data */}
          {activeTab === 'categories' && (
            <AdminCategoriesView
              categories={categories}
              onOpenCategoryDetail={async (cat) => {
                setSelectedCategory(cat);
                try {
                  const res = await api.getCategoryRules(cat.id);
                  setMappedCategoryRules(res.mappings || []);
                } catch (err) {
                  setMappedCategoryRules([]);
                }
                setActiveTab('category_detail');
              }}
              onNewCategory={() => {
                setCategoryModalTarget(null);
                setIsCategoryModalOpen(true);
              }}
              onEditCategory={(c) => {
                setCategoryModalTarget(c);
                setIsCategoryModalOpen(true);
              }}
              onToggleStatus={handleToggleCategoryStatus}
              onDeleteCategory={(c) => {
                handleDeleteCategory(c);
              }}
              onOpenRuleMappings={async (cat) => {
                setSelectedCategory(cat);
                try {
                  const res = await api.getCategoryRules(cat.id);
                  setMappedCategoryRules(res.mappings || []);
                } catch (err) {
                  setMappedCategoryRules([]);
                }
                setIsCategoryRuleMapModalOpen(true);
              }}
            />
          )}

          {/* Category Details View */}
          {activeTab === 'category_detail' && selectedCategory && (
            <AdminCategoryDetailsView
              category={selectedCategory}
              mappedRules={mappedCategoryRules}
              onBack={() => setActiveTab('categories')}
              onEditCategory={(c) => {
                setCategoryModalTarget(c);
                setIsCategoryModalOpen(true);
              }}
              onOpenRuleMapModal={() => setIsCategoryRuleMapModalOpen(true)}
              onUnmapRule={async (ruleId: number) => {
                try {
                  await api.unmapCategoryRule(selectedCategory.id, ruleId);
                  showNotice('Rule unmapped from category.');
                  const res = await api.getCategoryRules(selectedCategory.id);
                  setMappedCategoryRules(res.mappings || []);
                } catch (err: any) {
                  alert(err.message || 'Failed to unmap rule.');
                }
              }}
            />
          )}

          {/* 8. Audit Logs & Forensics */}
          {activeTab === 'audit' && (
            <AdminAuditLogsView
              auditLogs={auditLogs}
              onOpenDiff={(log: AuditLog) => setSelectedAuditLogForDiff(log)}
              onRefresh={loadAuditLogs}
            />
          )}

          {/* 9. Settings & Profile */}
          {activeTab === 'settings' && <AdminSettingsView />}
          {activeTab === 'profile' && <AdminProfileView />}
        </main>
      </div>

      {/* Master Modals */}
      <CompanyFormModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={companyModalTarget}
        onSave={handleSaveCompany}
        isProcessing={isProcessing}
      />

      <PlantFormModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        plant={plantModalTarget}
        companies={companies}
        jurisdictions={jurisdictions}
        defaultCompanyId={plantDefaultCompanyId}
        onSave={handleSavePlant}
        isProcessing={isProcessing}
      />

      <JurisdictionFormModal
        isOpen={isJurisdictionModalOpen}
        onClose={() => setIsJurisdictionModalOpen(false)}
        jurisdiction={jurisdictionModalTarget}
        onSave={handleSaveJurisdiction}
        isProcessing={isProcessing}
      />

      <InspectorEligibilityModal
        isOpen={isEligibilityModalOpen}
        onClose={() => setIsEligibilityModalOpen(false)}
        inspector={eligibilityModalTarget}
        categories={categories}
        jurisdictions={jurisdictions}
        onSave={handleSaveEligibility}
        isProcessing={isProcessing}
      />

      <RuleImpactModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        rule={impactModalTargetRule}
      />

      <RuleRequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        rule={requirementModalTargetRule}
        onSave={handleSaveRequirement}
        isProcessing={isProcessing}
      />

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={userModalTarget}
        onSave={handleSaveUser}
        isProcessing={isProcessing}
      />

      <RuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        rule={ruleModalTarget}
        isNewVersionMode={isNewRuleVersionMode}
        onSave={handleSaveRule}
        isProcessing={isProcessing}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={categoryModalTarget}
        parentOptions={categories.filter(c => !categoryModalTarget || c.id !== categoryModalTarget.id)}
        onSave={handleSaveCategory}
        isProcessing={isProcessing}
      />

      {selectedCategory && (
        <CategoryRuleMapModal
          isOpen={isCategoryRuleMapModalOpen}
          onClose={() => setIsCategoryRuleMapModalOpen(false)}
          category={selectedCategory}
          mappedRules={mappedCategoryRules}
          allRules={rules}
          onMapRule={async (data) => {
            try {
              await api.mapCategoryRule(selectedCategory.id, data);
              showNotice('Rule mapped to category.');
              setIsCategoryRuleMapModalOpen(false);
              const res = await api.getCategoryRules(selectedCategory.id);
              setMappedCategoryRules(res.mappings || []);
            } catch (err: any) {
              alert(err.message || 'Failed to map rule.');
            }
          }}
          onUnmapRule={async (ruleId: number) => {
            try {
              await api.unmapCategoryRule(selectedCategory.id, ruleId);
              showNotice('Rule unmapped from category.');
              const res = await api.getCategoryRules(selectedCategory.id);
              setMappedCategoryRules(res.mappings || []);
            } catch (err: any) {
              alert(err.message || 'Failed to unmap rule.');
            }
          }}
        />
      )}

      {selectedAuditLogForDiff && (
        <AuditDiffDrawer
          isOpen={!!selectedAuditLogForDiff}
          log={selectedAuditLogForDiff}
          onClose={() => setSelectedAuditLogForDiff(null)}
        />
      )}
    </div>
  );
};
