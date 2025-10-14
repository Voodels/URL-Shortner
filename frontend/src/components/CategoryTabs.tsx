/**
 * CategoryTabs Component - Category Navigation with DaisyUI Tabs
 *
 * RESPONSIBILITIES:
 * - Display categories as beautiful tabs with icons
 * - Handle category selection for filtering
 * - Show "All" tab for viewing all URLs
 * - Display URL count badges on each tab
 */

import { useState } from "react";
import type { CategoryWithCount } from "../api";

interface CategoryTabsProps {
  categories: CategoryWithCount[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  totalURLCount: number;
  onDrop?: (shortCode: string, categoryId: string) => void;
}

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalURLCount,
  onDrop,
}: CategoryTabsProps) {
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOverCategoryId(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverCategoryId(null);
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragOverCategoryId(null);

    const shortCode = e.dataTransfer.getData("text/plain");
    if (shortCode && onDrop) {
      onDrop(shortCode, categoryId);
    }
  };

  return (
    <div className="mb-8 relative group">
      {/* Gradient fade indicators for scroll */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-base-200 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-base-200 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Scrollable container with custom scrollbar styling */}
      <div className="overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin snap-x snap-mandatory scroll-smooth">
        <div role="tablist" className="tabs tabs-lifted tabs-lg gap-2 flex-nowrap inline-flex">
        {/* All URLs Tab */}
        <button
          role="tab"
          className={`tab gap-2 snap-start flex-shrink-0 ${
            selectedCategoryId === null ? "tab-active" : ""
          }`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="text-xl">📚</span>
          <span>All Links</span>
          <div className="badge badge-neutral badge-sm">{totalURLCount}</div>
        </button>

        {/* Category Tabs */}
        {categories.map((category) => (
          <button
            key={category.id}
            role="tab"
            className={`tab gap-2 snap-start flex-shrink-0 ${
              selectedCategoryId === category.id ? "tab-active" : ""
            } ${
              dragOverCategoryId === category.id ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
            onClick={() => onSelectCategory(category.id)}
            onDragOver={(e) => handleDragOver(e, category.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, category.id)}
            style={{
              borderColor:
                selectedCategoryId === category.id
                  ? `hsl(var(--${category.color}))`
                  : undefined,
            }}
          >
            <span className="text-xl">{category.icon}</span>
            <span>{category.name}</span>
            {category.urlCount > 0 && (
              <div
                className={`badge badge-sm ${
                  selectedCategoryId === category.id
                    ? `badge-${category.color}`
                    : "badge-ghost"
                }`}
              >
                {category.urlCount}
              </div>
            )}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
