import { useState } from 'react';
import { FOSSidebar } from './FOSSidebar';
import { SpaceGrid } from './SpaceGrid';
import { StreamPanel } from './StreamPanel';

export function FOSInterface() {
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | '360'>('grid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0f0520] relative overflow-hidden">
      {/* Deep space background effect */}
      {viewMode === 'grid' && (
        <div className="fixed inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]" />
        </div>
      )}

      <div className="relative z-10 flex h-screen">
        {/* Left Sidebar - Navigation - Floats in 360 mode */}
        <div className={viewMode === '360' ? 'absolute left-0 top-0 bottom-0 z-10' : ''}>
          <FOSSidebar 
            selectedSpace={selectedSpace} 
            onSelectSpace={setSelectedSpace}
            floating={viewMode === '360'}
          />
        </div>

        {/* Center Grid - Main Space */}
        <SpaceGrid 
          selectedSpace={selectedSpace}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* Right Panel - Stream - Floats in 360 mode */}
        <div className={viewMode === '360' ? 'absolute right-0 top-0 bottom-0 z-10' : ''}>
          <StreamPanel floating={viewMode === '360'} />
        </div>
      </div>
    </div>
  );
}
