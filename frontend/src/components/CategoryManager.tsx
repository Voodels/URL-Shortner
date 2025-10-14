/**
 * CategoryManager Component - Create and Manage Categories
 *
 * RESPONSIBILITIES:
 * - Modal for creating new categories
 * - Icon and color picker
 * - Category list with edit/delete actions
 */

import { useState } from "react";
import { api, type Category, type CategoryWithCount } from "../api";

interface CategoryManagerProps {
  categories: CategoryWithCount[];
  onCategoryCreated: () => void;
  onCategoryUpdated: () => void;
  onCategoryDeleted: () => void;
}

const CATEGORY_ICONS = [
  "📁", "🔖", "⭐", "💼", "🎯", "📌", "🏷️", "📚",
  "💡", "🎨", "🚀", "🎓", "💻", "🎵", "🎮", "📰",
  "🛠️", "🏠", "🌟", "🔥", "💎", "🎪", "🎬", "📷"
];

const DAISY_COLORS = [
  { name: "Primary", value: "primary" },
  { name: "Secondary", value: "secondary" },
  { name: "Accent", value: "accent" },
  { name: "Info", value: "info" },
  { name: "Success", value: "success" },
  { name: "Warning", value: "warning" },
  { name: "Error", value: "error" },
];

export function CategoryManager({
  categories,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
}: CategoryManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("📁");
  const [selectedColor, setSelectedColor] = useState("primary");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedIcon("📁");
    setSelectedColor("primary");
    setError(null);
    setIsEditing(false);
    setEditingCategory(null);
  };

  const openModal = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditModal = (category: Category) => {
    setIsEditing(true);
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || "");
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setError(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && editingCategory) {
        await api.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon: selectedIcon,
          color: selectedColor,
        });
        onCategoryUpdated();
      } else {
        await api.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          icon: selectedIcon,
          color: selectedColor,
        });
        onCategoryCreated();
      }
      closeModal();
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await api.deleteCategory(categoryId);
      onCategoryDeleted();
    } catch (err: any) {
      alert(err.message || "Failed to delete category");
    }
  };

  return (
    <>
      {/* Manage Categories Button */}
      <button
        type="button"
        className="btn btn-outline btn-sm gap-2"
        onClick={openModal}
      >
        <span>🏷️</span>
        Manage Categories
      </button>

      {/* Modal */}
      {isOpen && (
        <dialog className="modal modal-open z-50">
          <div className="modal-box max-w-2xl">
            <h3 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Category" : "Create New Category"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Category Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Work, Personal, Projects"
                  required
                  maxLength={50}
                />
              </div>

              {/* Description Input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Description (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this category..."
                  rows={2}
                  maxLength={200}
                />
              </div>

              {/* Icon Picker */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Choose an Icon</span>
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {CATEGORY_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`btn btn-square ${
                        selectedIcon === icon ? "btn-primary" : "btn-ghost"
                      }`}
                      onClick={() => setSelectedIcon(icon)}
                    >
                      <span className="text-2xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Choose a Color</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAISY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`btn btn-${color.value} ${
                        selectedColor === color.value ? "btn-active" : "btn-outline"
                      }`}
                      onClick={() => setSelectedColor(color.value)}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-${selectedColor}`}
                  disabled={loading || !name.trim()}
                >
                  {loading ? (
                    <span className="loading loading-spinner"></span>
                  ) : isEditing ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>

            {/* Existing Categories List (only in create mode) */}
            {!isEditing && categories.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-bold mb-3">Your Categories</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-base-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <div className="font-semibold">{category.name}</div>
                          {category.description && (
                            <div className="text-sm opacity-70">
                              {category.description}
                            </div>
                          )}
                        </div>
                        <div className={`badge badge-${category.color} badge-sm`}>
                          {category.urlCount} {category.urlCount === 1 ? "link" : "links"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => openEditModal(category)}
                          title="Edit category"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square text-error"
                          onClick={() => handleDelete(category.id)}
                          title="Delete category"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form method="dialog" className="modal-backdrop" onClick={closeModal}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
