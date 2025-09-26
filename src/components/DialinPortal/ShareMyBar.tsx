import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Check, Smartphone, Building, Phone, Mail, Home, FileText, Instagram, CreditCard, Heart, Shield } from 'lucide-react';
import { SHARE_TOGGLES } from '@/data/constants';

interface ShareMyBarProps {
  activeToggles: string[];
  onToggleChange: (toggleKey: string) => void;
}

export function ShareMyBar({ activeToggles, onToggleChange }: ShareMyBarProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smartphone': return Smartphone;
      case 'Building': return Building;
      case 'Phone': return Phone;
      case 'Mail': return Mail;
      case 'Home': return Home;
      case 'FileText': return FileText;
      case 'Instagram': return Instagram;
      case 'CreditCard': return CreditCard;
      case 'Heart': return Heart;
      case 'Shield': return Shield;
      default: return Smartphone;
    }
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-6 py-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">SHARE MY:</h3>
      </div>
      
      <div className="flex justify-center gap-3 overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max px-2">
          {SHARE_TOGGLES.map((toggle) => {
            const isActive = activeToggles.includes(toggle.key);
            const IconComponent = getIcon(toggle.icon);
            
            // Define colors to match the screenshot
            const getButtonColor = (key: string) => {
              switch (key) {
                case 'personal': return 'bg-emerald-500';
                case 'workAddress': return 'bg-violet-500';
                case 'workPhone': return 'bg-cyan-500';
                case 'workEmail': return 'bg-blue-500';
                case 'homeAddress': return 'bg-orange-500';
                case 'resume': return 'bg-indigo-500';
                case 'instagram': return 'bg-pink-500';
                case 'driversLicense': return 'bg-yellow-500';
                case 'medicalHistory': return 'bg-red-500';
                case 'insurance': return 'bg-teal-500';
                default: return 'bg-gray-500';
              }
            };
            
            return (
              <div key={toggle.key} className="flex flex-col items-center">
                <div className="relative">
                  <Button
                    variant="ghost"
                    className={`w-16 h-16 p-0 rounded-xl border-none transition-all duration-200 hover:scale-105 ${getButtonColor(toggle.key)}`}
                    onClick={() => onToggleChange(toggle.key)}
                  >
                    <IconComponent size={24} className="text-white" />
                  </Button>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-green-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                      <Check size={14} className="text-black font-bold" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-center mt-2 text-white max-w-16 leading-tight">
                  {toggle.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}