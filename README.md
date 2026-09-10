# PackSure

## AI-Assisted Legal Metrology Inspection & Compliance Platform

PackSure is a software platform designed to support the inspection and compliance verification of packaged commodities under India's Legal Metrology framework.

The platform combines **package-image capture, OCR, computer vision, deterministic rule-based compliance analysis, inspection workflow management, evidence handling, reporting, audit history, and role-based access control** into a single system.

> **SIH Problem Statement:** SIH26034 --- Software System to check compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 by scanning products, images and labels.

------------------------------------------------------------------------

## Table of Contents

-   [Overview](#overview)
-   [Problem](#problem)
-   [Solution](#solution)
-   [Key Features](#key-features)
-   [System Workflow](#system-workflow)
-   [User Roles](#user-roles)
-   [AI and Compliance Approach](#ai-and-compliance-approach)
-   [Key Innovations](#key-innovations)
-   [Technology Stack](#technology-stack)
-   [Project Architecture](#project-architecture)
-   [Inspection Lifecycle](#inspection-lifecycle)
-   [Compliance Analysis](#compliance-analysis)
-   [Evidence and Reporting](#evidence-and-reporting)
-   [Security and Access Control](#security-and-access-control)
-   [Data Model](#data-model)
-   [Repository Structure](#repository-structure)
-   [Rule Versioning](#rule-versioning)
-   [Important Design Principles](#important-design-principles)
-   [Limitations and Scope](#limitations-and-scope)
-   [Future Enhancements](#future-enhancements)
-   [Project Status](#project-status)
-   [Team / Hackathon](#team--hackathon)

------------------------------------------------------------------------

## Overview

Packaged commodities must carry mandatory declarations and comply with prescribed requirements relating to declarations, presentation, readability, quantity, pricing and other applicable requirements.

Traditional inspection processes can involve:

-   Manual verification of package labels
-   Repeated checking of regulatory requirements
-   Paper or scattered evidence
-   Manual report preparation
-   Difficulty maintaining historical inspection records
-   Limited visibility into recurring violations
-   Difficulty assessing the impact of regulatory changes across existing products

PackSure provides a centralized workflow that assists government officers and inspectors in performing these activities in a structured and evidence-backed manner.

The platform is designed around a **human-in-the-loop compliance model**:

> **AI assists with extraction and analysis; the regulatory rule engine performs formal deterministic checks; authorized officers make the final inspection decision.**

------------------------------------------------------------------------

# Problem

The SIH problem focuses on developing a software system capable of checking compliance of packaged commodities by scanning products, images and labels.

A useful inspection system needs to address more than OCR alone.

It should support:

1.  Product and company information
2.  Inspection scheduling
3.  Inspector assignment
4.  Required document verification
5.  Package image/evidence capture
6.  Label information extraction
7.  Mandatory declaration detection
8.  Compliance verification
9.  Violation identification
10. Inspection reports
11. Review and approval
12. Historical audit records
13. Secure role-based access
14. Regulatory rule management

PackSure brings these activities into one inspection lifecycle.

------------------------------------------------------------------------

# Solution

PackSure follows a structured workflow:

``` text
Admin
  ↓
Manage Master Data & Regulatory Rules
  ↓
Senior Officer
  ↓
Create / Schedule / Assign Audit
  ↓
Company
  ↓
Upload Required Documents & Product Information
  ↓
Inspector
  ↓
Physical Inspection + Evidence Capture
  ↓
Front & Back Package Images
  ↓
OCR + Image Analysis
  ↓
Declaration Extraction
  ↓
Rule Engine
  ↓
Compliance / Violations
  ↓
Inspector Review & Digital Signature
  ↓
Senior Officer Review
  ↓
Approve / Return for Correction
  ↓
Finalized Inspection Report
  ↓
Company + Audit History
```

------------------------------------------------------------------------

# Key Features

## 1. Role-Based Inspection Workflow

PackSure provides four primary roles:

-   Admin
-   Senior Officer
-   Inspector
-   Company

Each role receives access only to the operations required for its responsibility.

------------------------------------------------------------------------

## 2. Company → Plant → Category → Product → Audit Hierarchy

Inspections are organized using a structured hierarchy:

``` text
Company
   ↓
Plant
   ↓
Product Category
   ↓
Product
   ↓
Audit
```

This allows inspection information to remain associated with the correct organization, location, product category and audit.

------------------------------------------------------------------------

## 3. Regulatory Rule Book

The platform maintains regulatory rules and their versions.

Rules can be associated with:

-   Product categories
-   Effective dates
-   Regulatory references
-   Applicability conditions
-   Compliance checks

Historical inspections can retain the rule version associated with the inspection instead of silently replacing historical regulatory context.

------------------------------------------------------------------------

## 4. Audit Scheduling and Assignment

Senior Officers can:

-   Create audits
-   Select the relevant company, plant, category and product
-   Schedule inspection activities
-   Assign eligible inspectors
-   Track inspection status
-   Review submitted inspection findings
-   Return inspections for correction
-   Approve and finalize reports

Inspector eligibility can take into account active status, jurisdiction and category qualification.

------------------------------------------------------------------------

## 5. Statutory Enterprise Documents & Certifications Desk

Companies provide statutory compliance documents required for manufacturing and pre-market clearance.

The platform provides:

-   **Statutory Document Mandates**: Automatic detection of required certificates (*Rule 27 Director of Legal Metrology Packer Registration, Section 22 Model Approval Certificate, State Manufacturing / FSSAI License, Import Clearances*).
-   **Inspector Document Verification Desk**: Allows field officers to inspect, verify (`VERIFIED`), or flag discrepancies (`REJECTED` with mandatory justification).
-   **Dynamic Official Statutory PDF Generation**: On-demand generation of official Government of India / Legal Metrology Directorate formatted PDF certificates with embedded photo scans and SHA-256 verification hashes.
-   **Company Document Management**: Organizations can upload, replace, track verification status, and download validated certificates.

------------------------------------------------------------------------

## 6. Live Barcode Scanner & Product Catalog Lookup

The inspection workflow starts with real-time commodity identification:

-   **Real-Time Camera & Laser Barcode Scanner**: Scans EAN-13 and UPC barcodes directly from camera feeds or uploaded package images.
-   **Automated Catalog Matching**: Instantly retrieves commodity specifications, net quantity standards, brand name, and manufacturer entity data.
-   **Manual Identification Fallback**: Supports manual entry and AI visual label metadata extraction for new or unregistered commodities.

------------------------------------------------------------------------

## 7. 6-Panel Package Visual Evidence Capture

The Inspector captures comprehensive multi-panel visual evidence across all package faces:

-   **6-Side Packaging Coverage**: Front Panel (PDP), Back Information Panel (BIP), Left Panel, Right Panel, Top Flap / Seal, and Bottom / Base.
-   **Live Quality Diagnostics**: Real-time OpenCV image analysis evaluating blur score (Laplacian variance), brightness, contrast, and orientation angles.
-   **Interactive Panel Reassignment**: Enables inspectors to correct surface classifications on the fly.

------------------------------------------------------------------------

## 8. Calibrated Physical Measurements & Standards

The system distinguishes between image-level approximations and calibrated legal metrology measurements:

-   **Calibrated Font Height (Rule 7)**: Officer inputs field measurements taken with calibrated vernier calipers against PDP area standards.
-   **Calibrated Scale Verification**: Direct recording of net quantity against calibrated electronic balances and inspection seals.
-   **PDP Area Computation (Rule 8)**: Automated rectangular / cylindrical area calculation for mandatory declaration proportions.

------------------------------------------------------------------------

## 9. Official Evidence-Backed LMPC Inspection Reports (PDF)

PackSure generates formal 8-section Legal Metrology inspection reports powered by ReportLab:

1. Executive Summary & Statutory Disposition
2. Multi-Panel Visual Evidence
3. Detected Declarations & 16-Field Matrix
4. OCR Evidence & Confidence Diagnostics
5. Regulatory Rule Validation & Statutory Citations
6. Evidence-Backed Violations with Visual Bounding Boxes
7. Mathematical Compliance Scorecard (Zero-Penalty Estimation)
8. Inspector Digital Sign-off & Senior Officer Adjudication Seal

------------------------------------------------------------------------

## 7. OCR and Image Analysis

PackSure uses OCR and image-processing components to assist inspectors with package-label analysis.

The system can extract information such as:

-   Product information
-   Net quantity
-   MRP
-   Manufacturer information
-   Manufacturing/date information
-   Batch information
-   Best-before / expiry-related information
-   Other declarations detected on the package

OCR output is treated as extracted evidence and can require human review, especially when confidence is low.

------------------------------------------------------------------------

## 8. Declaration Detection

The system analyzes extracted label information to identify relevant declarations and compare them against applicable requirements.

Possible findings include:

-   Missing declaration
-   Incorrect declaration
-   Incomplete information
-   Inconsistent information
-   Readability-related issue
-   Font-size-related issue
-   Placement-related issue
-   Other applicable rule violations

------------------------------------------------------------------------

## 9. Deterministic Rule Engine

The formal compliance decision is not delegated to an LLM.

The Rule Engine evaluates structured information against applicable regulatory rules.

The architecture separates:

``` text
OCR / AI
   ↓
Extracted Information
   ↓
Structured Declarations
   ↓
Deterministic Rule Engine
   ↓
Compliance Checks
   ↓
Violations / Compliance Result
```

This separation improves traceability and makes regulatory checks easier to audit and update.

------------------------------------------------------------------------

# System Workflow

## Step 1 --- Admin

The Admin manages:

-   Master data
-   Companies
-   Plants
-   Product categories
-   Inspectors
-   Regulatory rules
-   Rule versions
-   System configuration
-   Audit logs

The Admin is responsible for system governance rather than conducting individual inspections.

------------------------------------------------------------------------

## Step 2 --- Senior Officer

The Senior Officer:

-   Creates and schedules audits
-   Selects the company, plant, category and product
-   Assigns an eligible inspector
-   Tracks audit progress
-   Reviews submitted inspection results
-   Returns reports for correction when necessary
-   Approves and finalizes completed inspections

------------------------------------------------------------------------

## Step 3 --- Company

The company receives the scheduled audit and provides required information.

The company can:

-   Upload required documents
-   Provide product details
-   View audit status
-   View its own products
-   Access finalized reports
-   View historical audit information

Company access is restricted to its own organization.

------------------------------------------------------------------------

## Step 4 --- Inspector

The assigned Inspector performs the field inspection.

The Inspector:

1.  Verifies documents
2.  Conducts physical inspection
3.  Captures front and back package images
4.  Adds additional evidence
5.  Performs physical measurements where required
6.  Runs/uses OCR and image analysis
7.  Reviews extracted declarations
8.  Performs compliance checks
9.  Records violations
10. Prepares the inspection report
11. Digitally signs the report
12. Submits it to the Senior Officer

------------------------------------------------------------------------

## Step 5 --- OCR + AI Analysis

Package images are processed to extract useful label information.

The OCR/analysis stage assists in:

-   Text extraction
-   Declaration identification
-   Structuring extracted information
-   Image-quality related processing
-   Supporting compliance analysis

Low-confidence extraction can be flagged for review rather than being blindly accepted.

------------------------------------------------------------------------

## Step 6 --- Rule Engine

The Rule Engine checks extracted and manually verified information against the applicable rule version.

It can evaluate relevant requirements such as:

-   Mandatory declarations
-   Net quantity
-   MRP
-   Date-related declarations
-   Required information
-   Applicable numeral/font requirements
-   Product/category-specific conditions

The result can contain compliant checks as well as specific violations.

------------------------------------------------------------------------

## Step 7 --- Review and Finalization

After inspection:

``` text
Inspector
   ↓
Review Findings
   ↓
Digital Signature
   ↓
Senior Officer Review
   ↓
 ┌───────────────┐
 │               │
Return         Approve
 │               │
 ↓               ↓
Correction     Finalize
```

A returned inspection can be corrected and submitted again.

------------------------------------------------------------------------

## Step 8 --- Official Report

After approval, PackSure generates the finalized inspection report.

The report can contain:

-   Audit details
-   Company and product information
-   Inspection information
-   Evidence
-   Extracted declarations
-   Compliance checks
-   Violations
-   Remarks
-   Review information
-   Final compliance result

The finalized report remains associated with the audit history.

------------------------------------------------------------------------

# User Roles

## Admin

### Responsibilities

-   Manage master data
-   Manage companies and plants
-   Manage product categories
-   Manage inspectors
-   Manage regulatory rules
-   Manage rule versions
-   Maintain system configuration
-   Review audit logs
-   Use regulatory impact analysis

### Does not perform

-   Individual physical inspections
-   Individual audit assignment decisions
-   Individual inspection review/finalization

------------------------------------------------------------------------

## Senior Officer

### Responsibilities

-   Schedule audits
-   Assign eligible inspectors
-   Monitor audits
-   Review inspection submissions
-   Return reports for correction
-   Approve and finalize inspections
-   Review compliance intelligence

### Does not perform

-   Physical field inspection
-   Direct modification of the Rule Book

------------------------------------------------------------------------

## Inspector

### Responsibilities

-   View assigned audits
-   Verify documents
-   Conduct physical inspection
-   Capture evidence
-   Review OCR output
-   Perform measurements
-   Record findings
-   Prepare reports
-   Digitally sign
-   Submit inspection

Inspectors cannot access or modify inspections that are not assigned to them.

------------------------------------------------------------------------

## Company

### Responsibilities

-   View its own organization information
-   Upload required documents
-   Provide product information
-   View audit status
-   View finalized reports
-   View audit history

Company users cannot:

-   Create government inspections
-   Assign inspectors
-   Modify regulatory rules
-   Change inspection findings
-   Finalize inspections
-   Access another company's data

------------------------------------------------------------------------

# AI and Compliance Approach

PackSure intentionally separates **AI assistance** from **formal compliance determination**.

## AI / Computer Vision Layer

Used for:

-   OCR
-   Text extraction
-   Label analysis
-   Declaration identification
-   Image processing
-   Supporting evidence review

## Rule Engine

Used for:

-   Applying regulatory requirements
-   Determining rule-check results
-   Identifying formal violations
-   Producing deterministic compliance outcomes

## Human Review

Used for:

-   Confirming extracted information
-   Reviewing evidence
-   Performing physical measurements
-   Validating findings
-   Signing inspection reports
-   Final government approval

This approach reduces the risk of treating an AI-generated interpretation as a legal decision.

------------------------------------------------------------------------

# Key Innovations

## Systemic Violation Intelligence

PackSure can analyze inspection findings across multiple products belonging to the same company/product line.

Instead of looking only at:

``` text
Product A → Violation
```

the system can identify patterns such as:

``` text
Product A → MRP declaration issue
Product B → MRP declaration issue
Product C → MRP declaration issue
Product D → MRP declaration issue
                    ↓
       Recurring Pattern Detected
                    ↓
       Potential Systemic Issue
```

The feature is intended to help Senior Officers identify recurring patterns and prioritize further review.

It does **not** automatically declare every related product non-compliant.

------------------------------------------------------------------------

## Regulatory Impact Simulator

Regulatory requirements can change over time.

The Regulatory Impact Simulator helps Admin/governance users understand the potential impact of a new rule version.

Conceptually:

``` text
New Rule / Rule Version
        ↓
Applicable Categories
        ↓
Potentially Affected Products
        ↓
Companies / Plants
        ↓
Upcoming Audits
        ↓
Reassessment Planning
```

The system identifies products and audits that may be affected by a regulatory change.

It does not automatically mark them as legally non-compliant solely because a future rule has been introduced.

------------------------------------------------------------------------

# Technology Stack

## Frontend

-   React
-   TypeScript
-   Tailwind CSS
-   Vite
-   TanStack Query
-   Zustand

## Backend

-   Python
-   Flask
-   Flask Blueprints
-   SQLAlchemy
-   Alembic / Flask-Migrate
-   JWT authentication
-   Password hashing / secure authentication components

## AI / Computer Vision

-   RapidOCR
-   OpenCV
-   NumPy

## Database

-   SQLite (Zero-Config Development & Hackathon Demo)
-   PostgreSQL (Enterprise Production Support via SQLAlchemy)

## Reporting

-   ReportLab
-   PDF report generation

## Development & Collaboration

-   Git
-   GitHub
-   VS Code

------------------------------------------------------------------------

# Project Architecture

PackSure follows a modular-monolith architecture.

``` text
                    ┌─────────────────────┐
                    │       React        │
                    │   TypeScript + UI  │
                    └──────────┬──────────┘
                               │
                              API
                               │
                    ┌──────────▼──────────┐
                    │       Flask        │
                    │   Backend / APIs   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   Inspection Logic      OCR / AI Layer       Rule Engine
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     SQLAlchemy      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ SQLite / PostgreSQL │
                    └─────────────────────┘
```

------------------------------------------------------------------------

# Inspection Lifecycle

The application uses workflow states to control the lifecycle of an inspection.

Typical states include:

``` text
DRAFT
   ↓
EVIDENCE_PENDING
   ↓
ANALYZING
   ↓
ANALYSIS_COMPLETE
   ↓
INSPECTOR_REVIEW
   ↓
SUBMITTED
   ↓
SENIOR_REVIEW
   ↓
 ┌───────────────┐
 │               │
RETURNED      FINALIZED
 │
 ↓
Correction
 │
 └────→ Re-submit
```

This allows the system to track where an inspection currently stands.

------------------------------------------------------------------------

# Compliance Analysis

A simplified analysis pipeline is:

``` text
Package Image
      ↓
OCR
      ↓
Extracted Text
      ↓
Declaration Detection
      ↓
Structured Declaration Data
      ↓
Applicable Rule Selection
      ↓
Rule Checks
      ↓
Compliance Result
      ↓
Violations + Evidence
```

The system can distinguish between information that was extracted automatically and information that has been reviewed or verified by the Inspector.

------------------------------------------------------------------------

# Evidence and Reporting

Evidence is associated with inspection activities rather than being
treated as unrelated files.

Evidence may include:

-   Front package image
-   Back package image
-   Additional images
-   Supporting documents
-   OCR output
-   Inspection measurements
-   Compliance findings

Reports can use this information to create a structured inspection record.

------------------------------------------------------------------------

# Security and Access Control

PackSure uses role-based access control and inspection ownership checks.

Security considerations include:

-   JWT-based authentication
-   Password hashing
-   Role-based authorization
-   Inspector ownership checks
-   Company-level data isolation
-   Restricted government/company operations
-   Audit logging
-   Protected review and finalization stages

Examples:

``` text
Company A
   ✕
Company B's Products

Inspector A
   ✕
Inspector B's Assigned Audit

Inspector
   ✕
Senior Officer Functions

Company
   ✕
Rule Book Modification
```

The goal is to prevent unauthorized access through both the UI and backend APIs.

------------------------------------------------------------------------

# Data Model

The application contains entities representing major inspection components, including:

-   Users
-   Manufacturers / Companies
-   Product Categories
-   Products
-   Inspection Cases
-   Package Evidences
-   OCR Detections
-   Declarations
-   Regulatory Rules
-   Rule Category Mappings
-   Compliance Checks
-   Violations
-   Inspector Reviews
-   Senior Reviews
-   Inspection Reports
-   Audit Logs

These entities allow the system to connect regulatory rules, products, inspections, evidence and final reports.

------------------------------------------------------------------------

# Repository Structure

A simplified structure is:

``` text
PackSure/
├── client/
│   ├── public/
│   │   └── samples/
│   └── src/
│       ├── components/
│       ├── portals/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── company/
│       │   ├── inspector/
│       │   └── senior_officer/
│       ├── services/
│       │   └── api.ts
│       ├── state/
│       └── types/
│
├── server/
│   ├── blueprints/
│   │   ├── admin_bp.py
│   │   ├── analytics_bp.py
│   │   ├── auth_bp.py
│   │   ├── company_bp.py
│   │   ├── inspections_bp.py
│   │   ├── products_bp.py
│   │   ├── reports_bp.py
│   │   ├── reviews_bp.py
│   │   └── rules_bp.py
│   ├── models/
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── impact_simulator_service.py
│   │   ├── ocr_service.py
│   │   ├── report_generator.py
│   │   ├── rule_engine.py
│   │   ├── systemic_intelligence_service.py
│   │   └── vision_analyzer.py
│   ├── app.py
│   ├── config.py
│   ├── migrate_database.py
│   └── seed_statutory_rules.py
│
├── sample_test_labels/
├── .env.example
└── README.md
```

The exact repository structure may evolve as implementation continues.

------------------------------------------------------------------------

# Rule Versioning

Regulatory rules are maintained with version and applicability information.

This is important because a regulation may have:

-   Original provisions
-   Amendments
-   Future amendments
-   Effective dates
-   Category-specific applicability

PackSure should determine the applicable rule version based on the relevant effective date and inspection context.

Historical inspection records should preserve the rule context used when the inspection was performed.

### Important

The existence of a newly published or future-dated rule does not automatically mean that the rule is currently applicable.

The system therefore treats regulatory changes using effective-date-aware logic.

------------------------------------------------------------------------

# Important Design Principles

## 1. Human-in-the-Loop

PackSure is an inspection assistance platform.

AI output should be reviewed where appropriate, especially when OCR confidence is low or evidence is ambiguous.

------------------------------------------------------------------------

## 2. Deterministic Compliance Logic

Formal compliance checks are handled by the rule engine rather than relying on an LLM to make legal decisions.

------------------------------------------------------------------------

## 3. Evidence-Backed Findings

Compliance findings should be traceable to:

-   Package evidence
-   Extracted declarations
-   Physical measurements
-   Applicable rules
-   Inspector observations

------------------------------------------------------------------------

## 4. Historical Integrity

Inspection results should preserve the context in which they were created, including relevant regulatory rule versions and evidence.

------------------------------------------------------------------------

## 5. Least-Privilege Access

Every user should receive only the permissions required for their role.

------------------------------------------------------------------------

## 6. Company Data Isolation

Company users should only be able to access information belonging to their organization.

------------------------------------------------------------------------

## 7. No Automatic Legal Judgment

PackSure provides technology-assisted compliance analysis.

It does not replace the authority of an authorized Legal Metrology officer or constitute legal certification merely because the system reports a compliant result.

------------------------------------------------------------------------

# Limitations and Scope

PackSure is an evolving hackathon implementation and should be evaluated accordingly.

Some capabilities may require further validation before production or government deployment, including:

-   OCR accuracy across diverse package designs
-   Multiple Indian languages and scripts
-   Challenging image conditions
-   Precise physical measurement workflows
-   Calibration of measurement devices
-   Complete regulatory coverage
-   Legal interpretation of complex edge cases
-   Production infrastructure and scalability
-   Formal security auditing
-   Government system integration
-   Long-term regulatory maintenance

OCR and AI results should not be treated as infallible.

------------------------------------------------------------------------

# Future Enhancements

Potential future development areas include:

## Advanced Product Identification

Improve image-based product identification beyond barcode/manual identification using robust visual matching.

## Package Change Detection

Compare package versions across inspections to identify meaningful changes in labels, declarations or packaging.

## Improved Capture Quality

Provide stronger guidance and automated checks for:

-   Blur
-   Glare
-   Poor lighting
-   Obstruction
-   Incorrect framing
-   Unreadable declarations

## Broader Regulatory Coverage

Expand and maintain the rule library across additional applicable provisions and product categories.

## Advanced Analytics

Add deeper analytics for:

-   Recurring violations
-   Product categories
-   Companies
-   Geographic trends
-   Inspection outcomes

## Government System Integration

Potential integration with relevant government Legal Metrology systems where appropriate APIs and authorization are available.

------------------------------------------------------------------------

# Project Status

PackSure currently provides an integrated prototype covering the major inspection lifecycle:

``` text
Authentication
      ↓
Role-Based Access
      ↓
Master Data
      ↓
Rule Management
      ↓
Audit Scheduling
      ↓
Company Documents
      ↓
Inspector Inspection
      ↓
Package Evidence
      ↓
OCR / AI Analysis
      ↓
Rule Engine
      ↓
Compliance Findings
      ↓
Inspector Review
      ↓
Senior Review
      ↓
Finalization
      ↓
PDF Report
      ↓
Audit History
```

The project also includes the two major innovation concepts:

-   Systemic Violation Intelligence
-   Regulatory Impact Simulator

The system should be considered a **hackathon prototype**, not a legally certified inspection authority or a substitute for official regulatory judgment.

------------------------------------------------------------------------

# Team / Hackathon

## Smart India Hackathon 2026

**Problem Statement:** SIH26034

**Domain:** Software

**Theme:** Legal Metrology / Consumer Protection

**Project:** PackSure

**Objective:** Build a technology-assisted system for checking compliance of packaged commodities through product information, package images, OCR, rule-based analysis and evidence-backed inspection reporting.

------------------------------------------------------------------------

## PackSure

**Legal Metrology Compliance Platform**

**Compliance Today \| Safer Tomorrow**

Built for **Smart India Hackathon 2026 --- SIH26034**.
