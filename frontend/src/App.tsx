/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TopNavBar } from './components/TopNavBar';
import { Footer } from './components/Footer';
import { HomeScreen } from './components/HomeScreen';
import { ChatScreen } from './components/ChatScreen';
import { AlertsScreen } from './components/AlertsScreen';
import { AuditScreen } from './components/AuditScreen';
import { VisionInspectorScreen } from './components/VisionInspectorScreen';
import { TelemetryScreen } from './components/TelemetryScreen';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onLaunch={() => setActiveTab('vision')} />;
      case 'vision':
        return <VisionInspectorScreen />;
      case 'telemetry':
        return <TelemetryScreen />;
      case 'chatbot':
        return <ChatScreen />;
      case 'alerts':
        return <AlertsScreen />;
      case 'reports':
        return <AuditScreen />;
      default:
        return <HomeScreen onLaunch={() => setActiveTab('vision')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-on-surface">
      <TopNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className={`flex-grow ${activeTab === 'home' ? '' : 'max-w-10xl mx-auto w-full px-4 md:px-10 lg:px-20 xl:px-40 pt-20'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
