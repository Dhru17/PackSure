import sys
sys.path.append('server')
from services.ocr_service import OCRService

panels = [{'panel_name': 'Front Face', 'image_path': 'sample_test_labels/compliant_sample.jpg'}]
structured, blocks, ocr_success = OCRService.extract_from_multi_panels(panels)

print("=" * 60)
print(f"OCR SUCCESS: {ocr_success}")
print(f"RAW OCR BLOCKS DETECTED: {len(blocks)}")
print("=" * 60)

print("\n--- 1. DETECTED TEXT LINES & CONFIDENCE ---")
for i, b in enumerate(blocks, 1):
    print(f"{i:2d}. {b['text']} (conf: {b['confidence']:.2f})")

print("\n--- 2. STRUCTURED LEGAL METROLOGY FIELDS ---")
for k, v in structured.items():
    val = v.get('value')
    if val:
        print(f" • {k:<28}: {val}")
