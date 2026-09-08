# PackSure

### AI-Assisted Legal Metrology Compliance Platform

**PackSure** is an AI-assisted compliance-support platform designed to simplify the inspection of packaged commodities under the **Legal Metrology (Packaged Commodities) Rules, 2011 and applicable amendments**.

It combines **OCR, computer vision, deterministic compliance rules, evidence management, and human-in-the-loop verification** to help inspectors identify missing or potentially non-compliant declarations and maintain a structured digital inspection record.

> **AI assists. Officers verify. Senior Officers adjudicate.**

## Problem

Manual inspection of packaged commodities requires officers to examine multiple package surfaces, verify mandatory declarations, assess display requirements, document evidence, and prepare inspection records.

This can be time-consuming and difficult to standardize.

PackSure provides a structured digital workflow that brings these activities into a single inspection platform.

## How It Works

```text
Product
   ↓
Evidence Capture
   ↓
OCR + Computer Vision
   ↓
Applicable Compliance Rules
   ↓
Compliance Findings
   ↓
Inspector Verification
   ↓
Senior Officer Review
   ↓
Final Determination
   ↓
Report + Audit Trail
```

## Key Features

### Inspector Officer

* Create and manage inspection cases
* Product and manufacturer registry
* Barcode-based product lookup
* Multi-surface evidence capture
* OpenCV image-quality diagnostics
* OCR-based declaration extraction
* Bounding-box evidence mapping
* Deterministic compliance checks
* AI-detected vs Inspector-verified values
* Returned-case reinspection workflow
* Inspection reports

### Senior Officer

* Supervisory dashboard and review queue
* Case prioritization and filtering
* Multi-surface evidence review
* Finding-level verification and override
* Product compliance history
* Reinspection/remand workflow
* Final case determination
* Reports and analytics

### Administrator

* Officer and role management
* Product category management
* Regulatory rule management
* Rule versioning and applicability
* Audit trail
* System configuration and health monitoring

## Human-in-the-Loop

PackSure keeps machine-generated information separate from human decisions:

```text
RAW AI / OCR
     ↓
INSPECTOR VERIFIED
     ↓
SENIOR OFFICER DETERMINATION
```

This provides traceability of what the system detected, what the Inspector verified or corrected, and what the Senior Officer ultimately decided.

## Technology Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand

**Backend:** Python, Flask, SQLAlchemy, PostgreSQL

**AI / Computer Vision:** RapidOCR, OpenCV, NumPy

**Reports:** ReportLab

**Security:** JWT authentication, server-side RBAC, password hashing

## Architecture

PackSure follows a modular monolith architecture:

```text
React Frontend
      ↓
Flask Backend
      ↓
OCR / CV / Rule Engine / Reporting
      ↓
PostgreSQL
```

The **Inspection Case** acts as the central object connecting product information, evidence, extracted declarations, compliance checks, reviews, reports, and audit records.

## Security & Auditability

PackSure uses server-side role-based access control for three roles:

* **Inspector Officer**
* **Senior Officer**
* **Administrator**

Workflow transitions are enforced on the server, and inspection activities are recorded through an audit trail for traceability.

## Regulatory Scope

PackSure is a **compliance-support and inspection platform**. It assists authorized officers and does not independently make legally binding enforcement decisions.

The prototype implements a defined set of packaged-commodity compliance checks based on the regulatory rules configured in the system.

