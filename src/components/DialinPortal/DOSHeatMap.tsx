import { MetadataItem } from './DOSPanel';

interface DOSHeatMapProps {
  metadata: MetadataItem[];
  loading: boolean;
}

export function DOSHeatMap({ metadata, loading }: DOSHeatMapProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading heat map...</p>
      </div>
    );
  }

  // Aggregate hashtag frequency
  const tagFrequency = new Map<string, number>();
  metadata.forEach(item => {
    item.hashtags?.forEach(tag => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });

  const sortedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50); // Top 50 tags

  const maxFreq = sortedTags[0]?.[1] || 1;

  if (sortedTags.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No hashtags to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card rounded-lg border p-6 overflow-auto">
      <div className="grid grid-cols-8 gap-2">
        {sortedTags.map(([tag, count]) => {
          const intensity = count / maxFreq;
          return (
            <div
              key={tag}
              className="aspect-square rounded flex flex-col items-center justify-center p-2 text-center relative group"
              style={{
                backgroundColor: `hsl(var(--primary) / ${intensity * 0.8})`,
              }}
            >
              <span className="text-xs font-medium truncate w-full">
                {tag}
              </span>
              <span className="text-xs opacity-70">{count}</span>
              <div className="absolute inset-0 bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 rounded">
                <div className="text-center">
                  <div className="font-semibold">{tag}</div>
                  <div className="text-xs text-muted-foreground">{count} items</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
