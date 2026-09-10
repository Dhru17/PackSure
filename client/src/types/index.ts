export type UserRole = 'INSPECTOR' | 'SENIOR_OFFICER' | 'ADMIN' | 'COMPANY';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  badge_number?: string;
  jurisdiction_district?: string;
  phone_number?: string;
  company_id?: number | null;
  is_active: boolean;
  category_eligibilities?: InspectorCategoryEligibility[];
  jurisdiction_eligibilities?: InspectorJurisdictionEligibility[];
  created_at?: string;
}

export interface Company {
  id: number;
  name: string;
  legal_entity_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  contact_email?: string;
  contact_phone?: string;
  is_importer: boolean;
  registration_number?: string;
  is_active: boolean;
  plants_count?: number;
  products_count?: number;
  total_inspections?: number;
  total_violations?: number;
  created_at?: string;
}

export type Manufacturer = Company;

export interface Jurisdiction {
  id: number;
  code: string;
  name: string;
  state: string;
  district?: string;
  description?: string;
  is_active: boolean;
  plants_count?: number;
  inspectors_count?: number;
  created_at?: string;
}

export interface Plant {
  id: number;
  company_id: number;
  company_name?: string;
  plant_code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  jurisdiction_id?: number | null;
  jurisdiction_name?: string | null;
  jurisdiction_code?: string | null;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at?: string;
}

export interface InspectorCategoryEligibility {
  id: number;
  inspector_id: number;
  category_id: number;
  category_code?: string;
  category_name?: string;
  certified_date?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface InspectorJurisdictionEligibility {
  id: number;
  inspector_id: number;
  jurisdiction_id: number;
  jurisdiction_code?: string;
  jurisdiction_name?: string;
  jurisdiction_state?: string;
  is_active: boolean;
  created_at?: string;
}

export interface RuleRequirement {
  id: number;
  rule_id: number;
  requirement_code: string;
  title: string;
  requirement_type: string;
  description?: string;
  condition?: Record<string, any>;
  is_mandatory: boolean;
  created_at?: string;
}

export interface ProductCategory {
  id: number;
  category_code: string;
  name: string;
  parent_id?: number | null;
  parent_name?: string | null;
  description?: string;
  is_active: boolean;
  subcategories_count?: number;
  products_count?: number;
  rules_count?: number;
  created_at?: string;
}

export interface Product {
  id: number;
  barcode?: string;
  brand_name: string;
  commodity_name: string;
  category_id?: number;
  category_name?: string;
  manufacturer_id?: number;
  manufacturer_name?: string;
  package_type: string;
  default_net_quantity?: string;
  default_mrp?: number;
  is_imported: boolean;
  country_of_origin?: string;
  pdp_width_cm?: number;
  pdp_height_cm?: number;
  pdp_area_cm2?: number;
}

export type CaseStatus = 
  | 'DRAFT'
  | 'EVIDENCE_PENDING'
  | 'ANALYZING'
  | 'ANALYSIS_COMPLETE'
  | 'INSPECTOR_REVIEW'
  | 'SUBMITTED'
  | 'SENIOR_REVIEW'
  | 'RETURNED'
  | 'FINALIZED';

export type FinalDisposition = 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_FURTHER_INSPECTION';

export type SurfaceType = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'PRICE_FLAP' | 'LABEL';

export interface PackageEvidence {
  id: number;
  case_id: number;
  surface_type: SurfaceType;
  storage_path: string;
  annotated_storage_path?: string;
  original_filename: string;
  width_px?: number;
  height_px?: number;
  mm_per_pixel_scale?: number;
  blur_score?: number;
  brightness_score?: number;
  contrast_score?: number;
  quality_verdict: 'READABLE' | 'BORDERLINE' | 'UNREADABLE';
  quality_summary?: string;
  predicted_surface?: SurfaceType | string;
  is_surface_mismatch?: boolean;
  surface_mismatch_warning?: string;
  features_detected?: string[];
  captured_at: string;
}

export interface Declaration {
  id: number;
  case_id: number;
  evidence_id?: number;
  surface_name?: string;
  field_type: string;
  title: string;
  raw_ocr_text?: string;
  extracted_value?: string;
  normalized_value?: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  font_height_mm?: number;
  is_calibrated: boolean;
  extraction_method: string;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'CORRECTED' | 'REJECTED';
  inspector_corrected_value?: string;
}

export interface ComplianceCheck {
  id: number;
  case_id: number;
  rule_id: number;
  rule_code?: string;
  rule_title?: string;
  statutory_citation?: string;
  status: 'PASS' | 'FAIL' | 'REVIEW_REQUIRED' | 'NOT_APPLICABLE';
  confidence: number;
  reason_explanation: string;
  evaluated_value?: string;
  expected_condition?: string;
  evidence_id?: number;
  bbox?: { x: number; y: number; w: number; h: number };
}

export interface Violation {
  id: number;
  case_id: number;
  check_id?: number;
  rule_code: string;
  violation_title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence_snippet?: string;
  evidence_image_id?: number;
  bbox?: { x: number; y: number; w: number; h: number };
  inspector_decision: string;
  inspector_notes?: string;
  senior_decision: string;
  senior_override_reason?: string;
}

export interface CompanyDocument {
  id: number;
  company_id: number;
  company_name?: string;
  category_id?: number;
  category_name?: string;
  plant_id?: number;
  plant_name?: string;
  document_type: string;
  document_number?: string;
  title: string;
  issuing_authority?: string;
  issue_date?: string;
  valid_until?: string;
  expiry_date?: string;
  file_path?: string;
  file_url?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verified_by_id?: number;
  verified_by_name?: string;
  verified_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at?: string;
}

export interface InspectionCase {
  id: number;
  case_number: string;
  product_id: number;
  product?: Product;
  inspector_id: number;
  inspector_name?: string;
  inspector_badge?: string;
  senior_reviewer_id?: number;
  senior_reviewer_name?: string;
  status: CaseStatus;
  final_decision?: FinalDisposition;
  compliance_score: number;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  review_required_checks: number;
  not_applicable_checks: number;
  score_breakdown_text?: string;
  location_name?: string;
  source_type: string;
  inspector_remarks?: string;
  senior_remarks?: string;
  review_cycle?: number;
  rule_version?: string;
  actual_net_quantity?: string;
  actual_pdp_width_cm?: number;
  actual_pdp_height_cm?: number;
  actual_font_height_mm?: number;
  measurement_method?: string;
  calibrated_scale_used?: boolean;
  signed_by_name?: string;
  signed_at?: string;
  digital_signature_hash?: string;
  created_at: string;
  submitted_at?: string;
  finalized_at?: string;
  evidences?: PackageEvidence[];
  declarations?: Declaration[];
  compliance_checks?: ComplianceCheck[];
  violations?: Violation[];
  company_documents?: CompanyDocument[];
  required_documents?: Array<{
    code: string;
    title: string;
    is_mandatory: boolean;
    rule_citation: string;
    description: string;
  }>;
}

export interface RegulatoryRule {
  id: number;
  rule_code: string;
  version: string;
  title: string;
  description: string;
  statutory_citation: string;
  government_authority?: string;
  notification_reference?: string;
  notification_date?: string;
  amendment_title?: string;
  status?: string;
  calculated_effective_status?: string;
  official_source?: string;
  source_document: string;
  validation_logic_type: string;
  applicability_criteria?: Record<string, any>;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
  requirements_count?: number;
  requirements?: RuleRequirement[];
  categories_count?: number;
  created_at?: string;
}

export interface RegulatoryImpactResult {
  simulation_timestamp: string;
  effective_date: string;
  ai_impact_narrative?: string;
  rule?: {
    id: number;
    rule_code: string;
    version: string;
    title: string;
    statutory_citation: string;
    government_authority?: string;
    notification_reference?: string;
    notification_date?: string;
    amendment_title?: string;
    status?: string;
    effective_from: string;
    effective_to?: string;
    validation_logic_type?: string;
  };
  summary: {
    affected_categories_count: number;
    affected_companies_count: number;
    affected_plants_count: number;
    affected_products_count: number;
    total_scoped_products_count?: number;
    affected_upcoming_audits_count: number;
    requires_reinspection_count?: number;
    pending_verification_count?: number;
    verified_compliant_count?: number;
    conditionally_exempt_count?: number;
  };
  affected_categories: Array<{ id: number; category_code: string; name: string; products_count: number }>;
  affected_companies: Array<{ id: number; name: string; legal_entity_name: string; city: string; state: string; products_count: number; plants_count: number; is_importer: boolean }>;
  affected_plants: Array<{ id: number; plant_code: string; name: string; company_name: string; city: string; state: string; jurisdiction_name: string; is_active: boolean }>;
  affected_products: Array<{ 
    id: number; 
    barcode: string; 
    brand_name: string; 
    commodity_name: string; 
    category_name: string; 
    company_name: string; 
    default_net_quantity: string; 
    default_mrp: number; 
    package_type: string;
    is_imported?: boolean;
    impact_status?: 'REQUIRES_REINSPECTION' | 'PENDING_VERIFICATION' | 'VERIFIED_COMPLIANT' | 'CONDITIONALLY_EXEMPT' | string;
    reassessment_reason?: string;
    latest_case_number?: string;
    latest_case_status?: string;
  }>;
  affected_audits: Array<{ 
    id: number; 
    case_number: string; 
    product_name: string; 
    company_name: string; 
    inspector_name: string; 
    status: string; 
    impact_status?: string;
    location_name: string; 
    created_at?: string;
  }>;
  legal_disclaimer: string;
}

export interface AuditLog {
  id: number;
  case_id?: number;
  user_id?: number;
  user_name?: string;
  action_type: string;
  entity_name: string;
  entity_id: string;
  previous_state?: any;
  new_state?: any;
  justification?: string;
  ip_address?: string;
  timestamp: string;
}
