import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import {
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/services/collections.service";
import type { Collection } from "@/interfaces/types";

const AdminCollections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    getCollections()
      .then(setCollections)
      .catch(() => alert("Failed to load collections"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createCollection(newName.trim(), newDesc.trim());
      setCollections((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewDesc("");
    } catch {
      alert("Failed to create collection.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (c: Collection) => {
    setEditingId(c.collection_id);
    setEditName(c.name);
    setEditDesc(c.description ?? "");
  };

  const handleSaveEdit = async (collectionId: number) => {
    if (!editName.trim()) return;
    try {
      await updateCollection(collectionId, editName.trim(), editDesc.trim());
      setCollections((prev) =>
        prev
          .map((c) =>
            c.collection_id === collectionId
              ? { ...c, name: editName.trim(), description: editDesc.trim() }
              : c
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch {
      alert("Failed to save changes.");
    }
  };

  const handleDelete = async (collectionId: number, name: string) => {
    if (!confirm(`Delete collection "${name}"? Items in this collection will not be deleted, just unassigned.`)) return;
    try {
      await deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c.collection_id !== collectionId));
    } catch {
      alert("Failed to delete collection.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">Collections</h1>

        {/* Create new */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4 border-b pb-2">Create New Collection</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Collection name (e.g. Summer 2025)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Collection"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-xl shadow divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : collections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No collections yet. Create one above.
            </div>
          ) : (
            collections.map((c) => (
              <div key={c.collection_id} className="p-5">
                {editingId === c.collection_id ? (
                  <div className="space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(c.collection_id)}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted transition"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.collection_id, c.name)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCollections;
