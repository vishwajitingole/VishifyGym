import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Hash,
  Phone,
  ShoppingBag,
  Store,
  Zap
} from 'lucide-react';
import { useState } from 'react';

const App = () => {
  const [formData, setFormData] = useState({
    storeId: "91KSF458",
    orderId: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5), // HH:MM
    orderType: "1",
    amount: "",
    phone: "910000000000"
  });

  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVars = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateLink = () => {
    setIsGenerating(true);
    
    // Simulate processing for visual effect
    setTimeout(() => {
      // --- EXACT LOGIC FROM YOUR HTML CODE ---
      let timeInput = formData.time;
      if (timeInput.length === 5) timeInput += ":00";
      const fullTime = timeInput + ".000";
      
      const data = {
        "S": formData.storeId,
        "OI": formData.orderId,
        "D": formData.date,
        "TM": fullTime,
        "DTM": `${formData.date}T${fullTime}Z`,
        "TI": formData.orderId, // TI matches OI in your logic
        "OT": formData.orderType,
        "SM": formData.amount || "0.0",
        "PH": formData.phone
      };

      const jsonString = JSON.stringify(data);
      const encodedData = btoa(jsonString);
      const baseUrl = "https://customer.kfc-listens.com/jfe/form/SV_8bHC0noyvM3jPWC";
      
      setGeneratedUrl(`${baseUrl}?Q_EED=${encodedData}`);
      setIsGenerating(false);
    }, 600);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-white"
      >
        {/* Header Section */}
        <div className="bg-[#e4002b] p-8 text-white relative overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }} 
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -right-8 -top-8"
          >
            <Store size={180} />
          </motion.div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="bg-white/20 p-1 rounded-lg backdrop-blur-md">
                <Zap className="fill-yellow-400 text-yellow-400" size={16} />
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-90">Conquer your Targets</span>
            </motion.div>
            <h1 className="text-3xl font-black tracking-tighter italic">Survey Master GEN <span className="text-red-200 text-xl font-normal not-italic">v3.0</span></h1>
          </div>
        </div>

        {/* Form Section */}
        <motion.div 
          variants={containerVars}
          initial="hidden"
          animate="visible"
          className="p-7 space-y-5"
        >
          {/* Store ID Input */}
          <motion.div variants={itemVars} className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
              <Store size={12} className="text-red-500" /> Store ID Reference
            </label>
            <input 
              name="storeId"
              value={formData.storeId}
              onChange={handleChange}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none"
            />
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <Hash size={12} className="text-red-500" /> Order ID
              </label>
              <input 
                name="orderId"
                placeholder="Ex: 910"
                value={formData.orderId}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none"
              />
            </motion.div>
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <CreditCard size={12} className="text-red-500" /> Amount
              </label>
              <input 
                name="amount"
                type="number"
                placeholder="4.00"
                value={formData.amount}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <Calendar size={12} className="text-red-500" /> Date
              </label>
              <input 
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none text-sm"
              />
            </motion.div>
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <Clock size={12} className="text-red-500" /> Time
              </label>
              <input 
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none text-sm"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <ShoppingBag size={12} className="text-red-500" /> Order Mode
              </label>
              <select 
                name="orderType"
                value={formData.orderType}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none appearance-none"
              >
                <option value="1">Dine-in</option>
                <option value="2">Takeaway</option>
                <option value="3">Delivery</option>
                <option value="4">Drive-Thru</option>
              </select>
            </motion.div>
            <motion.div variants={itemVars} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center gap-2 ml-1 uppercase tracking-widest">
                <Phone size={12} className="text-red-500" /> Phone
              </label>
              <input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 text-slate-800 font-bold focus:border-red-500 focus:bg-white transition-all outline-none"
              />
            </motion.div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#b91c1c' }}
            whileTap={{ scale: 0.98 }}
            onClick={generateLink}
            disabled={isGenerating || !formData.orderId}
            className={`w-full py-4 rounded-2xl font-black text-white shadow-[0_10px_25px_rgba(228,0,43,0.3)] transition-all flex items-center justify-center gap-3 mt-2 ${
              !formData.orderId ? 'bg-slate-300 shadow-none cursor-not-allowed' : 'bg-[#e4002b]'
            }`}
          >
            {isGenerating ? (
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>GENERATE SECURE LINK <ArrowRight size={20} /></>
            )}
          </motion.button>
        </motion.div>

        {/* Result Area */}
        <AnimatePresence>
          {generatedUrl && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-7 pb-8"
            >
              <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Encrypted Output</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-xl p-3 mb-5 border border-white/5">
                    <p className="text-[11px] font-mono break-all opacity-60 leading-relaxed line-clamp-2">
                        {generatedUrl}
                    </p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex-[2] bg-white/10 hover:bg-white/20 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wider border border-white/10"
                  >
                    {copied ? <CheckCircle2 className="text-green-400" size={16} /> : <Copy size={16} />}
                    {copied ? "SUCCESS" : "COPY LINK"}
                  </button>
                  <a 
                    href={generatedUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-[#e4002b] hover:bg-[#ff1a4a] py-3.5 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <div className="fixed bottom-6 flex flex-col items-center gap-1 opacity-30">
        
        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Internal Logic v3.0</p>
        <div className="h-0.5  bg-slate-900 rounded-full">
          Note :- Toggle Order Mode incase if the link isn't working
        </div>
      </div>
    </div>
  );
};

export default App;