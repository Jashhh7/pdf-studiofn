import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, FileText, Mail, Info } from 'lucide-react';

interface InfoModalProps {
  type: 'Privacy' | 'Terms' | 'Security' | 'Contact' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const getContent = () => {
    switch (type) {
      case 'Privacy':
        return {
          title: 'Privacy Protocol',
          icon: Lock,
          content: `
            Your data is processed with Stark-grade encryption. 
            We do not store your documents on our servers. 
            All processing happens in volatile memory and is purged immediately after download.
            
            - No tracking cookies
            - No data harvesting
            - 100% ephemeral processing
          `
        };
      case 'Terms':
        return {
          title: 'Terms of Service',
          icon: FileText,
          content: `
            By using iLovePDF 3000, you agree to the Stark Industries Digital Usage Agreement.
            The software is provided "as is" with no guarantees of world-saving capabilities.
            
            - Use for good, not evil
            - Do not attempt to reverse engineer JARVIS
            - Stark Industries is not liable for accidental AI uprisings
          `
        };
      case 'Security':
        return {
          title: 'Security Clearance',
          icon: Shield,
          content: `
            Our security protocols are managed by the latest Mark 3000 Security Suite.
            - End-to-end encryption for all transfers
            - Automated vulnerability scanning
            - Secure sandbox environment for document conversion
          `
        };
      case 'Contact':
        return {
          title: 'Contact Support',
          icon: Mail,
          content: `
            Need assistance with your protocols?
            Reach out to the Stark Industries Support Team.
            
            Email: support@starkindustries.com
            Location: Stark Tower, New York City
            JARVIS Frequency: 142.8 MHz
          `
        };
      default:
        return {
          title: 'Information',
          icon: Info,
          content: ''
        };
    }
  };

  const { title, icon: Icon, content } = getContent();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600"></div>
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Icon size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase italic">{title}</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 text-gray-400 leading-relaxed">
            {content.split('\n').map((line, i) => (
              <p key={i}>{line.trim()}</p>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
            >
              Close Protocol
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
