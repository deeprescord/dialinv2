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

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    const nodePositions = new Map<string, { x: number; y: number }>();

    // Position nodes in a circle
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    tags.forEach((tag, i) => {
      const angle = (i / tags.length) * Math.PI * 2;
      nodePositions.set(tag, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    // Draw connections
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.4)';
    ctx.lineWidth = 1.5;
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

    // Draw nodes
    nodePositions.forEach((pos, tag) => {
      const connectionCount = tagMap.get(tag)?.size || 0;
      const nodeRadius = 8 + connectionCount * 2;

      // Draw glow effect
      ctx.fillStyle = 'hsl(var(--primary) / 0.3)';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius + 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw node circle
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw label with shadow for better readability
      ctx.shadowColor = 'hsl(var(--background))';
      ctx.shadowBlur = 3;
      ctx.fillStyle = 'hsl(var(--foreground))';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tag, pos.x, pos.y - nodeRadius - 5);
      ctx.shadowBlur = 0;
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
