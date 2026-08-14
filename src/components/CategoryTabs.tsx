import React, { useState } from 'react';
import { CategoryType, SortOption, ViewMode } from '../types';
import {
  Folder,
  Star,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Plus,
  LayoutGrid,
  List,
  ArrowUpDown,
  Inbox,
  Tag,
  X,
  Check
} from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: CategoryType;
  onCategoryChange: (cat: CategoryType) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalItemsCount: number;
  filteredItemsCount: number;
  customCategories?: string[];
  onCreateCategory?: (catName: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onCategoryChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  filteredItemsCount,
  customCategories = [],
  onCreateCategory,
}) => {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const defaultCategories: { id: CategoryType; label: string; icon: React.ReactNode }[] = [
    { id: 'All', label: 'All Files', icon: <Folder size={16} /> },
    { id: 'Starred', label: 'Starred', icon: <Star size={16} className="text-amber-500 fill-amber-500" /> },
    { id: 'Documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'Images', label: 'Images', icon: <ImageIcon size={16} /> },
    { id: 'Videos', label: 'Videos', icon: <Film size={16} /> },
    { id: 'Audios', label: 'Audios', icon: <Music size={16} /> },
    { id: 'Other', label: 'Other', icon: <File size={16} /> },
  ];

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (onCreateCategory) {
      onCreateCategory(trimmed);
    }
    onCategoryChange(trimmed);
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-olive-sage/20 pb-3">
        {/* Category Tabs & Create Category Button in the same line */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {defaultCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-olive-primary text-white shadow-md shadow-olive-primary/20'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-olive-light dark:hover:bg-slate-700 border border-olive-sage/20'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}

          {/* Custom Categories created by user */}
          {customCategories.map((customCat) => {
            const isActive = activeCategory.toLowerCase() === customCat.toLowerCase();
            return (
              <button
                key={customCat}
                onClick={() => onCategoryChange(customCat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all capitalize ${
                  isActive
                    ? 'bg-olive-primary text-white shadow-md shadow-olive-primary/20'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-olive-light dark:hover:bg-slate-700 border border-olive-sage/20'
                }`}
              >
                <Tag size={15} />
                <span>{customCat}</span>
              </button>
            );
          })}

          {/* "+ Create Category" Option in same line */}
          <button
            onClick={() => setIsCreatingCategory(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition-all shrink-0 ml-1"
            title="Create Custom Category"
          >
            <Plus size={15} />
            <span>+ Category</span>
          </button>
        </div>

        {/* Sorting Engine & View Mode Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Item Count Badge */}
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {filteredItemsCount} {filteredItemsCount === 1 ? 'item' : 'items'}
          </span>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-slate-800/70 border border-olive-sage/30 rounded-xl px-2.5 py-1.5 shadow-sm">
            <ArrowUpDown size={14} className="text-olive-sage" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-cream focus:outline-none cursor-pointer"
            >
              <option value="date-newest" className="dark:bg-slate-900">Newest Added</option>
              <option value="date-oldest" className="dark:bg-slate-900">Oldest First</option>
              <option value="name-asc" className="dark:bg-slate-900">Name (A - Z)</option>
              <option value="name-desc" className="dark:bg-slate-900">Name (Z - A)</option>
              <option value="size-desc" className="dark:bg-slate-900">Size (Largest)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/70 dark:bg-slate-800/70 border border-olive-sage/30 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-olive-primary text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
              }`}
              title="Grid Box View"
              aria-label="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-olive-primary text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-cream'
              }`}
              title="Table/List View"
              aria-label="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Create Category Dialog */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E241E] border border-olive-sage/30 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
              <div className="flex items-center gap-2 text-olive-primary dark:text-olive-sage">
                <Tag size={18} />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Category</h3>
              </div>
              <button
                onClick={() => setIsCreatingCategory(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Work, Code, Finance..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-olive-sage/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-olive-primary"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Add Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyStateProps {
  categoryName: string;
  onClearFilters?: () => void;
}

export const EmptyCategoryNotice: React.FC<EmptyStateProps> = ({ categoryName, onClearFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-16 border-2 border-dashed border-olive-sage/30 rounded-3xl bg-cream/30 dark:bg-slate-900/40 text-center my-6 space-y-3">
      <div className="p-4 rounded-2xl bg-olive-light dark:bg-slate-800 text-olive-primary dark:text-olive-sage">
        <Inbox size={48} />
      </div>
      <p className="text-lg font-semibold text-olive-dark dark:text-olive-sage">
        Is category me koi file uplabdha nahi hai
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        No matching files or subfolders located in "{categoryName}". Click the FAB (+) button below to upload new files or create folders.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-olive-primary text-white hover:bg-olive-dark shadow-md transition-all mt-2"
        >
          View All Files
        </button>
      )}
    </div>
  );
};
