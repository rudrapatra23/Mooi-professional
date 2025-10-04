'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";

export default function EditProductPage({ params }) {
  const productId = params?.id;
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [existingImages, setExistingImages] = useState([]); // existing base64/url
  const [newFiles, setNewFiles] = useState([]); // File objects
  const [previewNew, setPreviewNew] = useState([]); // dataURL previews

  useEffect(() => {
    if (!isLoaded) return;
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  async function fetchProduct() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/store/product?productId=${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const p = data?.product;
      if (!p) {
        setError("Product not found");
        setProduct(null);
        setLoading(false);
        return;
      }
      setProduct(p);
      setName(p.name ?? "");
      setDescription(p.description ?? "");
      setMrp(p.mrp ?? "");
      setPrice(p.price ?? "");
      setCategory(p.category ?? "");
      setStock(p.stock ?? "");
      setExistingImages(Array.isArray(p.images) ? p.images : []);
    } catch (err) {
      console.error("fetch product error:", err);
      setError(err?.response?.data?.error || err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  function onFilesChange(e) {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);

    // create previews
    const readers = files.map(file => {
      return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(results => setPreviewNew(results)).catch(() => setPreviewNew([]));
  }

  // fallback navigation: try history.back, else go to the manage page path you actually have
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/admin/manage-product"); // <-- ensure this matches your folder name
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("name", name);
      form.append("description", description);
      form.append("mrp", String(mrp || 0));
      form.append("price", String(price || 0));
      form.append("category", category);
      form.append("stock", String(stock || 0));

      for (const f of newFiles) {
        form.append("images", f);
      }

      const res = await axios.put(`/api/store/product?productId=${productId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product updated");

      // Clear any client cache/state if needed, then navigate
      // Use replace() to avoid keeping edit page in history
      router.replace("/admin/manage-product");
    } catch (err) {
      console.error("update product error:", err);
      toast.error(err?.response?.data?.error || err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <button onClick={goBack} className="text-sm underline">Back</button>
      </div>

      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full border rounded p-2" rows={4} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">MRP</label>
            <input type="number" value={mrp} onChange={e => setMrp(e.target.value)} className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Price</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Stock</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="mt-1 w-full border rounded p-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Category</label>
          <input value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Existing Images</label>
          <div className="flex gap-2 flex-wrap">
            {existingImages?.length === 0 && <div className="text-sm text-gray-500">No images</div>}
            {existingImages?.map((src, idx) => (
              <img key={idx} src={src} alt={`img-${idx}`} className="w-24 h-24 object-cover rounded border" />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload New Images (optional — will replace existing)</label>
          <input type="file" multiple accept="image/*" onChange={onFilesChange} />
          <div className="mt-2 flex gap-2 flex-wrap">
            {previewNew.map((p, i) => (
              <img key={i} src={p} alt={`preview-${i}`} className="w-24 h-24 object-cover rounded border" />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={goBack} className="px-6 mt-7 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
