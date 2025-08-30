import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Close, Send } from '../icons';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

// Force refresh to resolve Input reference error

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function AIChat({ isOpen, onClose }: AIChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus input when opening on mobile
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I understand your question. Let me help you with that!',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            onClick={onClose}
          />

          {/* Chat Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md h-[70vh] max-h-[600px] z-50"
          >
            <div className="bg-background/95 backdrop-blur-xl border-0 md:border border-border md:rounded-2xl shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-background/90 md:bg-transparent">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Always ready to help</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  <Close size={16} />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.isUser
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 opacity-70 ${
                        msg.isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-background/90 md:bg-transparent">
                <div className="flex space-x-2 items-end">
                  <Textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-muted/50 border-muted focus:border-primary resize-none min-h-[60px] max-h-[120px]"
                    autoFocus
                    rows={2}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    size="sm"
                    className="px-3 h-10"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}