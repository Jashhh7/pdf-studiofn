import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tool } from './types';
import { ToolCard } from './components/ToolCard';
import { ToolModal } from './components/ToolModal';
import { InfoModal } from './components/InfoModal';
import { JarvisAssistant } from './components/JarvisAssistant';
import { Shield, Zap } from 'lucide-react';

const TOOLS: Tool[] = [
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Extract text from PDF and convert it to a Word document.',
    icon: 'FileText',
    color: 'from-blue-600 to-blue-400',
  },
  {
    id: 'ppt-to-pdf',
    title: 'PPT to PDF',
    description: 'Convert your PowerPoint presentations into high-quality PDFs.',
    icon: 'Presentation',
    color: 'from-orange-600 to-orange-400',
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert your Word documents into high-quality PDFs.',
    icon: 'FileCode',
    color: 'from-indigo-600 to-indigo-400',
  },
  {
    id: 'pdf-merge',
    title: 'PDF Merge',
    description: 'Combine multiple PDF files into a single document.',
    icon: 'Merge',
    color: 'from-red-600 to-red-400',
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Convert JPG or PNG images into a single PDF file.',
    icon: 'Image',
    color: 'from-emerald-600 to-emerald-400',
  },
  {
    id: 'add-watermark',
    title: 'Add Watermark',
    description: 'Protect your PDFs with a custom text watermark.',
    icon: 'Stamp',
    color: 'from-purple-600 to-purple-400',
  },
  {
    id: 'ai-analyzer',
    title: 'AI File Analyzer',
    description: 'Summarize, explain, extract key points, and translate your PDF content using JARVIS AI.',
    icon: 'Brain',
    color: 'from-cyan-600 to-cyan-400',
  },
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeInfo, setActiveInfo] = useState<'Privacy' | 'Terms' | 'Security' | 'Contact' | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-500/30 font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-900/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
        
        {/* Scanning Line Effect */}
        <motion.div 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10"
        />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 group cursor-pointer"
            onClick={() => setSelectedTool(null)}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-red-500 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Shield className="text-white" size={24} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                PDF <span className="text-red-500">STUDIO</span>
              </h1>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">System Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Zap size={14} />
            Next-Gen Document Processing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
          >
            UNLEASH THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-gold-500 to-red-600">POWER</span> OF PDF
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Advanced Stark-grade algorithms for all your document needs. Fast, secure, and built for the future.
          </motion.p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              <ToolCard tool={tool} onClick={setSelectedTool} />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Shield size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Stark Industries © 2026</span>
          </div>
          <div className="flex items-center gap-8">
            {['Privacy', 'Terms', 'Security', 'Contact'].map((item) => (
              <button 
                key={item} 
                onClick={() => setActiveInfo(item as any)}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {selectedTool && (
          <ToolModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
        )}
        {activeInfo && (
          <InfoModal type={activeInfo} onClose={() => setActiveInfo(null)} />
        )}
      </AnimatePresence>

      <JarvisAssistant tools={TOOLS} onTriggerTool={setSelectedTool} />
    </div>
  );
}
