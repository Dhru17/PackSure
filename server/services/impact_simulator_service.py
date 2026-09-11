from datetime import datetime, date, timezone
from models import (
    db, RegulatoryRule, RuleCategoryMapping, ProductCategory,
    Product, Manufacturer, Company, Plant, Jurisdiction,
    InspectionCase, CaseStatus, AuditLog, AuditActionType
)

class RegulatoryImpactSimulatorService:
    """
    Innovation #9: Regulatory Change Impact Simulator
    Performs deterministic legal-metrology impact discovery across 
    categories, products, companies, plants, and upcoming inspection audits.
    """

    @staticmethod
    def simulate_rule_impact(rule_id: int = None, category_ids: list = None, effective_date: date = None):
        rule = None
        if rule_id:
            rule = db.session.get(RegulatoryRule, rule_id)
            if not rule:
                return {"error": f"Regulatory rule with id {rule_id} not found."}
            if not effective_date:
                effective_date = rule.effective_from

        # 1. Determine affected categories
        target_category_ids = set()
        if category_ids:
            target_category_ids.update([int(cid) for cid in category_ids if cid])
        elif rule:
            mappings = RuleCategoryMapping.query.filter_by(rule_id=rule.id, is_exempt=False).all()
            target_category_ids.update([m.category_id for m in mappings])

        # Expand to all subcategories recursively
        all_affected_cat_ids = set(target_category_ids)
        for cat_id in list(target_category_ids):
            subcats = ProductCategory.query.filter_by(parent_id=cat_id).all()
            for sc in subcats:
                all_affected_cat_ids.add(sc.id)

        categories_list = ProductCategory.query.filter(ProductCategory.id.in_(all_affected_cat_ids)).all() if all_affected_cat_ids else []

        # 2. Find affected products
        if all_affected_cat_ids:
            affected_products = Product.query.filter(Product.category_id.in_(all_affected_cat_ids)).all()
        else:
            affected_products = []

        # 3. Find affected companies (Manufacturers)
        company_ids_from_products = {p.manufacturer_id for p in affected_products if p.manufacturer_id}
        affected_companies = Manufacturer.query.filter(Manufacturer.id.in_(company_ids_from_products)).all() if company_ids_from_products else []

        # 4. Find affected plants
        if company_ids_from_products:
            affected_plants = Plant.query.filter(Plant.company_id.in_(company_ids_from_products)).all()
        else:
            affected_plants = []

        # 5. Find affected upcoming / active audits
        product_ids = {p.id for p in affected_products}
        affected_audits = []
        if product_ids:
            # Active or upcoming cases not yet finalized
            active_statuses = [
                CaseStatus.DRAFT,
                CaseStatus.EVIDENCE_PENDING,
                CaseStatus.ANALYZING,
                CaseStatus.ANALYSIS_COMPLETE,
                CaseStatus.INSPECTOR_REVIEW,
                CaseStatus.SUBMITTED,
                CaseStatus.SENIOR_REVIEW,
                CaseStatus.RETURNED
            ]
            affected_audits = InspectionCase.query.filter(
                InspectionCase.product_id.in_(product_ids),
                InspectionCase.status.in_(active_statuses)
            ).order_by(InspectionCase.created_at.desc()).all()

        # Build response payload
        categories_data = []
        for c in categories_list:
            categories_data.append({
                "id": c.id,
                "category_code": c.category_code,
                "name": c.name,
                "products_count": len([p for p in affected_products if p.category_id == c.id])
            })

        companies_data = []
        for comp in affected_companies:
            comp_prods = [p for p in affected_products if p.manufacturer_id == comp.id]
            comp_plants = [pl for pl in affected_plants if pl.company_id == comp.id]
            companies_data.append({
                "id": comp.id,
                "name": comp.name,
                "legal_entity_name": comp.legal_entity_name,
                "city": comp.city,
                "state": comp.state,
                "products_count": len(comp_prods),
                "plants_count": len(comp_plants),
                "is_importer": comp.is_importer
            })

        plants_data = []
        for pl in affected_plants:
            plants_data.append({
                "id": pl.id,
                "plant_code": pl.plant_code,
                "name": pl.name,
                "company_id": pl.company_id,
                "company_name": pl.company.name if pl.company else None,
                "city": pl.city,
                "state": pl.state,
                "jurisdiction_name": pl.jurisdiction_rel.name if pl.jurisdiction_rel else None,
                "is_active": pl.is_active
            })

        products_data = []
        for pr in affected_products:
            # Check specific product condition matches (e.g. is_imported, e-commerce, packaging)
            applicability = rule.get_applicability() if rule else {}
            product_conds = applicability.get("product_conditions", {})
            
            is_match = True
            if product_conds.get("is_imported") is True and not pr.is_imported:
                is_match = False
            if applicability.get("is_imported") is True and not pr.is_imported:
                is_match = False

            # Check historical and active audits for this product
            latest_case = InspectionCase.query.filter_by(product_id=pr.id).order_by(InspectionCase.created_at.desc()).first()

            if not is_match:
                impact_status = "CONDITIONALLY_EXEMPT"
                reassessment_reason = "Exempt from specific conditional scope (domestic origin / non-regulated packaging format)."
            elif latest_case and latest_case.status in [CaseStatus.RETURNED, CaseStatus.SENIOR_REVIEW, CaseStatus.INSPECTOR_REVIEW]:
                impact_status = "REQUIRES_REINSPECTION"
                reassessment_reason = f"Active audit ({latest_case.case_number}) in progress or returned; packaging declarations require officer verification against updated {rule.rule_code if rule else 'rule'} standards."
            elif latest_case and latest_case.final_decision and "COMPLIANT" in str(latest_case.final_decision):
                impact_status = "VERIFIED_COMPLIANT"
                reassessment_reason = f"Previous audit ({latest_case.case_number}) verified compliant; baseline declarations verified."
            else:
                impact_status = "PENDING_VERIFICATION"
                reassessment_reason = f"Packaged commodity in regulated category [{pr.category.name if pr.category else 'General'}]; pending field inspection verification under {rule.rule_code if rule else 'amended standards'}."

            products_data.append({
                "id": pr.id,
                "barcode": pr.barcode,
                "brand_name": pr.brand_name,
                "commodity_name": pr.commodity_name,
                "category_id": pr.category_id,
                "category_name": pr.category.name if pr.category else None,
                "company_id": pr.manufacturer_id,
                "company_name": pr.manufacturer.name if pr.manufacturer else None,
                "default_net_quantity": pr.default_net_quantity,
                "default_mrp": pr.default_mrp,
                "package_type": pr.package_type,
                "is_imported": pr.is_imported,
                "impact_status": impact_status,
                "reassessment_reason": reassessment_reason,
                "latest_case_number": latest_case.case_number if latest_case else None,
                "latest_case_status": latest_case.status.value if (latest_case and hasattr(latest_case.status, "value")) else (str(latest_case.status) if latest_case else None)
            })

        audits_data = []
        for aud in affected_audits:
            audits_data.append({
                "id": aud.id,
                "case_number": aud.case_number,
                "product_id": aud.product_id,
                "product_name": f"{aud.product.brand_name} - {aud.product.commodity_name}" if aud.product else None,
                "company_name": aud.product.manufacturer.name if (aud.product and aud.product.manufacturer) else None,
                "inspector_name": aud.inspector.full_name if aud.inspector else None,
                "status": aud.status.value if hasattr(aud.status, "value") else str(aud.status),
                "impact_status": "REQUIRES_REASSESSMENT",
                "location_name": aud.location_name,
                "created_at": aud.created_at.isoformat() if aud.created_at else None
            })

        rule_info = None
        if rule:
            rule_info = {
                "id": rule.id,
                "rule_code": rule.rule_code,
                "version": rule.version,
                "title": rule.title,
                "statutory_citation": rule.statutory_citation,
                "government_authority": rule.government_authority,
                "notification_reference": rule.notification_reference,
                "notification_date": rule.notification_date.isoformat() if rule.notification_date else None,
                "amendment_title": rule.amendment_title,
                "status": rule.status,
                "effective_from": rule.effective_from.isoformat() if rule.effective_from else None,
                "effective_to": rule.effective_to.isoformat() if rule.effective_to else None,
                "validation_logic_type": rule.validation_logic_type
            }

        # Filter strictly affected products count for summary (in scope products)
        in_scope_products = [p for p in products_data if p["impact_status"] != "CONDITIONALLY_EXEMPT"]

        ai_narrative = (
            f"Regulatory amendment for {rule.rule_code if rule else 'Rule'} impacts {len(categories_data)} commodity category trees, "
            f"affecting {len(companies_data)} registered manufacturers across {len(plants_data)} manufacturing facilities. "
            f"A total of {len(in_scope_products)} packaged products are in active scope ({len([p for p in products_data if p['impact_status'] == 'REQUIRES_REINSPECTION'])} requiring immediate re-inspection, "
            f"{len([p for p in products_data if p['impact_status'] == 'PENDING_VERIFICATION'])} pending field verification, and "
            f"{len([p for p in products_data if p['impact_status'] == 'VERIFIED_COMPLIANT'])} verified compliant under baseline rules). "
            f"{len(audits_data)} active/upcoming inspection audits must be evaluated under the effective date ({effective_date})."
        )

        return {
            "simulation_timestamp": datetime.now(timezone.utc).isoformat(),
            "effective_date": effective_date.isoformat() if hasattr(effective_date, "isoformat") else str(effective_date),
            "rule": rule_info,
            "ai_impact_narrative": ai_narrative,
            "summary": {
                "affected_categories_count": len(categories_data),
                "affected_companies_count": len(companies_data),
                "affected_plants_count": len(plants_data),
                "affected_products_count": len(in_scope_products),
                "total_scoped_products_count": len(products_data),
                "affected_upcoming_audits_count": len(audits_data),
                "requires_reinspection_count": len([p for p in products_data if p['impact_status'] == 'REQUIRES_REINSPECTION']),
                "pending_verification_count": len([p for p in products_data if p['impact_status'] == 'PENDING_VERIFICATION']),
                "verified_compliant_count": len([p for p in products_data if p['impact_status'] == 'VERIFIED_COMPLIANT']),
                "conditionally_exempt_count": len([p for p in products_data if p['impact_status'] == 'CONDITIONALLY_EXEMPT'])
            },
            "affected_categories": categories_data,
            "affected_companies": companies_data,
            "affected_plants": plants_data,
            "affected_products": products_data,
            "affected_audits": audits_data,
            "legal_disclaimer": "This impact simulation is a deterministic scope discovery tool for regulatory governance. Potentially affected products require officer reassessment against the updated rule version; they are not automatically declared non-compliant."
        }
