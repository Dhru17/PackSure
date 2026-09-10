import React, { useState } from 'react';
import type { Product } from '../../../../types';
import { api } from '../../../../services/api';
import { 
  Barcode, 
  Camera, 
  Search, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Scan,
  Upload,
  RefreshCw,
  RotateCcw,
  FileEdit,
  Plus
} from 'lucide-react';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface Step1ProductProps {
  products: Product[];
  initialProductForm: {
    brand_name: string;
    commodity_name: string;
    category_name?: string;
    package_type: string;
    default_net_quantity: string;
    default_mrp: number;
    is_imported: boolean;
    country_of_origin: string;
    pdp_width_cm: number;
    pdp_height_cm: number;
    pdp_area_cm2: number;
    manufacturer_name?: string;
  };
  barcodeInput: string;
  setBarcodeInput: (val: string) => void;
  onContinue: (formData: any, barcode: string) => void;
  onCancel: () => void;
}

export const Step1Product: React.FC<Step1ProductProps> = ({
  products,
  initialProductForm,
  barcodeInput,
  setBarcodeInput,
  onContinue,
  onCancel
}) => {
  const [method, setMethod] = useState<'barcode' | 'image' | 'select' | 'manual'>('barcode');
  const [productForm, setProductForm] = useState(initialProductForm);
  const [isFoundProduct, setIsFoundProduct] = useState<boolean | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isLiveScannerOpen, setIsLiveScannerOpen] = useState(false);
  const [scannerNotice, setScannerNotice] = useState<string | null>(null);

  // Trigger manual entry mode for new products
  const handleManualProductEntry = () => {
    setIsFoundProduct(false);
    setScannerNotice('New product — Add details manually');
    setMethod('manual');
  };

  // Barcode Lookup with specific string or input state
  const handleBarcodeLookupWith = async (barcodeVal?: string) => {
    const target = (barcodeVal !== undefined ? barcodeVal : barcodeInput).trim();
    if (!target) return;
    setIsSearching(true);
    setScannerNotice(null);
    try {
      const res = await api.lookupBarcode(target);
      if (res.found && res.product) {
        setProductForm({
          brand_name: res.product.brand_name || '',
          commodity_name: res.product.commodity_name || '',
          category_name: res.product.category_name || 'General Packaged Commodity',
          package_type: res.product.package_type || 'BOX',
          default_net_quantity: res.product.default_net_quantity || '',
          default_mrp: res.product.default_mrp || 0,
          is_imported: res.product.is_imported || false,
          country_of_origin: res.product.country_of_origin || 'India',
          pdp_width_cm: res.product.pdp_width_cm || 10,
          pdp_height_cm: res.product.pdp_height_cm || 10,
          pdp_area_cm2: res.product.pdp_area_cm2 || 100,
          manufacturer_name: res.product.manufacturer_name || 'Registered Manufacturer'
        });
        setIsFoundProduct(true);
        setScannerNotice(`Product identified from catalog: ${res.product.brand_name} — ${res.product.commodity_name}`);
      } else {
        setIsFoundProduct(false);
        setScannerNotice(`New product — Add details manually (Barcode: ${target})`);
      }
    } catch {
      setIsFoundProduct(false);
      setScannerNotice(`New product — Add details manually (Barcode: ${target})`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarcodeLookup = () => handleBarcodeLookupWith();

  // Select existing product from catalog
  const handleSelectExisting = (prod: Product) => {
    setProductForm({
      brand_name: prod.brand_name || '',
      commodity_name: prod.commodity_name || '',
      category_name: prod.category_name || 'General Packaged Commodity',
      package_type: prod.package_type || 'BOX',
      default_net_quantity: prod.default_net_quantity || '',
      default_mrp: prod.default_mrp || 0,
      is_imported: prod.is_imported || false,
      country_of_origin: prod.country_of_origin || 'India',
      pdp_width_cm: prod.pdp_width_cm || 10,
      pdp_height_cm: prod.pdp_height_cm || 10,
      pdp_area_cm2: prod.pdp_area_cm2 || 100,
      manufacturer_name: prod.manufacturer_name || 'Registered Manufacturer'
    });
    setBarcodeInput(prod.barcode || '');
    setIsFoundProduct(true);
  };

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [imageAnalysisMessage, setImageAnalysisMessage] = useState<string | null>(null);
  const [imageDetectedTokens, setImageDetectedTokens] = useState<string[]>([]);

  // Real AI OCR & Barcode Image identification
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Local thumbnail preview
    const previewUrl = URL.createObjectURL(file);
    setCapturedImagePreview(previewUrl);
    setIsAnalyzingImage(true);
    setImageAnalysisMessage(null);
    setImageDetectedTokens([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.identifyProductFromImage(formData);

      if (res && res.extracted_fields) {
        setProductForm(prev => ({
          ...prev,
          brand_name: res.extracted_fields.brand_name || prev.brand_name,
          commodity_name: res.extracted_fields.commodity_name || prev.commodity_name,
          category_name: res.extracted_fields.category_name || prev.category_name,
          package_type: res.extracted_fields.package_type || prev.package_type,
          default_net_quantity: res.extracted_fields.default_net_quantity || prev.default_net_quantity,
          default_mrp: res.extracted_fields.default_mrp || prev.default_mrp,
          is_imported: res.extracted_fields.is_imported ?? prev.is_imported,
          country_of_origin: res.extracted_fields.country_of_origin || prev.country_of_origin,
          pdp_width_cm: res.extracted_fields.pdp_width_cm || prev.pdp_width_cm,
          pdp_height_cm: res.extracted_fields.pdp_height_cm || prev.pdp_height_cm,
          pdp_area_cm2: res.extracted_fields.pdp_area_cm2 || prev.pdp_area_cm2,
          manufacturer_name: res.extracted_fields.manufacturer_name || prev.manufacturer_name
        }));

        if (res.barcode) {
          setBarcodeInput(res.barcode);
        }

        setIsFoundProduct(res.found);
        setImageAnalysisMessage(res.message || (res.found ? 'Matched catalog product' : 'Extracted packaging details via AI OCR'));
        if (res.detected_texts) {
          setImageDetectedTokens(res.detected_texts);
        }
      }
    } catch (err: any) {
      console.error('Image identification error:', err);
      setImageAnalysisMessage('Could not analyze image via AI OCR. Pre-fill details manually.');
      setIsFoundProduct(false);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const isFormValid = Boolean(
    productForm.commodity_name.trim() && productForm.brand_name.trim()
  );

  return (
    <div className="bg-white border border-[#D8DDE3] rounded-2xl p-6 sm:p-8 shadow-xs space-y-8">
      {/* Header & Purpose */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <h2 className="text-lg font-bold text-[#1E293B] tracking-tight flex items-center gap-2.5">
          <Package className="w-5 h-5 text-[#174A7E]" />
          <span>Identify Packaged Commodity</span>
        </h2>
        <p className="text-xs text-[#64748B] mt-1 font-medium">
          Identify the product to be inspected via barcode scan, image capture, or by selecting from the catalog.
        </p>
      </div>

      {/* 4 Practical Identification Options */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
          Choose Identification Method
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Method 1: Scan Barcode */}
          <button
            type="button"
            onClick={() => setMethod('barcode')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
              method === 'barcode'
                ? 'bg-[#EBF3FA] border-[#174A7E] shadow-xs'
                : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${method === 'barcode' ? 'bg-[#174A7E] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1]'}`}>
                <Barcode className="w-5 h-5" />
              </div>
              {method === 'barcode' && <span className="w-2 h-2 rounded-full bg-[#174A7E]" />}
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">Scan Barcode</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Scan or enter EAN-13 / GTIN barcode</div>
            </div>
          </button>

          {/* Method 2: Capture Image */}
          <button
            type="button"
            onClick={() => setMethod('image')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
              method === 'image'
                ? 'bg-[#EBF3FA] border-[#174A7E] shadow-xs'
                : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${method === 'image' ? 'bg-[#174A7E] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1]'}`}>
                <Camera className="w-5 h-5" />
              </div>
              {method === 'image' && <span className="w-2 h-2 rounded-full bg-[#174A7E]" />}
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">Capture Image</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">AI RapidOCR extraction from photo</div>
            </div>
          </button>

          {/* Method 3: Select Existing */}
          <button
            type="button"
            onClick={() => setMethod('select')}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
              method === 'select'
                ? 'bg-[#EBF3FA] border-[#174A7E] shadow-xs'
                : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${method === 'select' ? 'bg-[#174A7E] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1]'}`}>
                <Search className="w-5 h-5" />
              </div>
              {method === 'select' && <span className="w-2 h-2 rounded-full bg-[#174A7E]" />}
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">Select Existing</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">Choose from registered database</div>
            </div>
          </button>

          {/* Method 4: Add Manually (New Product) */}
          <button
            type="button"
            onClick={handleManualProductEntry}
            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
              method === 'manual'
                ? 'bg-[#EBF3FA] border-[#174A7E] shadow-xs'
                : 'bg-[#F8FAFC] border-[#CBD5E1] hover:bg-white hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${method === 'manual' ? 'bg-[#174A7E] text-white' : 'bg-white text-[#64748B] border border-[#CBD5E1]'}`}>
                <FileEdit className="w-5 h-5" />
              </div>
              {method === 'manual' && <span className="w-2 h-2 rounded-full bg-[#174A7E]" />}
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E293B]">Add Manually</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">New product without scan</div>
            </div>
          </button>
        </div>
      </div>

      {/* Input Action Controls based on selected method */}
      <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
        {method === 'barcode' && (
          <div className="space-y-3">
            {/* Live Camera Scanner Launcher Banner */}
            <div className="p-4 bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFC] to-[#F0FDF4] border border-[#BFDBFE] rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#174A7E] text-white shadow-xs">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
                    <span>Live Camera Barcode Scanner</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Phone & Webcam
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Scan EAN-13 / GTIN barcodes in real time using phone camera or laptop webcam
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLiveScannerOpen(true)}
                className="px-4 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera Scanner</span>
              </button>
            </div>

            {scannerNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>{scannerNotice}</span>
              </div>
            )}

            {/* Manual input fallback */}
            <div className="pt-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                Or enter 13-digit barcode manually:
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter or scan 13-digit barcode (e.g. 8901030914101)..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-mono font-bold text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleBarcodeLookup}
                  disabled={isSearching || !barcodeInput.trim()}
                  className="px-5 py-2 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? 'Looking up...' : 'Lookup Product'}
                </button>
              </div>

              {/* Quick demo sample buttons and manual entry shortcut */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#64748B] font-semibold">Demo Samples:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('8901063012345');
                    handleBarcodeLookupWith('8901063012345');
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#1E293B] cursor-pointer transition"
                  title="Britannia Good Day Butter Cookies"
                >
                  8901063012345 (Good Day)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('8901719129926');
                    handleBarcodeLookupWith('8901719129926');
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#1E293B] cursor-pointer transition"
                  title="Parle-G Biscuits"
                >
                  8901719129926 (Parle-G)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('8906009076843');
                    handleBarcodeLookupWith('8906009076843');
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#1E293B] cursor-pointer transition"
                  title="Unibic Cookies"
                >
                  8906009076843 (Unibic)
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleManualProductEntry}
                  className="text-xs font-bold text-[#174A7E] hover:text-[#133E68] flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#174A7E]" />
                  <span>Can't scan or new product? Add details manually</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {method === 'image' && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#1E293B] flex items-center gap-2">
                  <span>AI Visual Product Identification</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                    RapidOCR + Barcode
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Capture or upload a photo of the package front. AI analyzes packaging text to auto-fill Brand, Commodity, Net Quantity, and MRP.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Take Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    disabled={isAnalyzingImage}
                    className="hidden"
                  />
                </label>

                <label className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#174A7E] font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageCapture}
                    disabled={isAnalyzingImage}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Analyzing Loading State */}
            {isAnalyzingImage && (
              <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-center gap-3 text-xs text-[#174A7E] font-bold animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin text-[#174A7E]" />
                <span>Running RapidOCR & Barcode Detection on package front image...</span>
              </div>
            )}

            {/* Image Preview & Results Card */}
            {capturedImagePreview && !isAnalyzingImage && (
              <div className="p-4 bg-white border border-[#CBD5E1] rounded-xl flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#CBD5E1] bg-slate-100 flex-shrink-0">
                  <img
                    src={capturedImagePreview}
                    alt="Captured Front"
                    className="w-full h-full object-contain bg-white"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] text-center py-0.5 font-bold">
                    Captured Front
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-xs w-full">
                  {imageAnalysisMessage && (
                    <div className={`p-2.5 rounded-lg border flex items-center gap-2 font-medium ${
                      isFoundProduct
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {isFoundProduct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                      <span>{imageAnalysisMessage}</span>
                    </div>
                  )}

                  {imageDetectedTokens && imageDetectedTokens.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
                        Detected Text on Package:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {imageDetectedTokens.slice(0, 6).map((tok, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] rounded-md text-[10px] font-mono"
                          >
                            {tok}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <label className="px-3.5 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#174A7E] hover:bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg cursor-pointer transition flex items-center gap-1.5 flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageCapture}
                    disabled={isAnalyzingImage}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {method === 'select' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type to filter registered products by name or brand..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B] focus:outline-none focus:border-[#174A7E]"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border border-[#CBD5E1] rounded-lg bg-white divide-y divide-[#E2E8F0]">
              {products
                .filter(p => !productSearchQuery || p.commodity_name.toLowerCase().includes(productSearchQuery.toLowerCase()) || p.brand_name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                .slice(0, 5)
                .map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectExisting(prod)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#F8FAFC] flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <span className="font-bold text-[#1E293B]">{prod.commodity_name}</span>
                      <span className="text-[#64748B] ml-2 font-normal">({prod.brand_name})</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#174A7E] font-bold">{prod.barcode || 'NO BARCODE'}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {method === 'manual' && (
          <div className="space-y-3">
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-amber-950">New Product &mdash; Add details manually</div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Enter product commodity name, brand name, barcode, declared quantity, and MRP directly below. Once required details are provided, click "Continue to Evidence" to proceed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Alert Banner when Barcode / Product is New or Unregistered */}
      {(isFoundProduct === false || method === 'manual') && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950 text-xs">New Product &mdash; Add details manually</div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {barcodeInput.trim() 
                  ? `Barcode '${barcodeInput}' is not registered in the catalog. Enter specifications below to continue.`
                  : 'Enter commodity name, brand, quantity, and dimensions below to proceed.'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-200 text-amber-900 flex-shrink-0">
            Manual Entry
          </span>
        </div>
      )}

      {/* Product Information Card (Editable) */}
      <div className="bg-[#F8FAFC] rounded-xl border border-[#D8DDE3] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
              Product Specifications & Dimensions
            </h3>
            {isFoundProduct === true && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#DCFCE7] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Product found</span>
              </span>
            )}
            {isFoundProduct === false && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>New product</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#64748B]">You can adjust details if needed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#475569] mb-1">Commodity Name *</label>
            <input
              type="text"
              value={productForm.commodity_name}
              onChange={(e) => setProductForm({ ...productForm, commodity_name: e.target.value })}
              placeholder="e.g. Good Day Butter Cookies"
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] mb-1">Brand Name *</label>
            <input
              type="text"
              value={productForm.brand_name}
              onChange={(e) => setProductForm({ ...productForm, brand_name: e.target.value })}
              placeholder="e.g. Britannia"
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] font-semibold focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] mb-1">Product Category</label>
            <input
              type="text"
              value={productForm.category_name || 'General Packaged Commodity'}
              onChange={(e) => setProductForm({ ...productForm, category_name: e.target.value })}
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] mb-1">Manufacturer / Packer</label>
            <input
              type="text"
              value={productForm.manufacturer_name || ''}
              onChange={(e) => setProductForm({ ...productForm, manufacturer_name: e.target.value })}
              placeholder="e.g. Britannia Industries Ltd."
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] mb-1">Barcode</label>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 8901030914101"
              className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 font-mono font-bold text-[#1E293B] focus:border-[#174A7E]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#475569] mb-1">Package Quantity / Declared MRP</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={productForm.default_net_quantity}
                onChange={(e) => setProductForm({ ...productForm, default_net_quantity: e.target.value })}
                placeholder="200 g"
                className="w-1/2 bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] focus:border-[#174A7E]"
              />
              <input
                type="number"
                value={productForm.default_mrp || ''}
                onChange={(e) => setProductForm({ ...productForm, default_mrp: parseFloat(e.target.value) || 0 })}
                placeholder="₹ MRP"
                className="w-1/2 bg-white border border-[#CBD5E1] rounded-lg px-3 py-2 text-[#1E293B] focus:border-[#174A7E]"
              />
            </div>
          </div>
        </div>

        {/* Schedule II PDP Calibration */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#174A7E]" />
              <span>Principal Display Panel (PDP) Dimensions &bull; Schedule II</span>
            </span>
            <span className="text-[11px] text-[#64748B]">Used to evaluate mandatory font height</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[#64748B] mb-1">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={productForm.pdp_height_cm}
                onChange={(e) => {
                  const h = parseFloat(e.target.value) || 0;
                  setProductForm({ ...productForm, pdp_height_cm: h, pdp_area_cm2: h * productForm.pdp_width_cm });
                }}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-[#1E293B]"
              />
            </div>
            <div>
              <label className="block text-[#64748B] mb-1">Width (cm)</label>
              <input
                type="number"
                step="0.1"
                value={productForm.pdp_width_cm}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  setProductForm({ ...productForm, pdp_width_cm: w, pdp_area_cm2: w * productForm.pdp_height_cm });
                }}
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-[#1E293B]"
              />
            </div>
            <div>
              <label className="block text-[#64748B] mb-1">PDP Area (cm²)</label>
              <div className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg px-3 py-1.5 text-[#1E293B] font-bold">
                {productForm.pdp_area_cm2.toFixed(1)} cm²
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] font-bold rounded-lg text-xs transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() => onContinue(productForm, barcodeInput)}
          disabled={!isFormValid}
          className="px-6 py-2.5 bg-[#174A7E] hover:bg-[#133E68] text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span>Continue to Evidence</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Live Camera Barcode Scanner Modal */}
      {isLiveScannerOpen && (
        <LiveBarcodeScanner
          onScanSuccess={(scannedCode) => {
            setIsLiveScannerOpen(false);
            setBarcodeInput(scannedCode);
            handleBarcodeLookupWith(scannedCode);
          }}
          onManualEntry={() => {
            setIsLiveScannerOpen(false);
            handleManualProductEntry();
          }}
          onClose={() => setIsLiveScannerOpen(false)}
        />
      )}
    </div>
  );
};
