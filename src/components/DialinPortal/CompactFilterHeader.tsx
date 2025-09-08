import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Filter, X, RotateCcw } from 'lucide-react';

interface FilterConfig {
  key: string;
  label: string;
  options: string[];
}

interface CompactFilterHeaderProps {
  filters: FilterConfig[];
  selectedFilters: Record<string, string[]>;
  onFilterChange: (filterKey: string, values: string[]) => void;
  onClearAll: () => void;
  title: string;
  subtitle: string;
}

export function CompactFilterHeader({
  filters,
  selectedFilters,
  onFilterChange,
  onClearAll,
  title,
  subtitle
}: CompactFilterHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (acc, values) => acc + values.length, 0
  );

  const getSliderValue = (filterKey: string, options: string[]) => {
    const selected = selectedFilters[filterKey] || [];
    if (selected.length === 0) return [0];
    
    // For single selection, return the index
    if (selected.length === 1) {
      return [options.indexOf(selected[0]) + 1];
    }
    
    // For multiple selections, return a range
    const indices = selected.map(val => options.indexOf(val)).sort((a, b) => a - b);
    return [indices[0] + 1, indices[indices.length - 1] + 1];
  };

  const handleSliderChange = (filterKey: string, options: string[], values: number[]) => {
    if (values.length === 1) {
      // Single value slider
      if (values[0] === 0) {
        onFilterChange(filterKey, []);
      } else {
        onFilterChange(filterKey, [options[values[0] - 1]]);
      }
    } else {
      // Range slider
      const selectedOptions = [];
      for (let i = values[0] - 1; i <= values[1] - 1; i++) {
        if (i >= 0 && i < options.length) {
          selectedOptions.push(options[i]);
        }
      }
      onFilterChange(filterKey, selectedOptions);
    }
  };

  const getDisplayValue = (filterKey: string, options: string[]) => {
    const selected = selectedFilters[filterKey] || [];
    if (selected.length === 0) return 'None';
    if (selected.length === 1) return selected[0];
    return `${selected.length} selected`;
  };

  return (
    <div className="relative bg-background/95 backdrop-blur-md border-b border-white/10">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {totalSelectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={16} className="mr-1" />
                Clear All
              </Button>
            )}
            
            <Button
              variant={isExpanded ? "default" : "outline"}
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative"
            >
              <Filter size={16} className="mr-2" />
              Filters
              {totalSelectedCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 bg-primary text-primary-foreground min-w-5 h-5 p-0 flex items-center justify-center text-xs"
                >
                  {totalSelectedCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Selected Filters Preview */}
        {totalSelectedCount > 0 && !isExpanded && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(selectedFilters).map(([key, values]) => 
              values.map(value => (
                <Badge
                  key={`${key}-${value}`}
                  variant="secondary"
                  className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                  onClick={() => {
                    const newValues = values.filter(v => v !== value);
                    onFilterChange(key, newValues);
                  }}
                >
                  {value}
                  <X size={12} className="ml-1" />
                </Badge>
              ))
            )}
          </div>
        )}
      </div>

      {/* Expanded Filter Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">{filter.label}</label>
                      <span className="text-xs text-muted-foreground">
                        {getDisplayValue(filter.key, filter.options)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={getSliderValue(filter.key, filter.options)}
                        onValueChange={(values) => handleSliderChange(filter.key, filter.options, values)}
                        min={0}
                        max={filter.options.length}
                        step={1}
                        className="w-full"
                      />
                      
                      {/* Option Labels */}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>None</span>
                        {filter.options.length > 2 && (
                          <span className="flex-1 text-center">
                            {filter.options[Math.floor(filter.options.length / 2)]}
                          </span>
                        )}
                        <span>{filter.options[filter.options.length - 1]}</span>
                      </div>
                    </div>

                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-1">
                      {filter.options.slice(0, 3).map((option) => {
                        const isSelected = (selectedFilters[filter.key] || []).includes(option);
                        return (
                          <Button
                            key={option}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              const current = selectedFilters[filter.key] || [];
                              const newValues = isSelected
                                ? current.filter(v => v !== option)
                                : [...current, option];
                              onFilterChange(filter.key, newValues);
                            }}
                          >
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}