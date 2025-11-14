import { MetadataItem } from './DOSPanel';

interface DOSVennDiagramProps {
  metadata: MetadataItem[];
  loading: boolean;
}

export function DOSVennDiagram({ metadata, loading }: DOSVennDiagramProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading Venn diagram...</p>
      </div>
    );
  }

  // Get top 3 hashtags for Venn diagram
  const tagFrequency = new Map<string, Set<string>>();
  metadata.forEach(item => {
    item.hashtags?.forEach(tag => {
      if (!tagFrequency.has(tag)) tagFrequency.set(tag, new Set());
      tagFrequency.get(tag)!.add(item.file_id);
    });
  });

  const topTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 3);

  if (topTags.length < 2) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Need at least 2 hashtags for Venn diagram</p>
      </div>
    );
  }

  const [tag1, tag2, tag3] = topTags;

  // Calculate intersections
  const set1 = tag1[1];
  const set2 = tag2[1];
  const set3 = tag3?.[1] || new Set();

  const only1 = new Set([...set1].filter(x => !set2.has(x) && !set3.has(x)));
  const only2 = new Set([...set2].filter(x => !set1.has(x) && !set3.has(x)));
  const only3 = new Set([...set3].filter(x => !set1.has(x) && !set2.has(x)));
  const intersection12 = new Set([...set1].filter(x => set2.has(x) && !set3.has(x)));
  const intersection13 = new Set([...set1].filter(x => set3.has(x) && !set2.has(x)));
  const intersection23 = new Set([...set2].filter(x => set3.has(x) && !set1.has(x)));
  const intersection123 = new Set([...set1].filter(x => set2.has(x) && set3.has(x)));

  return (
    <div className="h-full w-full bg-card rounded-lg border p-6 flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 400 400" className="max-w-full max-h-full">
        {/* Circle 1 */}
        <circle
          cx="150"
          cy="180"
          r="100"
          fill="hsl(var(--chart-1) / 0.4)"
          stroke="hsl(var(--chart-1))"
          strokeWidth="2"
        />
        {/* Circle 2 */}
        <circle
          cx="250"
          cy="180"
          r="100"
          fill="hsl(var(--chart-2) / 0.4)"
          stroke="hsl(var(--chart-2))"
          strokeWidth="2"
        />
        {/* Circle 3 (if exists) */}
        {tag3 && (
          <circle
            cx="200"
            cy="260"
            r="100"
            fill="hsl(var(--chart-3) / 0.4)"
            stroke="hsl(var(--chart-3))"
            strokeWidth="2"
          />
        )}

        {/* Labels */}
        <text x="100" y="120" fill="hsl(var(--foreground))" fontSize="14" fontWeight="bold">
          {tag1[0]}
        </text>
        <text x="270" y="120" fill="hsl(var(--foreground))" fontSize="14" fontWeight="bold">
          {tag2[0]}
        </text>
        {tag3 && (
          <text x="170" y="350" fill="hsl(var(--foreground))" fontSize="14" fontWeight="bold">
            {tag3[0]}
          </text>
        )}

        {/* Counts */}
        <text x="110" y="180" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
          {only1.size}
        </text>
        <text x="290" y="180" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
          {only2.size}
        </text>
        <text x="200" y="180" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
          {intersection12.size}
        </text>
        {tag3 && (
          <>
            <text x="200" y="290" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
              {only3.size}
            </text>
            <text x="150" y="230" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
              {intersection13.size}
            </text>
            <text x="250" y="230" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
              {intersection23.size}
            </text>
            <text x="200" y="220" fill="hsl(var(--foreground))" fontSize="18" textAnchor="middle">
              {intersection123.size}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
