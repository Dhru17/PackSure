"""
PackSure — Part 4: Company Module Automated Test Suite
"""

import os
import io
import json
import pytest
from app import create_app
from models import (
    db, User, Company, Plant, Product, ProductCategory, 
    CompanyDocument, DocumentStatus, InspectionCase, RegulatoryRule, Notification
)

@pytest.fixture
def app_instance():
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app_instance):
    with app_instance.test_client() as client:
        with app_instance.app_context():
            yield client

def login(client, email, password):
    res = client.post('/api/auth/login', json={'email': email, 'password': password})
    assert res.status_code == 200, f"Login failed for {email}: {res.get_json()}"
    data = res.get_json()
    token = data.get('token')
    return {'Authorization': f'Bearer {token}'}

def test_company_login_and_role(client):
    """Test login with company credentials and verify role is COMPANY."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/auth/me', headers=headers)
    assert res.status_code == 200
    user_data = res.get_json().get('user')
    assert user_data['role'] == 'COMPANY'
    assert user_data['company_id'] is not None

def test_company_dashboard(client):
    """Test company dashboard summary endpoint."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/company/dashboard', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'company' in data
    assert 'stats' in data
    assert 'upcoming_audits' in data
    assert 'recent_finalized_audits' in data
    assert 'Britannia' in data['company']['legal_name']

def test_company_profile_and_update(client):
    """Test getting and updating company contact details."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    
    # 1. Get profile
    res = client.get('/api/company/profile', headers=headers)
    assert res.status_code == 200
    profile = res.get_json().get('company')
    assert 'Britannia' in profile['legal_name']
    
    # 2. Update contact details
    update_payload = {
        'address': '5/1A Hungerford Street, Updated Corporate Wing',
        'city': 'Kolkata',
        'state': 'West Bengal',
        'pin_code': '700017',
        'contact_email': 'compliance.hq@britannia.com',
        'contact_phone': '+91-33-2287-2439'
    }
    res = client.put('/api/company/profile', json=update_payload, headers=headers)
    assert res.status_code == 200
    
    # 3. Verify updated profile
    res2 = client.get('/api/company/profile', headers=headers)
    assert res2.status_code == 200
    updated = res2.get_json().get('company')
    assert updated['contact_email'] == 'compliance.hq@britannia.com'
    assert updated['contact_phone'] == '+91-33-2287-2439'

def test_company_plants(client):
    """Test company plants listing."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/company/plants', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'plants' in data
    assert isinstance(data['plants'], list)
    assert data['count'] >= 0

def test_company_products_and_detail(client):
    """Test products catalog and single product details."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/company/products', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'products' in data
    assert 'categories' in data
    
    if len(data['products']) > 0:
        prod_id = data['products'][0]['id']
        res_detail = client.get(f'/api/company/products/{prod_id}', headers=headers)
        assert res_detail.status_code == 200
        detail_data = res_detail.get_json()
        assert 'product' in detail_data
        assert 'audit_history' in detail_data

def test_company_documents_upload_and_replace(client):
    """Test statutory document upload and replacement."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    
    # 1. Get documents
    res = client.get('/api/company/documents', headers=headers)
    assert res.status_code == 200
    
    # 2. Upload a new document
    upload_data = {
        'document_type': 'MODEL_APPROVAL_CERTIFICATE',
        'document_name': 'Britannia Good Day Packaging Approval 2026',
        'document_number': 'IND/LM/2026/DOC-9988',
        'notes': 'Submitted for statutory verification under Rule 6.',
        'file': (io.BytesIO(b"Fake PDF statutory certificate content"), 'model_approval_test.pdf')
    }
    upload_res = client.post(
        '/api/company/documents',
        data=upload_data,
        content_type='multipart/form-data',
        headers=headers
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.get_json()}"
    uploaded_doc = upload_res.get_json().get('document')
    doc_id = uploaded_doc['id']
    assert uploaded_doc['status'] == 'PENDING_VERIFICATION'
    
    # 3. Replace/resubmit document
    replace_data = {
        'document_name': 'Britannia Good Day Packaging Approval 2026 (Revised)',
        'document_number': 'IND/LM/2026/DOC-9988-REV1',
        'notes': 'Replaced with amended stamp.',
        'file': (io.BytesIO(b"Updated fake PDF content"), 'model_approval_test_rev1.pdf')
    }
    replace_res = client.post(
        f'/api/company/documents/{doc_id}/replace',
        data=replace_data,
        content_type='multipart/form-data',
        headers=headers
    )
    assert replace_res.status_code == 200
    replaced_doc = replace_res.get_json().get('document')
    assert replaced_doc['status'] == 'PENDING_VERIFICATION'
    assert replaced_doc['rejection_reason'] is None

def test_company_audits_listing(client):
    """Test listing audits for the company."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/company/audits', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'audits' in data
    assert isinstance(data['audits'], list)

def test_company_notifications(app_instance, client):
    """Test notifications retrieval and mark-as-read."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    
    # Create test notification directly
    with app_instance.app_context():
        user = User.query.filter_by(email='compliance@britannia.com').first()
        notif = Notification(
            user_id=user.id,
            company_id=user.company_id,
            title='Test Inspection Scheduled',
            message='Your facility inspection has been scheduled for tomorrow.',
            notification_type='AUDIT_SCHEDULED',
            is_read=False
        )
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id

    # 1. Fetch notifications
    res = client.get('/api/company/notifications', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'notifications' in data
    assert data['unread_count'] >= 1
    
    # 2. Mark as read
    res_read = client.post(f'/api/company/notifications/{notif_id}/read', headers=headers)
    assert res_read.status_code == 200

def test_company_rules_read_only(client):
    """Test regulatory rule book read-only access for company."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    res = client.get('/api/company/rules', headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert 'rules' in data
    assert len(data['rules']) > 0
    assert 'effective_rule_version' in data

def test_idor_cross_company_isolation(app_instance, client):
    """Test strict tenant isolation: Company 1 cannot access Company 2's resources."""
    headers = login(client, 'compliance@britannia.com', 'Company#2026')
    
    # Create a secondary test company with a product and document
    with app_instance.app_context():
        comp2 = Company.query.filter_by(registration_number='TEST-COMP-2026-99').first()
        if not comp2:
            comp2 = Company(
                name='ITC Limited Test Rival',
                registration_number='TEST-COMP-2026-99'
            )
            db.session.add(comp2)
            db.session.commit()
            
        prod2 = Product.query.filter_by(barcode='8901030999999').first()
        if not prod2:
            prod2 = Product(
                manufacturer_id=comp2.id,
                brand_name='Sunfeast Dark Fantasy Test Rival',
                commodity_name='Choco Fill Biscuits 300g',
                barcode='8901030999999'
            )
            db.session.add(prod2)
            db.session.commit()
            
        doc2 = CompanyDocument.query.filter_by(document_number='DOC-RIVAL-99').first()
        if not doc2:
            doc2 = CompanyDocument(
                company_id=comp2.id,
                document_type='MODEL_APPROVAL_CERTIFICATE',
                document_number='DOC-RIVAL-99',
                title='Rival Proprietary Certificate',
                status=DocumentStatus.VERIFIED
            )
            db.session.add(doc2)
            db.session.commit()
            
        prod2_id = prod2.id
        doc2_id = doc2.id

    # 1. Company 1 attempts to access Company 2's product detail -> Must return 403
    res_prod = client.get(f'/api/company/products/{prod2_id}', headers=headers)
    assert res_prod.status_code == 403, f"Expected 403 for cross-company product access, got {res_prod.status_code}"
    
    # 2. Company 1 attempts to download/access Company 2's document -> Must return 403
    res_doc = client.get(f'/api/company/documents/{doc2_id}/download', headers=headers)
    assert res_doc.status_code == 403, f"Expected 403 for cross-company document access, got {res_doc.status_code}"
    
    # 3. Company 1 attempts to replace Company 2's document -> Must return 403
    res_replace = client.post(
        f'/api/company/documents/{doc2_id}/replace',
        data={'document_name': 'Hacked Document'},
        content_type='multipart/form-data',
        headers=headers
    )
    assert res_replace.status_code == 403, f"Expected 403 for cross-company document modification, got {res_replace.status_code}"
