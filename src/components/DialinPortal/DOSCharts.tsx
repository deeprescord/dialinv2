import { MetadataItem } from './DOSPanel';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DOSChartsProps {
  metadata: MetadataItem[];
  loading: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function DOSCharts({ metadata, loading }: DOSChartsProps) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading charts...</p>
      </div>
    );
  }

  // Hashtag frequency data
  const tagFrequency = new Map<string, number>();
  metadata.forEach(item => {
    item.hashtags?.forEach(tag => {
      tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
    });
  });

  const topTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // AI confidence distribution
  const confidenceRanges = {
    'High (>80%)': 0,
    'Medium (50-80%)': 0,
    'Low (<50%)': 0,
  };

  metadata.forEach(item => {
    const conf = item.ai_confidence || 0;
    if (conf > 0.8) confidenceRanges['High (>80%)']++;
    else if (conf > 0.5) confidenceRanges['Medium (50-80%)']++;
    else confidenceRanges['Low (<50%)']++;
  });

  const confidenceData = Object.entries(confidenceRanges).map(([name, value]) => ({
    name,
    value,
  }));

  if (metadata.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No data to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card rounded-lg border p-6 overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Hashtags Bar Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">Top Hashtags</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTags}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))" 
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))" 
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Confidence Pie Chart */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">AI Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={confidenceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={80}
                dataKey="value"
              >
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Legend 
                wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Item Count */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary">{metadata.length}</div>
              <div className="text-sm text-foreground mt-2">Total Items</div>
            </div>
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary">{tagFrequency.size}</div>
              <div className="text-sm text-foreground mt-2">Unique Hashtags</div>
            </div>
            <div className="bg-muted rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-primary">
                {(metadata.reduce((sum, m) => sum + (m.ai_confidence || 0), 0) / metadata.length * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-foreground mt-2">Avg AI Confidence</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
