import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import {
  getMaterialCareGuides,
  createMaterialCareGuide,
  updateMaterialCareGuide,
  deleteMaterialCareGuide,
} from "@/services/materialCare.service";
import type { MaterialCareGuide } from "@/interfaces/types";

const insertBulletNewline = (
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  setValue: (v: string) => void
) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  const el = e.currentTarget;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const newValue = value.substring(0, start) + "\n• " + value.substring(end);
  setValue(newValue);
  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 3; });
};

const handleDescChange = (
  e: React.ChangeEvent<HTMLTextAreaElement>,
  prevValue: string,
  setValue: (v: string) => void
) => {
  let val = e.target.value;
  if (prevValue === "" && val !== "") val = "• " + val;
  setValue(val);
};

const AdminMaterialCare = () => {
  const navigate = useNavigate();
  const [guides, setGuides] = useState<MaterialCareGuide[]>([]);
  const [loading, setLoading] = useState(true);

  // New guide form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    getMaterialCareGuides()
      .then(setGuides)
      .catch((err) => {
        console.error(err);
        alert("Failed to load guides. Have you run the migration SQL?");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDesc.trim()) return;
    setSaving(true);
    try {
      const created = await createMaterialCareGuide(newTitle.trim(), newDesc.trim());
      setGuides((prev) => [...prev, created]);
      setNewTitle("");
      setNewDesc("");
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create guide.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (guide: MaterialCareGuide) => {
    setEditingId(guide.guide_id);
    setEditTitle(guide.title);
    setEditDesc(guide.description);
  };

  const handleUpdate = async (guideId: number) => {
    if (!editTitle.trim() || !editDesc.trim()) return;
    try {
      await updateMaterialCareGuide(guideId, editTitle.trim(), editDesc.trim());
      setGuides((prev) =>
        prev.map((g) =>
          g.guide_id === guideId
            ? { ...g, title: editTitle.trim(), description: editDesc.trim() }
            : g
        )
      );
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update guide.");
    }
  };

  const handleDelete = async (guideId: number) => {
    if (!confirm("Delete this guide? Items assigned to it will lose their care info.")) return;
    try {
      await deleteMaterialCareGuide(guideId);
      setGuides((prev) => prev.filter((g) => g.guide_id !== guideId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete guide.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Materials & Care Guides</h1>
          <button
            onClick={() => setShowAdd((p) => !p)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            New Guide
          </button>
        </div>

        {/* Add new guide form */}
        {showAdd && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg border-b pb-2">New Guide</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. Gold-filled necklace care"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
                <span className="ml-2 font-normal text-muted-foreground text-xs">
                  (shown to customers on the product page)
                </span>
              </label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                rows={5}
                placeholder={"• Made from hypoallergenic materials\n• Avoid contact with water and perfumes\n• Store in a dry place when not wearing\n• Clean with a soft dry cloth"}
                value={newDesc}
                onChange={(e) => handleDescChange(e, newDesc, setNewDesc)}
                onKeyDown={(e) => insertBulletNewline(e, newDesc, setNewDesc)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={saving || !newTitle.trim() || !newDesc.trim()}
                className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Guide"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewTitle(""); setNewDesc(""); }}
                className="px-5 py-2 rounded-lg text-sm border hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : guides.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center text-muted-foreground">
            No guides yet. Create your first one above.
          </div>
        ) : (
          <div className="space-y-4">
            {guides.map((guide) => (
              <div key={guide.guide_id} className="bg-white rounded-xl shadow p-6">
                {editingId === guide.guide_id ? (
                  <div className="space-y-3">
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={6}
                      value={editDesc}
                      onChange={(e) => handleDescChange(e, editDesc, setEditDesc)}
                      onKeyDown={(e) => insertBulletNewline(e, editDesc, setEditDesc)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(guide.guide_id)}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm border hover:bg-gray-50 transition"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-base">{guide.title}</h3>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startEdit(guide)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border rounded-lg px-3 py-1.5 transition"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(guide.guide_id)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-1.5 transition"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {guide.description}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-3">
                      Guide ID: {guide.guide_id}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMaterialCare;
