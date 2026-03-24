import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tool } from '../types';
import { pdfService } from '../services/pdfService';
import { X, Upload, FileText, CheckCircle, Loader2, Download, AlertCircle, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ToolModalProps {
  tool: Tool;
  onClose: () => void;
}

export const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiResult, setAiResult] = useState<string>('');
  const [processedResult, setProcessedResult] = useState<Blob | Uint8Array | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const downloadBlob = (blob: Blob | Uint8Array, fileName: string) => {
    const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setStatus('processing');
    setErrorMessage('');

    try {
      let result: Blob | Uint8Array | null = null;
      let extension = '';

      switch (tool.id) {
        case 'pdf-merge':
          result = await pdfService.mergePdfs(files);
          extension = '.pdf';
          break;
        case 'image-to-pdf':
          result = await pdfService.imagesToPdf(files);
          extension = '.pdf';
          break;
        case 'add-watermark':
          result = await pdfService.addWatermark(files[0], watermarkText);
          extension = '.pdf';
          break;
        case 'pdf-to-word':
          result = await pdfService.pdfToWord(files[0]);
          extension = '.docx';
          break;
        case 'ppt-to-pdf':
          result = await pdfService.pptToPdf(files[0]);
          extension = '.pdf';
          break;
        case 'word-to-pdf':
          result = await pdfService.wordToPdf(files[0]);
          extension = '.pdf';
          break;
        case 'ai-analyzer':
          const analysis = await pdfService.analyzePdfWithAi(files[0], aiPrompt);
          setAiResult(analysis);
          result = new TextEncoder().encode(analysis);
          extension = '.txt';
          break;
      }

      if (result) {
        setProcessedResult(result);
        setSelectedExtension(extension);
        setCustomFileName(`processed_${Date.now()}`);
        setStatus('success');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff0000', '#ffd700', '#ffffff']
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An error occurred during processing.');
    }
  };

  const handleDownload = async () => {
    if (!processedResult) return;

    let finalResult = processedResult;
    const ext = selectedExtension.startsWith('.') ? selectedExtension.toLowerCase() : `.${selectedExtension.toLowerCase()}`;
    const fileName = `${customFileName || 'processed'}${ext}`;

    // If it's an AI analyzer result, we might need to convert the text to PDF or Word
    if (tool.id === 'ai-analyzer' && aiResult) {
      if (ext === '.pdf') {
        finalResult = await pdfService.textToPdf(aiResult);
      } else if (ext === '.docx' || ext === '.doc') {
        finalResult = await pdfService.textToWord(aiResult);
      }
    }

    downloadBlob(finalResult, fileName);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-[#121212] border border-red-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/20"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color}`}>
              <Upload className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{tool.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Cpu className="text-blue-400" size={16} />
                  </div>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                    JARVIS: Awaiting your files, sir.
                  </p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-red-500/20 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all group relative overflow-hidden"
                >
                  {/* Background Grid */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                  
                  <Upload className="text-red-500 mb-4 group-hover:scale-110 transition-transform relative z-10" size={48} />
                  <p className="text-xl font-black text-white mb-2 relative z-10 uppercase italic">Upload Assets</p>
                  <p className="text-gray-400 text-sm relative z-10">Drag and drop or click to browse</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple={tool.id === 'pdf-merge' || tool.id === 'image-to-pdf'}
                    accept={tool.id === 'image-to-pdf' ? 'image/*' : tool.id === 'word-to-pdf' ? '.doc,.docx' : tool.id === 'ppt-to-pdf' ? '.ppt,.pptx' : '.pdf'}
                  />
                </div>

                {files.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-red-500" />
                      Loaded Assets ({files.length})
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {files.map((file, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={idx} 
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/30 transition-colors"
                        >
                          <span className="text-gray-300 text-xs truncate max-w-[80%] font-medium">{file.name}</span>
                          <span className="text-gray-500 text-[10px] font-bold uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {tool.id === 'add-watermark' && (
                  <div className="space-y-2">
                    <label className="text-white text-[10px] font-black uppercase tracking-widest">Watermark Text</label>
                    <input 
                      type="text" 
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors font-medium"
                      placeholder="Enter watermark text..."
                    />
                  </div>
                )}

                {tool.id === 'ai-analyzer' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-white text-[10px] font-black uppercase tracking-widest">AI Analysis Request</label>
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors font-medium min-h-[100px] resize-none"
                        placeholder="e.g., Summarize this PDF, Explain page 5, Extract key points..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Summarize this PDF',
                        'Extract key points',
                        'Explain page 1',
                        'Translate to Spanish'
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAiPrompt(suggestion)}
                          className="text-[10px] text-left p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-red-500/50 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  disabled={files.length === 0}
                  onClick={processFiles}
                  className={`w-full py-4 rounded-xl font-black text-white transition-all shadow-lg uppercase tracking-[0.2em] italic ${
                    files.length > 0 
                    ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-red-500/40' 
                    : 'bg-gray-800 cursor-not-allowed text-gray-500'
                  }`}
                >
                  INITIATE PROTOCOL
                </button>
              </motion.div>
            )}

            {status === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-cyan-400/20 animate-pulse flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">Processing Data</h3>
                  <p className="text-gray-400 font-medium">JARVIS is reconfiguring the document structure...</p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="p-6 rounded-full bg-green-500/10 border border-green-500/30">
                    <CheckCircle className="text-green-500" size={48} />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -inset-4 border-2 border-green-500/20 rounded-full"
                  />
                </div>
                <div className="text-center w-full max-w-sm space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1 uppercase italic">Protocol Complete</h3>
                    <p className="text-gray-400 text-sm font-medium">Assets successfully reconfigured. Please name your file.</p>
                  </div>

                  {aiResult && (
                    <div className="space-y-2 text-left">
                      <label className="text-white text-[10px] font-black uppercase tracking-widest">AI Analysis Result</label>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm max-h-60 overflow-y-auto custom-scrollbar font-medium leading-relaxed whitespace-pre-wrap">
                        {aiResult}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <label className="text-white text-[10px] font-black uppercase tracking-widest">Output Filename</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customFileName}
                        onChange={(e) => setCustomFileName(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-red-500 outline-none transition-colors font-medium"
                        placeholder="Enter filename..."
                      />
                      <input 
                        type="text" 
                        value={selectedExtension}
                        onChange={(e) => setSelectedExtension(e.target.value)}
                        className="w-20 bg-white/5 border border-white/10 rounded-xl p-3 text-gray-400 focus:text-white focus:border-red-500 outline-none transition-colors font-bold text-center"
                        placeholder=".ext"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDownload}
                      className="w-full py-4 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Assets
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest transition-all"
                    >
                      Return to Base
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center justify-center space-y-8"
              >
                <div className="p-8 rounded-full bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="text-red-500" size={64} />
                </div>
                <div className="text-center">
                  <h3 className="text-3xl font-black text-white mb-2 uppercase italic">System Failure</h3>
                  <p className="text-red-400 mb-8 font-medium">{errorMessage}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                  >
                    Re-Initialize
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Detail */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <div className="w-6 h-6 rounded-full bg-cyan-400/80 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
