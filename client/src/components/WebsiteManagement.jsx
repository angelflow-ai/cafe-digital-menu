import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Eye, FileText, ImageIcon, Link2, Plus, Save, Trash2, Upload, VideoIcon } from "lucide-react";
import { api } from "../services/apiClient";
import { createEmptyWebsiteContent, normalizeWebsiteContentPayload } from "../services/websiteContentService";

const INITIAL_ITEM = { title: "", description: "", image: "", icon: "" };
const INITIAL_REVIEW = { name: "", review: "", rating: 5, videoUrl: "", customerImage: "" };
const INITIAL_MEDIA = { type: "image", url: "", title: "" };
const INITIAL_VIDEO = { title: "", url: "", description: "" };
const INITIAL_VISUAL = { title: "", description: "", videoUrl: "", thumbnail: "" };

function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-black text-stone-950">{title}</h3>
        {description && <p className="mt-1 text-sm font-semibold text-stone-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function FieldInput({ value, onChange, placeholder, type = "text", className = "", ...props }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none ring-0 focus:border-stone-400 ${className}`} {...props} />;
}

function FieldTextarea({ value, onChange, placeholder, rows = 4, className = "" }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-800 outline-none focus:border-stone-400 ${className}`} />;
}

function PreviewCard({ title, description }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-stone-500">Preview</p>
      <h4 className="mt-2 text-lg font-black text-stone-950">{title || "Untitled"}</h4>
      <p className="mt-1 text-sm font-semibold text-stone-600">{description || "No description yet."}</p>
    </div>
  );
}

export default function WebsiteManagement({ outletSlug = "", outletId = "", selectedOutletFilter = "all" }) {
  const [content, setContent] = useState(() => createEmptyWebsiteContent(outletId || outletSlug || ""));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const activeOutletKey = useMemo(() => String(outletId || outletSlug || selectedOutletFilter || "").trim(), [outletId, outletSlug, selectedOutletFilter]);
  const isOutletSelected = Boolean(activeOutletKey && activeOutletKey !== "all");

  useEffect(() => {
    if (!isOutletSelected) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api(`/website-content?outletSlug=${encodeURIComponent(activeOutletKey)}`);
        if (isMounted) {
          setContent(normalizeWebsiteContentPayload(data, activeOutletKey));
        }
      } catch (err) {
        if (isMounted) setError(err?.message || "Unable to load website content.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [activeOutletKey, isOutletSelected]);

  function updateContent(updater) {
    setContent((current) => normalizeWebsiteContentPayload(updater(current), activeOutletKey));
  }

  async function handleSave() {
    if (!isOutletSelected) {
      setError("Select a specific outlet before saving content.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const saved = await api(`/website-content/${encodeURIComponent(activeOutletKey)}`, {
        method: "PUT",
        body: JSON.stringify(normalizeWebsiteContentPayload(content, activeOutletKey))
      });
      setContent(normalizeWebsiteContentPayload(saved, activeOutletKey));
      setSuccess("Website content saved successfully.");
    } catch (err) {
      setError(err?.message || "Failed to save website content.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(kind, file, field) {
    if (!file || !isOutletSelected) return;
    const maxSize = kind === "video" ? 100 * 1024 * 1024 : kind === "fssai" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowedTypes = kind === "video" ? ["video/mp4", "video/quicktime", "video/webm"] : kind === "fssai" ? ["application/pdf", "image/png", "image/jpeg", "image/jpg"] : ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${kind === "video" ? "100MB" : kind === "fssai" ? "10MB" : "5MB"}.`);
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError(`Unsupported file type for ${kind}.`);
      return;
    }
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const endpoint = kind === "video" ? `/website-content/${encodeURIComponent(activeOutletKey)}/upload-video` : kind === "image" ? `/website-content/${encodeURIComponent(activeOutletKey)}/upload-image` : `/website-content/${encodeURIComponent(activeOutletKey)}/upload-fssai`;
      const uploaded = await api(endpoint, { method: "POST", body: formData });
      updateContent((current) => {
        const next = normalizeWebsiteContentPayload(current, activeOutletKey);
        if (kind === "image") {
          next.hero.videoUrl = next.hero.videoUrl;
          if (field === "heroImage") next.hero.videoUrl = uploaded.url;
          else if (field === "whatWeServe") next.whatWeServe = next.whatWeServe.map((item) => (item.id === field ? { ...item, image: uploaded.url } : item));
          else if (field === "bestFor") next.bestFor = next.bestFor.map((item) => (item.id === field ? { ...item, image: uploaded.url } : item));
          else if (field === "gallery") next.gallery = next.gallery.map((item) => (item.id === field ? { ...item, url: uploaded.url } : item));
        } else if (kind === "video") {
          if (field === "heroVideo") next.hero.videoUrl = uploaded.url;
          else if (field === "visualMoment") next.visualMoments = next.visualMoments.map((item) => (item.id === field ? { ...item, videoUrl: uploaded.url } : item));
          else if (field === "review") next.customerReviews = next.customerReviews.map((item) => (item.id === field ? { ...item, videoUrl: uploaded.url } : item));
        }
        if (kind === "fssai") {
          next.fssai = { ...next.fssai, fileUrl: uploaded.url, fileName: file.name, fileType: file.type };
        }
        return next;
      });
      setSuccess(`${kind === "video" ? "Video" : kind === "fssai" ? "Certificate" : "Image"} uploaded successfully.`);
    } catch (err) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function moveItem(listKey, index, direction) {
    updateContent((current) => {
      const next = normalizeWebsiteContentPayload(current, activeOutletKey);
      const list = [...(next[listKey] || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return next;
      const [item] = list.splice(index, 1);
      list.splice(targetIndex, 0, item);
      next[listKey] = list;
      return next;
    });
  }

  function addItem(listKey, itemTemplate) {
    updateContent((current) => {
      const next = normalizeWebsiteContentPayload(current, activeOutletKey);
      next[listKey] = [...(next[listKey] || []), { ...itemTemplate, id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }];
      return next;
    });
  }

  function updateListItem(listKey, index, patch) {
    updateContent((current) => {
      const next = normalizeWebsiteContentPayload(current, activeOutletKey);
      next[listKey] = (next[listKey] || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
      return next;
    });
  }

  function removeListItem(listKey, index) {
    updateContent((current) => {
      const next = normalizeWebsiteContentPayload(current, activeOutletKey);
      next[listKey] = (next[listKey] || []).filter((_, itemIndex) => itemIndex !== index);
      return next;
    });
  }

  function renderUploadButton(label, kind, field, accept) {
    return (
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-black text-stone-700">
        <Upload size={15} /> {label}
        <input type="file" accept={accept} className="hidden" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleUpload(kind, file, field);
          event.target.value = "";
        }} />
      </label>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(135deg,#fffaf2,#f8efe2)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Website Management</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">Create and publish a fully custom About page</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-stone-600">Every section is outlet-specific, editable in real time, and previewed before it is published to customers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPreviewOpen(true)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-stone-900 shadow-sm">
              <Eye size={16} /> Preview Website
            </button>
            <button type="button" onClick={handleSave} disabled={!isOutletSelected || saving || uploading} className="flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        {!isOutletSelected && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            Select a single outlet in the dashboard filter to enable editing and publishing for that location.
          </div>
        )}
        {error && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"><AlertCircle size={16} className="mt-0.5" />{error}</div>}
        {success && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} className="mt-0.5" />{success}</div>}
      </div>

      {loading ? <div className="rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center text-sm font-semibold text-stone-600">Loading website content...</div> : null}

      {!loading && (
        <div className="space-y-6">
          <SectionCard title="General" description="Set the core website identity and navigation for the outlet.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hero Title">
                <FieldInput value={content.hero.title} onChange={(event) => updateContent((current) => ({ ...current, hero: { ...current.hero, title: event.target.value } }))} placeholder="Welcome to The Infusion Saga" />
              </Field>
              <Field label="Button Text">
                <FieldInput value={content.hero.buttonText} onChange={(event) => updateContent((current) => ({ ...current, hero: { ...current.hero, buttonText: event.target.value } }))} placeholder="Explore Menu" />
              </Field>
              <Field label="Hero Description">
                <FieldTextarea value={content.hero.description} onChange={(event) => updateContent((current) => ({ ...current, hero: { ...current.hero, description: event.target.value } }))} placeholder="Describe the experience for customers." rows={4} />
              </Field>
              <Field label="Button Link">
                <FieldInput value={content.hero.buttonLink} onChange={(event) => updateContent((current) => ({ ...current, hero: { ...current.hero, buttonLink: event.target.value } }))} placeholder="/menu" />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold text-stone-600">Hero video</div>
              {content.hero.videoUrl ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Uploaded</span> : <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-stone-500">No video yet</span>}
              {renderUploadButton("Upload Hero Video", "video", "heroVideo", "video/mp4,video/quicktime,video/webm")}
            </div>
          </SectionCard>

          <SectionCard title="About" description="Share the cafe story and future direction with customers.">
            <div className="grid gap-4">
              <Field label="Cafe Story"><FieldTextarea value={content.about.story} onChange={(event) => updateContent((current) => ({ ...current, about: { ...current.about, story: event.target.value } }))} placeholder="Tell the story of the outlet." /></Field>
              <Field label="Vision"><FieldTextarea value={content.about.vision} onChange={(event) => updateContent((current) => ({ ...current, about: { ...current.about, vision: event.target.value } }))} placeholder="Share the long-term vision." /></Field>
              <Field label="Mission"><FieldTextarea value={content.about.mission} onChange={(event) => updateContent((current) => ({ ...current, about: { ...current.about, mission: event.target.value } }))} placeholder="Describe the mission." /></Field>
              <Field label="Future Plans"><FieldTextarea value={content.about.futurePlans} onChange={(event) => updateContent((current) => ({ ...current, about: { ...current.about, futurePlans: event.target.value } }))} placeholder="List future plans and ambitions." /></Field>
            </div>
          </SectionCard>

          <SectionCard title="What We Serve" description="Manage cards that highlight your signature experiences.">
            <div className="space-y-3">
              {(content.whatWeServe || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Card {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("whatWeServe", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("whatWeServe", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("whatWeServe", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title"><FieldInput value={item.title} onChange={(event) => updateListItem("whatWeServe", index, { title: event.target.value })} placeholder="Signature chai" /></Field>
                    <Field label="Icon"><FieldInput value={item.icon} onChange={(event) => updateListItem("whatWeServe", index, { icon: event.target.value })} placeholder="Coffee" /></Field>
                    <Field label="Description"><FieldTextarea value={item.description} onChange={(event) => updateListItem("whatWeServe", index, { description: event.target.value })} placeholder="Describe the experience." rows={3} /></Field>
                    <div className="space-y-2">
                      {item.image ? <img src={item.image} alt={item.title} className="h-24 w-full rounded-2xl object-cover" loading="lazy" /> : <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">No image</div>}
                      {renderUploadButton("Upload Image", "image", item.id, "image/*")}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("whatWeServe", { ...INITIAL_ITEM })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Card
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Best For" description="Highlight the occasions and audiences the outlet is ideal for.">
            <div className="space-y-3">
              {(content.bestFor || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Item {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("bestFor", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("bestFor", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("bestFor", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title"><FieldInput value={item.title} onChange={(event) => updateListItem("bestFor", index, { title: event.target.value })} placeholder="Couple dates" /></Field>
                    <Field label="Description"><FieldTextarea value={item.description} onChange={(event) => updateListItem("bestFor", index, { description: event.target.value })} placeholder="Describe who the space suits." rows={3} /></Field>
                    <div className="space-y-2">
                      {item.image ? <img src={item.image} alt={item.title} className="h-24 w-full rounded-2xl object-cover" loading="lazy" /> : <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">No image</div>}
                      {renderUploadButton("Upload Image", "image", item.id, "image/*")}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("bestFor", { ...INITIAL_ITEM })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Best For Item
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Visual Moments" description="Showcase cafe atmosphere with video-led stories.">
            <div className="space-y-3">
              {(content.visualMoments || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Moment {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("visualMoments", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("visualMoments", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("visualMoments", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title"><FieldInput value={item.title} onChange={(event) => updateListItem("visualMoments", index, { title: event.target.value })} placeholder="Live music night" /></Field>
                    <Field label="Thumbnail"><FieldInput value={item.thumbnail} onChange={(event) => updateListItem("visualMoments", index, { thumbnail: event.target.value })} placeholder="Cloudinary image URL" /></Field>
                    <Field label="Description"><FieldTextarea value={item.description} onChange={(event) => updateListItem("visualMoments", index, { description: event.target.value })} placeholder="Describe the moment." rows={3} /></Field>
                    <div className="space-y-2">
                      {item.videoUrl ? <video src={item.videoUrl} controls playsInline preload="metadata" className="h-24 w-full rounded-2xl object-cover" /> : <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">No video</div>}
                      {renderUploadButton("Upload Video", "video", item.id, "video/mp4,video/quicktime,video/webm")}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("visualMoments", { ...INITIAL_VISUAL })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Visual Moment
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Reviews" description="Show social proof and customer voices.">
            <div className="space-y-3">
              {(content.customerReviews || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Review {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("customerReviews", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("customerReviews", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("customerReviews", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Customer Name"><FieldInput value={item.name} onChange={(event) => updateListItem("customerReviews", index, { name: event.target.value })} placeholder="Asha Patel" /></Field>
                    <Field label="Star Rating"><FieldInput value={item.rating} onChange={(event) => updateListItem("customerReviews", index, { rating: Number(event.target.value) || 0 })} placeholder="5" type="number" /></Field>
                    <Field label="Review"><FieldTextarea value={item.review} onChange={(event) => updateListItem("customerReviews", index, { review: event.target.value })} placeholder="Share the customer feedback." rows={3} /></Field>
                    <div className="space-y-2">
                      {item.customerImage ? <img src={item.customerImage} alt={item.name} className="h-24 w-full rounded-2xl object-cover" loading="lazy" /> : <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">No image</div>}
                      <Field label="Customer Image URL"><FieldInput value={item.customerImage} onChange={(event) => updateListItem("customerReviews", index, { customerImage: event.target.value })} placeholder="Cloudinary image URL" /></Field>
                      <Field label="Review Video URL"><FieldInput value={item.videoUrl} onChange={(event) => updateListItem("customerReviews", index, { videoUrl: event.target.value })} placeholder="Cloudinary video URL" /></Field>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("customerReviews", { ...INITIAL_REVIEW })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Review
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Gallery" description="Manage visual media that shows the outlet at its best.">
            <div className="space-y-3">
              {(content.gallery || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Media {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("gallery", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("gallery", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("gallery", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title"><FieldInput value={item.title} onChange={(event) => updateListItem("gallery", index, { title: event.target.value })} placeholder="Café ambience" /></Field>
                    <Field label="Type"><FieldInput value={item.type} onChange={(event) => updateListItem("gallery", index, { type: event.target.value })} placeholder="image" /></Field>
                    <Field label="URL"><FieldInput value={item.url} onChange={(event) => updateListItem("gallery", index, { url: event.target.value })} placeholder="Cloudinary URL" /></Field>
                    <div className="space-y-2">
                      {item.url ? (item.type === "video" ? <video src={item.url} controls playsInline preload="metadata" className="h-24 w-full rounded-2xl object-cover" /> : <img src={item.url} alt={item.title} className="h-24 w-full rounded-2xl object-cover" loading="lazy" />) : <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white text-sm text-stone-500">No media</div>}
                      {renderUploadButton("Upload Media", "image", item.id, "image/*")}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("gallery", { ...INITIAL_MEDIA })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Gallery Item
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Videos" description="Create a library of rich motion content for the About page.">
            <div className="space-y-3">
              {(content.videos || []).map((item, index) => (
                <div key={item.id || index} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-stone-900">Video {index + 1}</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => moveItem("videos", index, -1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => moveItem("videos", index, 1)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => removeListItem("videos", index)} className="rounded-full bg-white p-2 text-stone-700 shadow-sm"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title"><FieldInput value={item.title} onChange={(event) => updateListItem("videos", index, { title: event.target.value })} placeholder="Cafe ambience" /></Field>
                    <Field label="Description"><FieldTextarea value={item.description} onChange={(event) => updateListItem("videos", index, { description: event.target.value })} placeholder="Describe the video." rows={3} /></Field>
                    <Field label="Video URL"><FieldInput value={item.url} onChange={(event) => updateListItem("videos", index, { url: event.target.value })} placeholder="Cloudinary video URL" /></Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addItem("videos", { ...INITIAL_VIDEO })} className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-black text-stone-800">
                <Plus size={16} /> Add Video
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Social Links" description="Add the handles and destinations your audience can follow.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Instagram"><FieldInput value={content.socialLinks.instagram} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, instagram: event.target.value } }))} placeholder="https://instagram.com/your-handle" /></Field>
              <Field label="Facebook"><FieldInput value={content.socialLinks.facebook} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, facebook: event.target.value } }))} placeholder="https://facebook.com/your-page" /></Field>
              <Field label="X"><FieldInput value={content.socialLinks.x} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, x: event.target.value } }))} placeholder="https://x.com/your-handle" /></Field>
              <Field label="YouTube"><FieldInput value={content.socialLinks.youtube} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, youtube: event.target.value } }))} placeholder="https://youtube.com/your-channel" /></Field>
              <Field label="WhatsApp"><FieldInput value={content.socialLinks.whatsapp} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, whatsapp: event.target.value } }))} placeholder="https://wa.me/919999999999" /></Field>
              <Field label="Google Maps"><FieldInput value={content.socialLinks.googleMaps} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, googleMaps: event.target.value } }))} placeholder="https://maps.google.com/..." /></Field>
              <Field label="Google Review URL"><FieldInput value={content.socialLinks.googleReviewUrl} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, googleReviewUrl: event.target.value } }))} placeholder="https://g.page/..." /></Field>
              <Field label="Website"><FieldInput value={content.socialLinks.website} onChange={(event) => updateContent((current) => ({ ...current, socialLinks: { ...current.socialLinks, website: event.target.value } }))} placeholder="https://yourwebsite.com" /></Field>
            </div>
          </SectionCard>

          <SectionCard title="Support" description="Make support and phone details available for customers.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Support Email"><FieldInput value={content.support.email} onChange={(event) => updateContent((current) => ({ ...current, support: { ...current.support, email: event.target.value } }))} placeholder="support@brand.com" /></Field>
              <Field label="Support Phone"><FieldInput value={content.support.phone} onChange={(event) => updateContent((current) => ({ ...current, support: { ...current.support, phone: event.target.value } }))} placeholder="+91 99999 99999" /></Field>
              <Field label="Support WhatsApp"><FieldInput value={content.support.whatsapp} onChange={(event) => updateContent((current) => ({ ...current, support: { ...current.support, whatsapp: event.target.value } }))} placeholder="https://wa.me/..." /></Field>
            </div>
          </SectionCard>

          <SectionCard title="FSSAI" description="Upload and preview the outlet certificate.">
            <div className="space-y-3">
              {content.fssai?.fileUrl ? <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-stone-700" />
                  <div>
                    <p className="text-sm font-black text-stone-900">{content.fssai.fileName || "Certificate uploaded"}</p>
                    <p className="text-xs font-semibold text-stone-500">{content.fssai.fileType || "PDF/PNG/JPG"}</p>
                  </div>
                </div>
              </div> : <PreviewCard title="FSSAI certificate" description="No certificate uploaded yet." />}
              <div className="flex flex-wrap gap-3">
                {renderUploadButton("Upload Certificate", "fssai", "fssai", "application/pdf,image/png,image/jpeg,image/jpg")}
                {content.fssai?.fileUrl ? <a href={content.fssai.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-black text-stone-700">Preview Certificate</a> : null}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[2rem] bg-[#fffaf2] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Preview</p>
                <h3 className="text-2xl font-black text-stone-950">Website preview</h3>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">Close</button>
            </div>
            <div className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
              <div className="rounded-[1.25rem] bg-[linear-gradient(135deg,#f8efe2,#fffaf2)] p-6">
                <h4 className="text-3xl font-black text-stone-950">{content.hero.title || "Hero title"}</h4>
                <p className="mt-2 text-sm font-semibold text-stone-700">{content.hero.description || "Hero description"}</p>
                <div className="mt-4 flex gap-3">
                  <a href={content.hero.buttonLink || "/menu"} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">{content.hero.buttonText || "Explore Menu"}</a>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <PreviewCard title="About story" description={content.about.story || "The story will appear here."} />
                <PreviewCard title="Vision" description={content.about.vision || "Vision will appear here."} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {(content.whatWeServe || []).slice(0, 3).map((item) => <PreviewCard key={item.id} title={item.title} description={item.description} />)}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {(content.customerReviews || []).slice(0, 3).map((item) => <PreviewCard key={item.id} title={item.name} description={item.review} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
