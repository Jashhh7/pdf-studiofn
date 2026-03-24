import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, Terminal, Cpu } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Tool } from '../types';

interface JarvisAssistantProps {
  tools: Tool[];
  onTriggerTool: (tool: Tool) => void;
}

export const JarvisAssistant: React.FC<JarvisAssistantProps> = ({ tools, onTriggerTool }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'jarvis', text: string }[]>([
    { role: 'jarvis', text: 'Systems online. How can I assist with your document protocols today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setMessages(prev => [...prev, { role: 'jarvis', text: "Microphone access denied. Please check your browser permissions." }]);
        } else if (event.error === 'no-speech') {
          // Silent failure is often better for "no speech"
        } else {
          setMessages(prev => [...prev, { role: 'jarvis', text: `Neural link error: ${event.error}. Please try again.` }]);
        }
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessages(prev => [...prev, { role: 'user', text: transcript }]);
        handleJarvisResponse(transcript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleJarvisResponse = async (userInput: string) => {
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userInput,
        config: {
          systemInstruction: `You are JARVIS, Tony Stark's AI. You assist the user with the "PDF STUDIO" suite.
          Available protocols: ${tools.map(t => t.title).join(', ')}.
          If the user wants to use a tool, respond with a short confirmation and include the EXACT tool title in square brackets, e.g., "Initiating the [PDF Merge] protocol now."
          Keep your tone professional, witty, and Stark-themed.`,
        },
      });

      const response = await model;
      const text = response.text || "Protocol error. Please retry.";
      
      setMessages(prev => [...prev, { role: 'jarvis', text }]);

      // Check for tool triggers
      const match = text.match(/\[(.*?)\]/);
      if (match) {
        const toolTitle = match[1];
        const tool = tools.find(t => t.title.toLowerCase() === toolTitle.toLowerCase());
        if (tool) {
          setTimeout(() => {
            onTriggerTool(tool);
            setIsOpen(false);
          }, 1500);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'jarvis', text: "Connection to Stark Satellite lost. Please check your uplink." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    handleJarvisResponse(userMsg);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMessages(prev => [...prev, { role: 'jarvis', text: "Voice recognition is not supported in this browser environment." }]);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        // If it was already running, just stop it
        recognitionRef.current.stop();
      }
    }
  };

  return (
    <>
      {/* JARVIS Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-full bg-black border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] group overflow-hidden"
      >
        <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
        <div className="relative">
          <Cpu className={`text-red-500 transition-all duration-500 ${isOpen ? 'rotate-180 scale-125' : ''}`} size={28} />
        </div>
        <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-ping opacity-20"></div>
      </motion.button>

      {/* JARVIS Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="fixed bottom-28 right-8 z-[60] w-80 md:w-96 h-[500px] bg-black/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-red-500/20 bg-red-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-red-500">JARVIS Protocol</span>
              </div>
              <Terminal size={14} className="text-red-500/50" />
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-red-500/20"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white rounded-tr-none' 
                      : 'bg-white/5 text-gray-300 border border-white/10 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-red-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-red-500 rounded-full" />
                    <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-red-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-red-500/20 bg-black/50">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter command..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  type="submit"
                  className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[8px] text-center text-gray-600 mt-2 uppercase tracking-widest font-bold">Encrypted Neural Uplink Active</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
