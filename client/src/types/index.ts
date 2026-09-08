export type UserRole = 'INSPECTOR' | 'SENIOR_OFFICER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  badge_number?: string;
  jurisdiction_district?: string;
  phone_number?: string;
  is_active: boolean;
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
  created_at: string;
  submitted_at?: string;
  finalized_at?: string;
  evidences?: PackageEvidence[];
  declarations?: Declaration[];
  compliance_checks?: ComplianceCheck[];
  violations?: Violation[];
}

export interface RegulatoryRule {
  id: number;
  rule_code: string;
  version: string;
  title: string;
  description: string;
  statutory_citation: string;
  source_document: string;
  validation_logic_type: string;
  effective_from: string;
  effective_to?: string;
  is_active: boolean;
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
