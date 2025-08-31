import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Close } from '../icons';
import { Card } from '../ui/card';
import { Upload, X } from 'lucide-react';

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, coverUrl: string) => void;
}

const coverOptions = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1629909613654-28e6c8816c9b?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1583847268964-a6f45e725dc3?q=80&w=200&h=120&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=200&h=120&fit=crop&auto=format',
];

export function CreateSpaceModal({ isOpen, onClose, onCreate }: CreateSpaceModalProps) {
  const [spaceName, setSpaceName] = useState('');
  const [selectedCover, setSelectedCover] = useState(coverOptions[0]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setUploadedImages(prev => [...prev, result]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (spaceName.trim()) {
      onCreate(spaceName.trim(), selectedCover);
      setSpaceName('');
      setSelectedCover(coverOptions[0]);
      setUploadedImages([]);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-96"
          >
            <Card className="glass-card border-white/20">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">Create New Space</h2>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <Close size={20} />
                </Button>
              </div>

              <div className="p-4">
                {/* Space Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Space Name</label>
                  <Input
                    value={spaceName}
                    onChange={(e) => setSpaceName(e.target.value)}
                    placeholder="Enter space name..."
                    className="glass-card bg-white/5 border-white/10"
                  />
                </div>

                {/* Cover Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Choose Cover</label>
                  
                  {/* Upload Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-3 w-full glass-card border-white/20 hover:bg-white/5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Custom Image
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Combined Image Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Uploaded Images */}
                    {uploadedImages.map((image, index) => (
                      <button
                        key={`uploaded-${index}`}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          selectedCover === image
                            ? 'border-dialin-purple shadow-lg shadow-dialin-purple/25'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => setSelectedCover(image)}
                      >
                        <img
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        <button
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUploadedImage(index);
                          }}
                        >
                          <X size={12} className="text-white" />
                        </button>
                      </button>
                    ))}
                    
                    {/* Default Cover Options */}
                    {coverOptions.map((cover, index) => (
                      <button
                        key={`default-${index}`}
                        className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                          selectedCover === cover
                            ? 'border-dialin-purple shadow-lg shadow-dialin-purple/25'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        onClick={() => setSelectedCover(cover)}
                      >
                        <img
                          src={cover}
                          alt={`Cover ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={!spaceName.trim()}
                    className="flex-1 bg-dialin-purple hover:bg-dialin-purple-dark"
                  >
                    Create Space
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}