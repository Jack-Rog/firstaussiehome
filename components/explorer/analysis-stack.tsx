"use client";

import type { ExplorerCategory, ExplorerCategoryId } from "@/src/lib/types";
import { AnalysisCategoryCard } from "@/components/explorer/analysis-category-card";

type AnalysisStackProps = {
  categories: ExplorerCategory[];
  expandedCategory: ExplorerCategoryId;
  onExpand: (id: ExplorerCategoryId) => void;
};

export function AnalysisStack({
  categories,
  expandedCategory,
  onExpand,
}: AnalysisStackProps) {
  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <AnalysisCategoryCard
          key={category.id}
          category={category}
          expanded={expandedCategory === category.id}
          onToggle={() => onExpand(category.id)}
        />
      ))}
    </div>
  );
}
