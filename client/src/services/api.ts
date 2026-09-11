const API_BASE = "http://127.0.0.1:5055";

export function getAuthToken(): string | null {
  return localStorage.getItem("packsure_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("packsure_token", token);
  } else {
    localStorage.removeItem("packsure_token");
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errMessage = `Request failed (${res.status})`;
    try {
      const errData = await res.json();
      if (errData.error) errMessage = errData.error;
    } catch {}
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (email: string, password: string) => 
    apiFetch<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  getMe: () => apiFetch<{ user: any }>("/api/auth/me"),
  seedDefaults: () => apiFetch<{ message: string }>("/api/auth/seed-defaults", { method: "POST" }),

  // Products
  getProducts: (search = "") => apiFetch<{ products: any[] }>(`/api/products?search=${encodeURIComponent(search)}`),
  lookupBarcode: (barcode: string) => apiFetch<{ found: boolean; product: any; previous_inspections: any[] }>(`/api/products/lookup/${barcode}`),
  createProduct: (data: any) => apiFetch<{ product: any }>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  identifyProductFromImage: (formData: FormData) =>
    apiFetch<{
      found: boolean;
      method: string;
      barcode?: string;
      product?: any;
      extracted_fields: {
        brand_name?: string;
        commodity_name?: string;
        category_name?: string;
        package_type?: string;
        default_net_quantity?: string;
        default_mrp?: number;
        is_imported?: boolean;
        country_of_origin?: string;
        pdp_width_cm?: number;
        pdp_height_cm?: number;
        pdp_area_cm2?: number;
        manufacturer_name?: string;
      };
      image_url?: string;
      detected_texts?: string[];
      message?: string;
    }>("/api/products/identify-image", { method: "POST", body: formData }),
  scanBarcodeImage: (formData: FormData) =>
    apiFetch<{
      success: boolean;
      barcode?: string;
      found: boolean;
      product?: any;
      message?: string;
    }>("/api/products/scan-barcode", { method: "POST", body: formData }),

  // Inspections
  getInspectorOverview: () => apiFetch<any>("/api/inspections/overview"),
  getInspections: (status = "ALL", search = "") => 
    apiFetch<{ inspections: any[]; count: number }>(`/api/inspections?status=${status}&search=${encodeURIComponent(search)}`),
  getInspection: (id: number) => apiFetch<any>(`/api/inspections/${id}`),
  createInspection: (data: any) => apiFetch<{ inspection: any }>("/api/inspections", { method: "POST", body: JSON.stringify(data) }),
  uploadEvidence: (caseId: number, formData: FormData) => 
    apiFetch<{ evidence: any; quality_analysis: any; surface_classification?: any }>(`/api/inspections/${caseId}/evidence`, { method: "POST", body: formData }),
  reassignEvidenceSurface: (caseId: number, evidenceId: number, newSurfaceType: string) =>
    apiFetch<{ message: string; evidence: any }>(`/api/inspections/${caseId}/evidence/${evidenceId}/reassign`, {
      method: "POST",
      body: JSON.stringify({ new_surface_type: newSurfaceType })
    }),
  runAnalysis: (caseId: number) => apiFetch<any>(`/api/inspections/${caseId}/analyze`, { method: "POST" }),
  saveMeasurements: (caseId: number, data: {
    actual_net_quantity?: string;
    actual_pdp_width_cm?: number;
    actual_pdp_height_cm?: number;
    actual_font_height_mm?: number;
    measurement_method?: string;
    calibrated_scale_used?: boolean;
  }) => apiFetch<any>(`/api/inspections/${caseId}/measurements`, { method: "POST", body: JSON.stringify(data) }),
  getCaseDocuments: (caseId: number) => apiFetch<{ documents: any[]; count: number }>(`/api/inspections/${caseId}/documents`),
  verifyCaseDocument: (caseId: number, docId: number, data: { status: string; rejection_reason?: string; notes?: string }) =>
    apiFetch<any>(`/api/inspections/${caseId}/documents/${docId}/verify`, { method: "POST", body: JSON.stringify(data) }),

  // Reviews & Senior Adjudication
  getSeniorOverview: () => apiFetch<any>("/api/reviews/overview"),
  getReviewQueue: (filters?: { search?: string; status?: string; severity?: string; categoryId?: number; sortBy?: string }) => {
    const q = new URLSearchParams();
    if (filters?.search) q.append("search", filters.search);
    if (filters?.status && filters.status !== "ALL") q.append("status", filters.status);
    if (filters?.severity && filters.severity !== "ALL") q.append("severity", filters.severity);
    if (filters?.categoryId) q.append("category_id", String(filters.categoryId));
    if (filters?.sortBy) q.append("sort_by", filters.sortBy);
    const qs = q.toString();
    return apiFetch<{ queue: any[]; count: number }>(`/api/reviews/queue${qs ? `?${qs}` : ""}`);
  },
  getProductHistory: (productId: number) => apiFetch<any>(`/api/reviews/products/${productId}/history`),
  submitInspectorReview: (caseId: number, data: { remarks?: string; corrections?: Record<string, string>; signed_by_name?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/inspector`, { method: "POST", body: JSON.stringify(data) }),
  submitSeniorAction: (caseId: number, data: { action: string; override_reason?: string; statutory_justification?: string; remarks?: string; violation_id?: number }) =>
    apiFetch<any>(`/api/reviews/${caseId}/senior-action`, { method: "POST", body: JSON.stringify(data) }),
  returnCaseForReinspection: (caseId: number, data: { reason: string; statutory_citation?: string; remarks?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/return`, { method: "POST", body: JSON.stringify(data) }),
  finalizeCaseReview: (caseId: number, data: { action: string; override_reason?: string; statutory_justification?: string; remarks?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/finalize`, { method: "POST", body: JSON.stringify(data) }),
  submitViolationAction: (caseId: number, violationId: number, data: { action: string; override_reason?: string; statutory_justification?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/violations/${violationId}/action`, { method: "POST", body: JSON.stringify(data) }),
  submitCheckAction: (caseId: number, checkId: number, data: { action: string; override_reason?: string; statutory_justification?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/checks/${checkId}/action`, { method: "POST", body: JSON.stringify(data) }),

  // Innovation #5: Brand-Wide & Systemic Violation Intelligence
  getSystemicPatterns: (status = "ALL") => {
    const p = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<{ patterns: any[]; count: number }>(`/api/reviews/intelligence/patterns${p}`);
  },
  updateSystemicPatternAction: (patternId: number, data: { status: string; notes?: string }) =>
    apiFetch<any>(`/api/reviews/intelligence/patterns/${patternId}/action`, { method: "POST", body: JSON.stringify(data) }),

  // Senior Officer Audit Scheduling
  getEligibleInspectorsForAudit: (params?: { category_id?: number; plant_id?: number; jurisdiction_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.append("category_id", String(params.category_id));
    if (params?.plant_id) q.append("plant_id", String(params.plant_id));
    if (params?.jurisdiction_id) q.append("jurisdiction_id", String(params.jurisdiction_id));
    const qs = q.toString();
    return apiFetch<{ inspectors: any[]; count: number }>(`/api/inspections/eligible-inspectors${qs ? `?${qs}` : ""}`);
  },
  scheduleAudit: (data: any) =>
    apiFetch<{ message: string; case: any }>("/api/inspections/schedule", { method: "POST", body: JSON.stringify(data) }),
  getScheduledAudits: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append("status", params.status);
    if (params?.search) q.append("search", params.search);
    const qs = q.toString();
    return apiFetch<{ audits: any[]; count: number }>(`/api/inspections/scheduled${qs ? `?${qs}` : ""}`);
  },
  updateScheduledAudit: (caseId: number, data: any) =>
    apiFetch<{ message: string; case: any }>(`/api/inspections/${caseId}/schedule`, { method: "PUT", body: JSON.stringify(data) }),



  // Rules & Governance
  getRules: () => apiFetch<{ rules: any[] }>("/api/rules"),
  createRule: (data: any) => apiFetch<{ rule: any }>("/api/rules", { method: "POST", body: JSON.stringify(data) }),
  updateRule: (ruleId: number, data: any) => apiFetch<{ message: string; rule: any }>(`/api/rules/${ruleId}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleRuleStatus: (ruleId: number) => apiFetch<{ message: string; rule: any }>(`/api/rules/${ruleId}/toggle-status`, { method: "PATCH" }),
  getRuleVersions: (ruleId: number) => apiFetch<{ rule_code: string; versions: any[]; count: number }>(`/api/admin/rules/${ruleId}/versions`),
  createRuleVersion: (ruleId: number, data: any) => apiFetch<{ rule: any }>(`/api/admin/rules/${ruleId}/version`, { method: "POST", body: JSON.stringify(data) }),
  getRuleRequirements: (ruleId: number) => apiFetch<{ requirements: any[]; count: number }>(`/api/admin/rules/${ruleId}/requirements`),
  addRuleRequirement: (ruleId: number, data: any) => apiFetch<{ requirement: any }>(`/api/admin/rules/${ruleId}/requirements`, { method: "POST", body: JSON.stringify(data) }),
  deleteRuleRequirement: (ruleId: number, reqId: number) => apiFetch<{ message: string }>(`/api/admin/rules/${ruleId}/requirements/${reqId}`, { method: "DELETE" }),

  // Innovation #9: Regulatory Change Impact Simulator
  getRuleImpact: (ruleId: number) => apiFetch<any>(`/api/admin/rules/${ruleId}/impact`),
  simulateRegulatoryImpact: (data: { rule_id?: number; category_ids?: number[]; effective_date?: string }) =>
    apiFetch<any>("/api/admin/rules/impact-simulate", { method: "POST", body: JSON.stringify(data) }),

  // Company Master Data
  getCompanies: (filters?: { search?: string; status?: string }) => {
    const p = new URLSearchParams();
    if (filters?.search) p.append("search", filters.search);
    if (filters?.status && filters.status !== "ALL") p.append("status", filters.status);
    const qs = p.toString();
    return apiFetch<{ companies: any[]; count: number }>(`/api/admin/companies${qs ? `?${qs}` : ""}`);
  },
  getCompany: (id: number) => apiFetch<{ company: any }>(`/api/admin/companies/${id}`),
  createCompany: (data: any) => apiFetch<{ company: any }>("/api/admin/companies", { method: "POST", body: JSON.stringify(data) }),
  updateCompany: (id: number, data: any) => apiFetch<{ message: string; company: any }>(`/api/admin/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleCompanyStatus: (id: number) => apiFetch<{ message: string; company: any }>(`/api/admin/companies/${id}/toggle-status`, { method: "PATCH" }),
  deleteCompany: (id: number) => apiFetch<{ message: string }>(`/api/admin/companies/${id}`, { method: "DELETE" }),

  // Jurisdictions Master Data
  getJurisdictions: (filters?: { search?: string; state?: string }) => {
    const p = new URLSearchParams();
    if (filters?.search) p.append("search", filters.search);
    if (filters?.state && filters.state !== "ALL") p.append("state", filters.state);
    const qs = p.toString();
    return apiFetch<{ jurisdictions: any[]; count: number }>(`/api/admin/jurisdictions${qs ? `?${qs}` : ""}`);
  },
  createJurisdiction: (data: any) => apiFetch<{ jurisdiction: any }>("/api/admin/jurisdictions", { method: "POST", body: JSON.stringify(data) }),
  updateJurisdiction: (id: number, data: any) => apiFetch<{ message: string; jurisdiction: any }>(`/api/admin/jurisdictions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleJurisdictionStatus: (id: number) => apiFetch<{ message: string; jurisdiction: any }>(`/api/admin/jurisdictions/${id}/toggle-status`, { method: "PATCH" }),

  // Plants / Locations Master Data
  getPlants: (filters?: { search?: string; company_id?: number; jurisdiction_id?: number }) => {
    const p = new URLSearchParams();
    if (filters?.search) p.append("search", filters.search);
    if (filters?.company_id) p.append("company_id", String(filters.company_id));
    if (filters?.jurisdiction_id) p.append("jurisdiction_id", String(filters.jurisdiction_id));
    const qs = p.toString();
    return apiFetch<{ plants: any[]; count: number }>(`/api/admin/plants${qs ? `?${qs}` : ""}`);
  },
  createPlant: (data: any) => apiFetch<{ plant: any }>("/api/admin/plants", { method: "POST", body: JSON.stringify(data) }),
  updatePlant: (id: number, data: any) => apiFetch<{ message: string; plant: any }>(`/api/admin/plants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  togglePlantStatus: (id: number) => apiFetch<{ message: string; plant: any }>(`/api/admin/plants/${id}/toggle-status`, { method: "PATCH" }),

  // Inspector Eligibility Configuration
  getInspectors: () => apiFetch<{ inspectors: any[]; count: number }>("/api/admin/inspectors"),
  getInspectorEligibility: (id: number) => apiFetch<{ inspector: any; categories: any[]; jurisdictions: any[] }>(`/api/admin/inspectors/${id}/eligibility`),
  configureInspectorEligibility: (id: number, data: { category_ids: number[]; jurisdiction_ids: number[] }) =>
    apiFetch<{ message: string; inspector_id: number; categories_count: number; jurisdictions_count: number }>(`/api/admin/inspectors/${id}/eligibility`, { method: "POST", body: JSON.stringify(data) }),
  getEligibleInspectors: (filters: { category_id?: number; jurisdiction_id?: number }) => {
    const p = new URLSearchParams();
    if (filters.category_id) p.append("category_id", String(filters.category_id));
    if (filters.jurisdiction_id) p.append("jurisdiction_id", String(filters.jurisdiction_id));
    const qs = p.toString();
    return apiFetch<{ eligible_inspectors: any[]; count: number }>(`/api/admin/inspectors/eligible${qs ? `?${qs}` : ""}`);
  },

  // Product Categories
  getCategories: () => apiFetch<{ categories: any[]; count: number }>("/api/admin/categories"),
  createCategory: (data: any) => apiFetch<{ category: any }>("/api/admin/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (categoryId: number, data: any) => apiFetch<{ category: any }>(`/api/admin/categories/${categoryId}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleCategoryStatus: (categoryId: number) => apiFetch<{ message: string; category: any }>(`/api/admin/categories/${categoryId}/toggle-status`, { method: "PATCH" }),
  deleteCategory: (categoryId: number) => apiFetch<{ message: string }>(`/api/admin/categories/${categoryId}`, { method: "DELETE" }),
  getCategoryRules: (categoryId: number) => apiFetch<{ category: any; mappings: any[]; count: number }>(`/api/admin/categories/${categoryId}/rules`),
  mapCategoryRule: (categoryId: number, data: { rule_id: number; is_exempt?: boolean; exception_notes?: string }) =>
    apiFetch<{ message: string }>(`/api/admin/categories/${categoryId}/rules`, { method: "POST", body: JSON.stringify(data) }),
  unmapCategoryRule: (categoryId: number, ruleId: number) =>
    apiFetch<{ message: string }>(`/api/admin/categories/${categoryId}/rules/${ruleId}`, { method: "DELETE" }),

  // Analytics & Admin
  getAnalyticsSummary: () => apiFetch<any>("/api/analytics/summary"),
  getRepeatViolators: () => apiFetch<{ repeat_violators: any[] }>("/api/analytics/repeat-violators"),
  getDashboardStats: () => apiFetch<{ stats: any; recent_audit_logs: any[] }>("/api/admin/dashboard-stats"),
  getUsers: (filters?: { role?: string; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role && filters.role !== "ALL") params.append("role", filters.role);
    if (filters?.status && filters.status !== "ALL") params.append("status", filters.status);
    if (filters?.search) params.append("search", filters.search);
    const qs = params.toString();
    return apiFetch<{ users: any[]; count: number }>(`/api/admin/users${qs ? `?${qs}` : ""}`);
  },
  createUser: (data: any) => apiFetch<{ user: any }>("/api/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (userId: number, data: any) => apiFetch<{ message: string; user: any }>(`/api/admin/users/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  resetUserPassword: (userId: number, password: string) => apiFetch<{ message: string }>(`/api/admin/users/${userId}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }),
  toggleUserStatus: (userId: number) => apiFetch<{ user: any; message: string }>(`/api/admin/users/${userId}/toggle-status`, { method: "PATCH" }),
  deleteUser: (userId: number) => apiFetch<{ message: string; soft_deleted: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" }),
  getAuditLogs: (params?: { caseId?: number; actionType?: string; userId?: number; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.caseId) q.append("case_id", String(params.caseId));
    if (params?.actionType && params.actionType !== "ALL") q.append("action_type", params.actionType);
    if (params?.userId) q.append("user_id", String(params.userId));
    if (params?.search) q.append("search", params.search);
    if (params?.limit) q.append("limit", String(params.limit));
    const qs = q.toString();
    return apiFetch<{ audit_logs: any[]; count: number }>(`/api/admin/audit-logs${qs ? `?${qs}` : ""}`);
  },
  getSystemHealth: () => apiFetch<any>("/api/admin/system-health"),

  // Media
  getMediaUrl: (path: string) => path.startsWith("http") ? path : `${API_BASE}${path}`,
  getReportPdfUrl: (caseId: number) => {
    const token = getAuthToken();
    return `${API_BASE}/api/reports/${caseId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Company Module
  getCompanyDashboard: () => apiFetch<any>("/api/company/dashboard"),
  getCompanyProfile: () => apiFetch<{ company: any }>("/api/company/profile"),
  updateCompanyProfile: (data: any) => apiFetch<{ message: string; company: any }>("/api/company/profile", { method: "PUT", body: JSON.stringify(data) }),
  getCompanyPlants: () => apiFetch<{ plants: any[]; count: number }>("/api/company/plants"),
  getCompanyProducts: (filters?: { search?: string; category_id?: number }) => {
    const p = new URLSearchParams();
    if (filters?.search) p.append("search", filters.search);
    if (filters?.category_id) p.append("category_id", String(filters.category_id));
    const qs = p.toString();
    return apiFetch<{ products: any[]; count: number; categories?: any[] }>(`/api/company/products${qs ? `?${qs}` : ""}`);
  },
  getCompanyProductDetail: (id: number) => apiFetch<any>(`/api/company/products/${id}`),
  getCompanyRules: (search = "") => {
    const p = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiFetch<{ rules: any[]; count: number }>(`/api/company/rules${p}`);
  },

  // Smart Priority Analytics (Pandas Aggregation)
  getSmartPriorityAnalytics: (params?: { timeframe?: string; refresh?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.timeframe) q.append("timeframe", params.timeframe);
    if (params?.refresh) q.append("refresh", "true");
    const qs = q.toString();
    return apiFetch<{
      market_summary: {
        total_violations: number;
        total_inspections: number;
        high_priority_brands_count: number;
        top_violator_brand: string;
        top_violated_rule: string;
        market_compliance_rate: number;
        tracked_brands_count: number;
        tracked_rules_count: number;
      };
      brand_priority: Array<{
        rank: number;
        brand_name: string;
        violations_count: number;
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        priority_badge: string;
        priority_rank: number;
        inspections_count: number;
        compliance_rate: number;
        top_violated_rule: string;
      }>;
      rule_trend: Array<{
        rank: number;
        rule_code: string;
        rule_title: string;
        statutory_citation: string;
        times_violated: number;
        market_share_percent: number;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
      }>;
      timeframe: string;
      generated_at: string;
    }>(`/api/analytics/smart-priority${qs ? `?${qs}` : ""}`);
  },
  seedSmartPriorityDemo: () => apiFetch<any>("/api/analytics/smart-priority/seed-demo-data", { method: "POST" }),
  getCompanyDocuments: (status = "ALL") => {
    const p = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<{ documents: any[]; count: number }>(`/api/company/documents${p}`);
  },
  uploadCompanyDocument: (formData: FormData) => 
    apiFetch<{ message: string; document: any }>("/api/company/documents", { method: "POST", body: formData }),
  replaceCompanyDocument: (docId: number, formData: FormData) =>
    apiFetch<{ message: string; document: any }>(`/api/company/documents/${docId}/replace`, { method: "POST", body: formData }),
  getCompanyAudits: (filters?: { status?: string; search?: string }) => {
    const p = new URLSearchParams();
    if (filters?.status && filters.status !== "ALL") p.append("status", filters.status);
    if (filters?.search) p.append("search", filters.search);
    const qs = p.toString();
    return apiFetch<{ audits: any[]; count: number }>(`/api/company/audits${qs ? `?${qs}` : ""}`);
  },
  getCompanyAuditDetail: (caseId: number) => apiFetch<any>(`/api/company/audits/${caseId}`),
  getCompanyDocumentDownloadUrl: (docId: number) => {
    const token = getAuthToken();
    return `${API_BASE}/api/company/documents/${docId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  getCompanyReportDownloadUrl: (caseNumberOrId: string | number) => {
    const token = getAuthToken();
    return `${API_BASE}/api/company/reports/${caseNumberOrId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  getCompanyNotifications: () => apiFetch<{ notifications: any[]; count: number; unread_count: number }>("/api/company/notifications"),
  markCompanyNotificationRead: (notifId: number) => apiFetch<any>(`/api/company/notifications/${notifId}/read`, { method: "POST" })
};

export const packsureApi = api;
export default api;

