import React from 'react';
import { motion } from 'motion/react';
import { Tool } from '../types';
import * as Icons from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const Icon = (Icons as any)[tool.icon];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tool)}
      className="relative group cursor-pointer"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${tool.color} rounded-2xl blur opacity-20 group-hover:opacity-80 transition duration-500`}></div>
      
      <div className="relative bg-[#121212] border border-white/10 rounded-2xl p-6 h-full flex flex-col items-center text-center overflow-hidden backdrop-blur-sm">
        {/* Techy Background Pattern */}
        <div className="absolute top-0 right-0 p-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
          <Icon size={140} />
        </div>

        {/* Scanning Line (Card Specific) */}
        <motion.div 
          initial={{ top: '-10%' }}
          whileHover={{ top: '110%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-white/20 blur-[2px] z-10 pointer-events-none opacity-0 group-hover:opacity-100"
        />

        <div className={`p-4 rounded-xl bg-gradient-to-br ${tool.color} mb-5 shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow`}>
          <Icon className="text-white" size={32} />
        </div>

        <h3 className="text-xl font-black text-white mb-2 tracking-tight uppercase italic">{tool.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{tool.description}</p>

        {/* Arc Reactor Style Detail */}
        <div className="mt-8 relative">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full opacity-30 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-400 rounded-full blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </motion.div>
  );
};
