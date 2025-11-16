import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Network, CheckSquare } from 'lucide-react';
import { useSelection } from '@/contexts/SelectionContext';

interface FloatingActionButtonsProps {
  onAddClick: () => void;
  onAIClick: () => void;
  onChatClick: () => void;
  onDOSClick: () => void;
}

export function FloatingActionButtons({
  onAddClick,
  onAIClick,
  onChatClick,
  onDOSClick
}: FloatingActionButtonsProps) {
  const { isSelectMode, toggleSelectMode } = useSelection();
  const buttonSize = 56; // Compact size
  const iconSize = 24;

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      {/* Add Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex items-center justify-center glass-card border-white/30 hover:bg-white/10 hover:border-primary/50 rounded-xl shadow-lg backdrop-blur-md"
          style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          onClick={onAddClick}
          aria-label="Add"
        >
          <PlusCircle size={iconSize} className="text-green-400" />
        </Button>
      </motion.div>

      {/* AI Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex items-center justify-center glass-card border-white/30 hover:bg-white/10 hover:border-primary/50 rounded-xl shadow-lg backdrop-blur-md"
          style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          onClick={onAIClick}
          aria-label="AI"
        >
          <Bot size={iconSize} className="text-blue-400" />
        </Button>
      </motion.div>

      {/* Chat Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex items-center justify-center glass-card border-white/30 hover:bg-white/10 hover:border-primary/50 rounded-xl shadow-lg backdrop-blur-md"
          style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          onClick={onChatClick}
          aria-label="Chat"
        >
          <MessageSquare size={iconSize} className="text-purple-400" />
        </Button>
      </motion.div>

      {/* DOS Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex items-center justify-center glass-card border-white/30 hover:bg-white/10 hover:border-primary/50 rounded-xl shadow-lg backdrop-blur-md"
          style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          onClick={onDOSClick}
          aria-label="DOS Panel"
        >
          <Network size={iconSize} className="text-orange-400" />
        </Button>
      </motion.div>

      {/* Select Mode Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Button
          variant={isSelectMode ? "default" : "outline"}
          size="sm"
          className={`flex items-center justify-center rounded-xl shadow-lg backdrop-blur-md ${
            isSelectMode 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'glass-card border-white/30 hover:bg-white/10 hover:border-primary/50'
          }`}
          style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
          onClick={toggleSelectMode}
          aria-label="Select Mode"
        >
          <CheckSquare size={iconSize} className={isSelectMode ? "text-primary-foreground" : "text-yellow-400"} />
        </Button>
      </motion.div>
    </div>
  );
}
