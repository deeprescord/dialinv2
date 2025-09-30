import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Check, Smartphone, Building, Phone, Mail, Home, FileText, Instagram, CreditCard, Heart, Shield, User } from 'lucide-react';

interface ProfileFieldToggle {
  key: string;
  label: string;
  isPublic: boolean;
  icon: string;
  color: string;
}

interface ShareMyBarProps {
  fields: ProfileFieldToggle[];
  sharedFields: string[];
  onToggleChange: (toggleKey: string) => void;
}

export function ShareMyBar({ fields, sharedFields, onToggleChange }: ShareMyBarProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return User;
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
      default: return FileText;
    }
  };

  // Only show private (non-public) fields as toggleable options
  const toggleableFields = fields.filter(field => !field.isPublic);

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
          {toggleableFields.length === 0 ? (
            <p className="text-xs text-muted-foreground">No private fields to share. All fields are public or no fields available.</p>
          ) : (
            toggleableFields.map((field) => {
              const isActive = sharedFields.includes(field.key);
              const IconComponent = getIcon(field.icon);
              
              return (
                <div key={field.key} className="flex flex-col items-center">
                  <div className="relative pt-2 pb-1">
                    <Button
                      variant="ghost"
                      className={`w-16 h-16 p-0 rounded-xl border-none transition-all duration-200 hover:scale-105 ${field.color}`}
                      onClick={() => onToggleChange(field.key)}
                    >
                      <IconComponent size={31} className="text-white" />
                    </Button>
                    {isActive && (
                      <div className="absolute top-0 -right-1 bg-green-400 rounded-full w-6 h-6 flex items-center justify-center border-2 border-black">
                        <Check size={14} className="text-black font-bold" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 text-white max-w-16 leading-tight">
                    {field.label}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}