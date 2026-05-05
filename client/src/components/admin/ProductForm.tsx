'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, UploadCloud, X, ImageOff, Star, AlertCircle } from 'lucide-react';

export interface ProductFormData {
  name:           string;
  brand:          string;
  category:       string;
  description:    string;
  price:          string;
  mrp:            string;
  stock:          string;
  isFeatured:     boolean;
  files:          File[];       // newly selected files to upload
  existingImages: string[];     // already-stored paths (edit mode)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Category = any;

interface Props {
  initial?:    Partial<ProductFormData>;
  onSubmit:    (data: ProductFormData) => Promise<void>;
  submitLabel: string;
  loading:     boolean;
  error:       string;
}

const EMPTY: ProductFormData = {
  name: '', brand: '', category: '', description: '',
  price: '', mrp: '', stock: '0',
  isFeatured: false, files: [], existingImages: [],
};

const MAX_FILE_SIZE  = 15 * 1024 * 1024;   // 15 MB
const MAX_FILE_COUNT = 5;
const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT    = /\.(jpe?g|png|webp|gif)$/i;

const inp = (hasErr: boolean) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg outline-none
   focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all
   placeholder:text-gray-400
   ${hasErr ? 'border-red-400 bg-red-50' : 'border-gray-300'}`;

function FieldError({ msg }: { msg?: string }) {
  return msg
    ? <p className="flex items-center gap-1 text-xs text-red-500 mt-1"><AlertCircle size={11} />{msg}</p>
    : null;
}

export default function ProductForm({ initial, onSubmit, submitLabel, loading, error }: Props) {
  const [form,       setForm]       = useState<ProductFormData>({ ...EMPTY, ...initial });
  const [errors,     setErrors]     = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [previews,   setPreviews]   = useState<string[]>([]);   // object URLs for new files
  const [fileError,  setFileError]  = useState('');
  const [dragOver,   setDragOver]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial values when they arrive (edit page async load)
  useEffect(() => {
    if (initial) setForm(f => ({ ...f, ...initial }));
  }, [initial]);

  // Fetch categories
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  // Revoke stale object URLs on unmount
  useEffect(() => () => { previews.forEach(URL.revokeObjectURL); }, []); // eslint-disable-line

  // ── Field helpers ─────────────────────────────────────────────────────────

  function set<K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  // ── File handling ─────────────────────────────────────────────────────────

  function addFiles(rawFiles: FileList | File[]) {
    setFileError('');
    const incoming = Array.from(rawFiles);
    const total    = form.files.length + incoming.length;

    if (total > MAX_FILE_COUNT) {
      setFileError(`Maximum ${MAX_FILE_COUNT} images allowed`);
      return;
    }

    const rejected: string[] = [];
    const accepted: File[]   = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.test(file.name)) {
        rejected.push(`${file.name} — unsupported format`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} — exceeds 15 MB limit`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length) {
      setFileError(rejected.join('; '));
    }

    if (!accepted.length) return;

    const newPreviews = accepted.map(f => URL.createObjectURL(f));
    setPreviews(p => [...p, ...newPreviews]);
    setForm(f => ({ ...f, files: [...f.files, ...accepted] }));
  }

  function removeNewFile(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setPreviews(p => p.filter((_, i) => i !== idx));
    setForm(f => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  }

  function removeExistingImage(path: string) {
    setForm(f => ({ ...f, existingImages: f.existingImages.filter(p => p !== path) }));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';   // allow re-selecting same file
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const e: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.name.trim())                              e.name     = 'Product name is required';
    if (!form.price)                                    e.price    = 'Price is required';
    else if (isNaN(+form.price) || +form.price <= 0)   e.price    = 'Enter a valid price';
    if (!form.mrp)                                      e.mrp      = 'MRP is required';
    else if (isNaN(+form.mrp)   || +form.mrp   <= 0)   e.mrp      = 'Enter a valid MRP';
    if (+form.mrp < +form.price)                        e.mrp      = 'MRP must be ≥ selling price';
    if (!form.category)                                 e.category = 'Please select a category';
    if (form.stock && isNaN(+form.stock))               e.stock    = 'Stock must be a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate() || loading) return;
    await onSubmit(form);
  }

  const totalImages = form.existingImages.length + form.files.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* API error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                        rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Samsung Galaxy S24 Ultra"
              className={inp(!!errors.name)} />
            <FieldError msg={errors.name} />
          </div>

          {/* Brand + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
              <input type="text" value={form.brand}
                onChange={e => set('brand', e.target.value)}
                placeholder="e.g. Samsung" className={inp(false)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              {catLoading ? (
                <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Loading categories…
                </div>
              ) : (
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className={inp(!!errors.category) + ' bg-white ' +
                    (!form.category ? 'text-gray-400' : 'text-gray-800')}>
                  <option value="">Select category</option>
                  {categories.map((c: Category) =>
                    <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              )}
              <FieldError msg={errors.category} />
              {categories.length === 0 && !catLoading && (
                <p className="text-xs text-amber-600 mt-1">No categories — run seed.js first.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea rows={4} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Product features, specifications, highlights…"
              className={inp(false) + ' resize-none'} />
          </div>

          {/* Price + MRP + Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0" value={form.price}
                onChange={e => set('price', e.target.value)}
                placeholder="0" className={inp(!!errors.price)} />
              <FieldError msg={errors.price} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                MRP (₹) <span className="text-red-500">*</span>
              </label>
              <input type="number" min="0" value={form.mrp}
                onChange={e => set('mrp', e.target.value)}
                placeholder="0" className={inp(!!errors.mrp)} />
              <FieldError msg={errors.mrp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
              <input type="number" min="0" value={form.stock}
                onChange={e => set('stock', e.target.value)}
                placeholder="0" className={inp(!!errors.stock)} />
              <FieldError msg={errors.stock} />
            </div>
          </div>

          {/* Discount preview */}
          {form.price && form.mrp && +form.mrp > +form.price && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Discount: {Math.round(((+form.mrp - +form.price) / +form.mrp) * 100)}% off
            </p>
          )}

          {/* Featured toggle */}
          <div className="flex items-center gap-3 cursor-pointer w-fit"
            onClick={() => set('isFeatured', !form.isFeatured)}>
            <div className={`relative rounded-full transition-colors duration-200
                            ${form.isFeatured ? 'bg-primary' : 'bg-gray-300'}`}
              style={{ width: 40, height: 22 }}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow
                                transition-all duration-200
                                ${form.isFeatured ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Star size={13}
                className={form.isFeatured ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400'} />
              Mark as Featured
            </span>
          </div>
        </div>

        {/* ── Right column: image upload ───────────────────────────── */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">
                Product Images
                <span className="font-normal text-gray-400 ml-1">
                  ({totalImages}/{MAX_FILE_COUNT} max)
                </span>
              </label>
              {totalImages > 0 && (
                <span className="text-[10px] text-gray-400">First = primary</span>
              )}
            </div>

            {/* Drag-and-drop zone */}
            {totalImages < MAX_FILE_COUNT && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true);  }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2
                            border-dashed cursor-pointer transition-colors py-8
                            ${dragOver
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}
              >
                <UploadCloud size={28} className={dragOver ? 'text-primary' : 'text-gray-400'} />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">
                    {dragOver ? 'Drop images here' : 'Click or drag & drop'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    JPG, PNG, WebP, GIF · max 15 MB each
                  </p>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={onInputChange}
            />

            {/* File error */}
            {fileError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-red-500">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Existing images (edit mode) */}
          {form.existingImages.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Saved Images
              </p>
              <div className="grid grid-cols-3 gap-2">
                {form.existingImages.map((src, i) => (
                  <div key={src} className="relative group rounded-lg overflow-hidden
                                            border border-gray-200 bg-gray-50 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`img${i}`}
                      className="w-full h-full object-contain p-1" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-primary
                                       text-white px-1.5 py-0.5 rounded-full">PRIMARY</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(src)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white
                                 rounded-full flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file previews */}
          {previews.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                New Uploads
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={src} className="relative group rounded-lg overflow-hidden
                                            border border-blue-200 bg-blue-50 aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`new${i}`}
                      className="w-full h-full object-contain p-1" />
                    {form.existingImages.length === 0 && i === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-primary
                                       text-white px-1.5 py-0.5 rounded-full">PRIMARY</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white
                                 rounded-full flex items-center justify-center
                                 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white
                                    text-[8px] truncate px-1 py-0.5 text-center">
                      {form.files[i]?.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty placeholder */}
          {totalImages === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 aspect-square
                            flex flex-col items-center justify-center gap-2 text-gray-300">
              <ImageOff size={36} />
              <span className="text-xs">No images yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold
                     px-6 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-sm
                     disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900
                     border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
