import React, { useState } from 'react';
import { 
  Home, 
  MessageSquare, 
  AlertTriangle, 
  FileText, 
  Menu,
  X,
  Camera,
  Activity
} from 'lucide-react';
import ClickSpark from '../designs/click';
import { AnimatePresence, motion } from 'motion/react';

interface TopNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'vision', label: 'Vision AI', icon: Camera },
    { id: 'telemetry', label: 'IoT Command', icon: Activity },
    { id: 'chatbot', label: 'AI Chatbot', icon: MessageSquare },
    { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle },
    { id: 'reports', label: 'Audit Reports', icon: FileText },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-transparent">
      <div className="flex items-center justify-between w-full px-6 md:px-8 py-4 max-w-full mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('home')}>
          <span className="text-xl font-bold tracking-tighter text-orange-400 font-headline">
            MineRakshak
          </span>
        </div>

        {/* Center: Desktop Nav Menu */}
        <ClickSpark>
          <nav className="hidden md:flex gap-6 items-center justify-center">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`font-headline text-sm font-medium tracking-wide transition-colors relative pb-1 ${
                  activeTab === item.id 
                    ? 'text-orange-400' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-container" />
                )}
              </button>
            ))}
          </nav>
        </ClickSpark>
        
        <button
          className="md:hidden text-slate-300 hover:text-white transition-colors p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Right: Empty spacer for desktop symmetry */}
        <div className="hidden md:block" />
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full right-4 w-56 bg-[#111114]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'text-primary bg-primary/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
