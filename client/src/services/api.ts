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

  // Inspections
  getInspectorOverview: () => apiFetch<any>("/api/inspections/overview"),
  getInspections: (status = "ALL", search = "") => 
    apiFetch<{ inspections: any[]; count: number }>(`/api/inspections?status=${status}&search=${encodeURIComponent(search)}`),
  getInspection: (id: number) => apiFetch<any>(`/api/inspections/${id}`),
  createInspection: (data: any) => apiFetch<{ inspection: any }>("/api/inspections", { method: "POST", body: JSON.stringify(data) }),
  uploadEvidence: (caseId: number, formData: FormData) => 
    apiFetch<{ evidence: any; quality_analysis: any }>(`/api/inspections/${caseId}/evidence`, { method: "POST", body: formData }),
  runAnalysis: (caseId: number) => apiFetch<any>(`/api/inspections/${caseId}/analyze`, { method: "POST" }),

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
  submitInspectorReview: (caseId: number, data: { remarks: string; corrections: Record<string, string> }) =>
    apiFetch<any>(`/api/reviews/${caseId}/inspector`, { method: "POST", body: JSON.stringify(data) }),
  submitSeniorAction: (caseId: number, data: { action: string; override_reason?: string; statutory_justification?: string; remarks?: string; violation_id?: number }) =>
    apiFetch<any>(`/api/reviews/${caseId}/senior-action`, { method: "POST", body: JSON.stringify(data) }),
  submitViolationAction: (caseId: number, violationId: number, data: { action: string; override_reason?: string; statutory_justification?: string }) =>
    apiFetch<any>(`/api/reviews/${caseId}/violations/${violationId}/action`, { method: "POST", body: JSON.stringify(data) }),


  // Rules & Governance
  getRules: () => apiFetch<{ rules: any[] }>("/api/rules"),
  createRule: (data: any) => apiFetch<{ rule: any }>("/api/rules", { method: "POST", body: JSON.stringify(data) }),
  updateRule: (ruleId: number, data: any) => apiFetch<{ message: string; rule: any }>(`/api/rules/${ruleId}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleRuleStatus: (ruleId: number) => apiFetch<{ message: string; rule: any }>(`/api/rules/${ruleId}/toggle-status`, { method: "PATCH" }),

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
  getReportPdfUrl: (caseId: number) => `${API_BASE}/api/reports/${caseId}/pdf`
};

