import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Settings360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  show360: boolean;
  onToggle360: () => void;
  xAxisOffset?: number;
  yAxisOffset?: number;
  onAxisChange: (axis: 'x' | 'y', value: number) => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export function Settings360Modal({
  isOpen,
  onClose,
  show360,
  onToggle360,
  xAxisOffset = 0,
  yAxisOffset = 0,
  onAxisChange,
  volume = 0.5,
  isMuted = false,
  onVolumeChange,
  onMuteToggle,
}: Settings360ModalProps) {
  // ESC key handling
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleReset = () => {
    onAxisChange('x', 0);
    onAxisChange('y', 0);
    onVolumeChange(0.5);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-lg z-50 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">360° Settings</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 360 Mode Toggle */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">360° Mode</label>
                <Switch
                  checked={show360}
                  onCheckedChange={onToggle360}
                />
              </div>

              {show360 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  {/* X-Axis Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X-Axis Rotation</label>
                    <div className="px-3">
                      <Slider
                        value={[xAxisOffset]}
                        onValueChange={([value]) => onAxisChange('x', value)}
                        min={-180}
                        max={180}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {xAxisOffset}°
                    </div>
                  </div>

                  {/* Y-Axis Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y-Axis Rotation</label>
                    <div className="px-3">
                      <Slider
                        value={[yAxisOffset]}
                        onValueChange={([value]) => onAxisChange('y', value)}
                        min={-180}
                        max={180}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {yAxisOffset}°
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Volume</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMuteToggle}
                        className="w-8 h-8 p-0"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="px-3">
                      <Slider
                        value={[volume * 100]}
                        onValueChange={([value]) => onVolumeChange(value / 100)}
                        min={0}
                        max={100}
                        step={1}
                        disabled={isMuted}
                        className="w-full"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}