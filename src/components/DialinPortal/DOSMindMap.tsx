import { useEffect, useRef } from 'react';
import { MetadataItem } from './DOSPanel';

interface DOSMindMapProps {
  metadata: MetadataItem[];
  loading: boolean;
}

export function DOSMindMap({ metadata, loading }: DOSMindMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolve design tokens from CSS variables for use in canvas
    const styles = getComputedStyle(canvas);
    const getVar = (name: string) => styles.getPropertyValue(name).trim();

    const foreground = getVar('--foreground');
    const background = getVar('--background');
    const primary = getVar('--primary');

    // Build a bright palette from chart tokens, fallback to primary
    const chartVars = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];
    const paletteValues = chartVars
      .map(v => getVar(v))
      .filter(Boolean);
    const palette = paletteValues.length ? paletteValues : [primary];

    // Handle HiDPI/retina for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Extract unique hashtags and their connections
    const tagMap = new Map<string, Set<string>>();
    metadata.forEach(item => {
      item.hashtags?.forEach((tag, i) => {
        if (!tagMap.has(tag)) tagMap.set(tag, new Set());
        // Connect to other tags in same item
        item.hashtags.forEach((otherTag, j) => {
          if (i !== j) tagMap.get(tag)!.add(otherTag);
        });
      });
    });

    const tags = Array.from(tagMap.keys());
    const nodePositions = new Map<string, { x: number; y: number; color: string }>();

    // Position nodes in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    tags.forEach((tag, i) => {
      const angle = (i / tags.length) * Math.PI * 2;
      const color = palette[i % palette.length];
      nodePositions.set(tag, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        color,
      });
    });

    // Draw connections (use foreground with transparency for brightness)
    ctx.strokeStyle = `hsl(${foreground} / 0.5)`;
    ctx.lineWidth = 1.75;
    tagMap.forEach((connections, tag) => {
      const pos = nodePositions.get(tag);
      if (!pos) return;

      connections.forEach(connectedTag => {
        const connPos = nodePositions.get(connectedTag);
        if (!connPos) return;

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(connPos.x, connPos.y);
        ctx.stroke();
      });
    });

    // Draw nodes and labels with high contrast
    nodePositions.forEach((pos, tag) => {
      const connectionCount = tagMap.get(tag)?.size || 0;
      const nodeRadius = 8 + connectionCount * 2;

      // Glow
      ctx.fillStyle = `hsl(${pos.color} / 0.35)`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius + 5, 0, Math.PI * 2);
      ctx.fill();

      // Node circle (vibrant color)
      ctx.fillStyle = `hsl(${pos.color})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outline to separate from dark background
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsl(${background})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Label with outline for readability
      const labelY = pos.y - nodeRadius - 6;
      ctx.font = '600 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = `hsl(${background})`;
      ctx.strokeText(tag, pos.x, labelY);
      ctx.fillStyle = `hsl(${foreground})`;
      ctx.fillText(tag, pos.x, labelY);
    });
  }, [metadata, loading]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading mind map...</p>
      </div>
    );
  }

  if (metadata.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">No data to visualize</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card rounded-lg border overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
