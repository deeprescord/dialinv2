import { Home, Grid, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface FOSSidebarProps {
  selectedSpace: string;
  onSelectSpace: (space: string) => void;
}

export function FOSSidebar({ selectedSpace, onSelectSpace }: FOSSidebarProps) {
  const navItems = [
    { id: 'all', label: 'All Items', icon: Grid },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'shared', label: 'Shared', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 glass border-r border-border/20 p-4"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">FOS</h1>
        <p className="text-sm text-muted-foreground">Field Operating System</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = selectedSpace === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectSpace(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
