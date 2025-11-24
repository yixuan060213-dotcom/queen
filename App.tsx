
import React, { useState, useRef, useEffect } from 'react';
import { GameState, Outfit, ChatMessage, MaleLead, SaveData } from './types';
import { MAIN_SCENARIO, OUTFITS, MALE_LEADS } from './constants';
import { initializeGemini, startScenarioChat, sendPlayerMessage, resumeScenarioChat } from './services/geminiService';
import VoiceInput from './components/VoiceInput';
import { Send, Sparkles, Heart, Baby, Crown, MessageCircle, ArrowLeft, LogIn, Trash2, LogOut, ZoomIn, X, Check, Camera, Share2, Copy } from 'lucide-react';

const SAVE_KEY = 'queens_wardrobe_save_v2';

const App: React.FC = () => {
  // --- STATE ---
  const [apiKey, setApiKey] = useState('');
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [activeTab, setActiveTab] = useState<'ADVENTURE' | 'HAREM'>('ADVENTURE');
  const [hasSaveData, setHasSaveData] = useState(false);
  
  // Game Data
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<MaleLead[]>([]);
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  
  // Gacha State
  const [gachaIndex, setGachaIndex] = useState(0);
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  
  // UI State
  const [viewingLead, setViewingLead] = useState<MaleLead | null>(null); // For Modal
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareText, setShareText] = useState('剧情已复制');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  
  // Check for Save Data on Mount
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
        setHasSaveData(true);
    }
  }, []);

  // Save Game Logic
  useEffect(() => {
    if (gameState === GameState.PLAYING && selectedOutfit && selectedLeads.length > 0 && messages.length > 0) {
        const saveData: SaveData = {
            selectedOutfit,
            selectedLeads,
            messages,
            chatHistory: [],
            customImages
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.error("Save failed, quota exceeded?", e);
        }
    }
  }, [messages, selectedLeads, selectedOutfit, gameState, customImages]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'ADVENTURE') {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Gacha Animation Loop
  useEffect(() => {
    let interval: any;
    if (gameState === GameState.TALENT_GACHA && isGachaRolling) {
        interval = setInterval(() => {
            setGachaIndex((prev) => (prev + 1) % OUTFITS.length);
        }, 80); // Faster shuffle
    }
    return () => clearInterval(interval);
  }, [gameState, isGachaRolling]);

  // --- UTILS ---

  const getLeadImage = (lead: MaleLead) => {
      return customImages[lead.id] || lead.image;
  };

  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 800;
                  const scaleSize = MAX_WIDTH / img.width;
                  const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
                  const height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
                  
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx?.drawImage(img, 0, 0, width, height);
                  
                  // Compress to JPEG 0.7
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                  resolve(dataUrl);
              };
              img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
      });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !viewingLead) return;

      try {
          const base64 = await compressImage(file);
          setCustomImages(prev => ({
              ...prev,
              [viewingLead.id]: base64
          }));
      } catch (err) {
          console.error("Image upload failed", err);
          alert("图片处理失败，请重试");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = () => {
      fileInputRef.current?.click();
  };

  const handleShare = () => {
      // If we are in playing mode, copy the last few messages as a story snippet
      if (gameState === GameState.PLAYING && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          const textToCopy = `【${selectedOutfit?.name}】\n剧情片段：\n${lastMsg.text.substring(0, 100)}...\n(来自：随机天赋无限穿越)`;
          navigator.clipboard.writeText(textToCopy);
          setShareText('剧情已复制');
      } else {
          // Fallback to URL copy with warning
          navigator.clipboard.writeText(window.location.href);
          setShareText('链接已复制 (仅本地可用)');
      }
      
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
  };

  // --- HANDLERS ---

  const resetGame = () => {
      setGameState(GameState.INTRO);
      setMessages([]);
      setSelectedLeads([]);
      setSelectedOutfit(null);
      setActiveTab('ADVENTURE');
      setInputText('');
      setViewingLead(null);
  };

  const handleStartNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      initializeGemini(apiKey);
      localStorage.removeItem(SAVE_KEY); // Clear old save
      
      setGameState(GameState.WARP_ANIMATION);
      setTimeout(() => {
        setGameState(GameState.TALENT_GACHA);
        setIsGachaRolling(true);
      }, 3000);
    }
  };

  const handleResumeGame = (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKey.trim()) return;
      
      const savedStr = localStorage.getItem(SAVE_KEY);
      if (!savedStr) return;

      try {
          const saved: SaveData = JSON.parse(savedStr);
          initializeGemini(apiKey);
          setSelectedOutfit(saved.selectedOutfit);
          setSelectedLeads(saved.selectedLeads);
          setMessages(saved.messages);
          if (saved.customImages) setCustomImages(saved.customImages);
          
          setIsProcessing(true);
          // Restore Gemini Session
          resumeScenarioChat(saved.selectedOutfit, saved.selectedLeads, saved.messages)
            .then(() => {
                setGameState(GameState.PLAYING);
            })
            .catch(() => {
                alert("存档数据过期或不兼容，请开启新轮回。");
            })
            .finally(() => {
                setIsProcessing(false);
            });

      } catch (err) {
          console.error("Failed to load save", err);
      }
  };

  const stopGacha = () => {
      setIsGachaRolling(false);
      const finalIndex = Math.floor(Math.random() * OUTFITS.length);
      setGachaIndex(finalIndex);
      setSelectedOutfit(OUTFITS[finalIndex]);
      
      setTimeout(() => {
          setGameState(GameState.TALENT_REVEAL);
      }, 600);
  };

  const goToCharacterSelect = () => {
    setGameState(GameState.CHARACTER_SELECT);
  };

  const toggleLeadSelection = (lead: MaleLead) => {
    if (selectedLeads.find(l => l.id === lead.id)) {
      setSelectedLeads(prev => prev.filter(l => l.id !== lead.id));
    } else {
      setSelectedLeads(prev => [...prev, lead]);
    }
  };

  const startGame = async () => {
    if (!selectedOutfit || selectedLeads.length === 0) return;
    
    setGameState(GameState.PLAYING);
    setIsProcessing(true);
    setActiveTab('ADVENTURE');
    
    try {
      const initialResponse = await startScenarioChat(MAIN_SCENARIO, selectedOutfit, selectedLeads);
      setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
    } catch (err) {
      alert("位面连接失败，请检查密钥。");
      setGameState(GameState.INTRO);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const msgToSend = text || inputText;
    if (!msgToSend.trim() || isProcessing) return;

    const isSystem = msgToSend.startsWith("[系统指令]");
    
    if (!isSystem) {
        const userMsg: ChatMessage = { role: 'user', text: msgToSend, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
    }
    
    setInputText('');
    setIsProcessing(true);

    try {
      const responseText = await sendPlayerMessage(msgToSend);
      setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummon = (leadId: string) => {
    const lead = selectedLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    setSelectedLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, favorability: Math.min(l.favorability + 10, 100), haremStatus: '侍君' } : l
    ));
    
    setActiveTab('ADVENTURE');
    handleSendMessage(`[系统指令]: 玩家选择了【侍寝】对象：${lead.name}。请描述这一夜的旖旎，他可能会因为过于激动而发抖，或者不敢触碰你。`);
  };

  const handleGift = (leadId: string) => {
    const lead = selectedLeads.find(l => l.id === leadId);
    if (!lead) return;

    setSelectedLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, favorability: Math.min(l.favorability + 5, 100) } : l
    ));

    setActiveTab('ADVENTURE');
    handleSendMessage(`[系统指令]: 玩家【赏赐】了 ${lead.name} 一件珍贵的礼物。他此刻是什么表情？`);
  };

  const handleImpregnate = (leadId: string) => {
    const lead = selectedLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    const newProg = Math.min(lead.pregnancy + 20, 100);
    setSelectedLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, pregnancy: newProg } : l
    ));

    setActiveTab('ADVENTURE');
    if (newProg === 20) {
        handleSendMessage(`[系统指令]: 玩家赐予了 ${lead.name} 子嗣。他得知自己怀上纯血血脉后的反应？(参考Mpreg: 狂喜、流泪、甚至有些不敢置信)`);
    } else {
        handleSendMessage(`[系统指令]: ${lead.name} 的孕育值增加了。他是否会变得更加粘人？`);
    }
  };

  // --- RENDERERS ---

  // 1. INTRO
  if (gameState === GameState.INTRO) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans text-white p-4">
         {/* Share Toast */}
         {showShareToast && (
             <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full font-bold shadow-xl z-[100] animate-fade-in flex items-center gap-2">
                 <Check className="w-4 h-4" /> {shareText}
             </div>
         )}
         
         <div className="z-10 w-full max-w-lg p-10 text-center animate-fade-in relative">
            
            <div className="absolute inset-0 bg-purple-900/10 backdrop-blur-3xl rounded-3xl -z-10 border border-white/5 shadow-2xl"></div>

            <div className="mb-6 inline-block relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                <Sparkles className="w-16 h-16 text-purple-300 mx-auto relative z-10" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-100 to-purple-400 title-font mb-4 drop-shadow-lg tracking-tight">
              随机天赋<br/><span className="text-4xl md:text-5xl font-light tracking-[0.2em] text-purple-200">无限穿越</span>
            </h1>
            
            <p className="text-purple-200/60 mb-10 font-light tracking-widest uppercase text-xs">
              Random Talent · Infinite Crossing · Otome Game
            </p>
            
            <div className="space-y-6">
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="请输入时空密钥 (API Key)"
                    className="w-full bg-black/30 border border-white/10 text-white px-6 py-4 rounded-xl focus:outline-none focus:border-purple-400/50 focus:bg-black/50 transition-all text-center tracking-wider placeholder-gray-500 shadow-inner"
                />

                <div className="grid grid-cols-1 gap-4">
                     {hasSaveData && (
                        <button 
                            onClick={handleResumeGame}
                            className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all backdrop-blur-md group"
                        >
                            <LogIn className="w-5 h-5 text-purple-300 group-hover:text-white transition-colors" />
                            <span>继续前缘 (读取存档)</span>
                        </button>
                    )}

                    <div className="pt-4 border-t border-white/10">
                        <button 
                            onClick={handleStartNewGame}
                            className="w-full bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(126,34,206,0.3)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                        >
                            <Sparkles className="w-5 h-5" />
                            开启新轮回
                        </button>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  // 2. WARP ANIMATION
  if (gameState === GameState.WARP_ANIMATION) {
      return (
          <div className="warp-container">
              {[...Array(30)].map((_, i) => (
                  <div key={i} className="warp-line" style={{ 
                      left: `${Math.random() * 100}%`, 
                      top: `${Math.random() * 100}%`,
                      animationDuration: `${Math.random() * 0.5 + 0.2}s`,
                      height: `${Math.random() * 200 + 100}px`
                  }}></div>
              ))}
              <div className="z-10 flex flex-col items-center gap-4">
                 <div className="text-white text-3xl font-black tracking-[0.5em] animate-pulse drop-shadow-[0_0_10px_white]">
                    位面跃迁中
                 </div>
                 <div className="text-purple-300 text-sm tracking-widest uppercase">
                    Syncing Timeline...
                 </div>
              </div>
          </div>
      );
  }

  // 3. TALENT GACHA
  if (gameState === GameState.TALENT_GACHA) {
      const currentOutfit = OUTFITS[gachaIndex];
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 mb-12 title-font z-10 animate-pulse drop-shadow-lg">
                正在匹配本命天赋...
              </h2>
              
              <div className="relative z-10 mb-16 perspective-1000 group">
                  <div className="absolute -inset-4 bg-purple-500/30 blur-2xl rounded-full opacity-50 animate-pulse"></div>
                  <div className={`w-[320px] h-[500px] bg-gray-900 rounded-3xl border border-purple-500/50 relative overflow-hidden transform transition-all duration-100 shadow-[0_0_50px_rgba(168,85,247,0.2)]`}>
                       <img src={currentOutfit.image} className="w-full h-full object-cover opacity-60 mix-blend-lighten" alt="Talent" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px]">
                            <span className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">?</span>
                       </div>
                  </div>
              </div>

              <button 
                onClick={stopGacha}
                className="z-10 bg-white text-black px-16 py-5 rounded-full font-black text-xl tracking-[0.3em] hover:scale-105 hover:bg-purple-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] border-4 border-transparent hover:border-purple-200"
              >
                  命运抽取
              </button>
          </div>
      )
  }

  // 4. TALENT REVEAL
  if (gameState === GameState.TALENT_REVEAL && selectedOutfit) {
    return (
      <div className="min-h-screen text-white p-6 flex flex-col items-center justify-center relative">
        <header className="text-center mb-8 z-10 fade-in">
          <h2 className="text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-200 title-font font-black mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            抽取成功
          </h2>
          <p className="text-amber-200/60 tracking-[0.5em] text-sm uppercase">Destiny Unlocked</p>
        </header>

        <div className="max-w-md w-full z-10 fade-in">
            <div 
              className={`group relative bg-black/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 transition-all duration-700 hover:shadow-[0_0_60px_rgba(168,85,247,0.3)] ${selectedOutfit.style}`}
            >
              <div className="h-80 overflow-hidden relative">
                 <img src={selectedOutfit.image} alt={selectedOutfit.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                 <div className="absolute bottom-4 left-6">
                    <div className="text-xs font-bold text-amber-300 mb-1 uppercase tracking-[0.2em] border border-amber-300/50 px-2 py-0.5 rounded-full inline-block backdrop-blur-md">SSS级天赋</div>
                    <h3 className="text-3xl font-bold text-white title-font drop-shadow-md">{selectedOutfit.name}</h3>
                 </div>
              </div>
              
              <div className="p-8">
                <div className="mb-8">
                    <span className="text-purple-300 font-bold text-lg block mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> 
                        {selectedOutfit.powerName}
                    </span>
                    <p className="text-gray-300 text-base leading-relaxed font-light">{selectedOutfit.powerEffect}</p>
                </div>
                
                <button 
                    onClick={goToCharacterSelect}
                    className="w-full bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                    前往选妃 <Crown className="w-5 h-5" />
                </button>
              </div>
            </div>
        </div>
      </div>
    );
  }

  // 5. CHARACTER SELECT
  if (gameState === GameState.CHARACTER_SELECT) {
      return (
        <div className="min-h-screen text-white p-6 pb-32 overflow-y-auto">
            {/* Modal for Details */}
            {viewingLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-gray-900 border border-purple-500/30 rounded-3xl max-w-4xl w-full h-[85vh] md:h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
                        <button 
                            onClick={() => setViewingLead(null)}
                            className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white text-white hover:text-black transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <button 
                            onClick={triggerFileUpload}
                            className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white text-white hover:text-black transition-colors flex items-center gap-2 pr-4 border border-white/20"
                            title="上传自定义立绘"
                        >
                            <Camera className="w-5 h-5" />
                            <span className="text-xs font-bold">换脸</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        
                        {/* Image Side - Fixed to show full image */}
                        <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-gray-950 flex items-center justify-center">
                            <img src={getLeadImage(viewingLead)} className="w-full h-full object-contain md:object-cover" alt={viewingLead.name} />
                            <div className="absolute inset-0 pointer-events-none md:bg-gradient-to-r from-transparent via-transparent to-gray-900"></div>
                        </div>
                        
                        {/* Info Side */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="mb-6">
                                <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider border border-purple-500/30">
                                    {viewingLead.species}
                                </span>
                            </div>
                            <h2 className="text-4xl font-bold title-font mb-2">{viewingLead.name}</h2>
                            <h3 className="text-xl text-gray-400 mb-6">{viewingLead.archetype}</h3>
                            
                            <div className="space-y-6 text-gray-300 leading-relaxed font-light">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <ZoomIn className="w-4 h-4 text-purple-400" /> 外貌特征
                                    </h4>
                                    <p>{viewingLead.appearance}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-pink-400" /> 性格/执念
                                    </h4>
                                    <p>{viewingLead.personality}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 italic text-purple-200/80">
                                    "{viewingLead.obsessionType}"
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <button 
                                    onClick={() => {
                                        toggleLeadSelection(viewingLead);
                                        setViewingLead(null);
                                    }}
                                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                        selectedLeads.find(l => l.id === viewingLead.id)
                                        ? 'bg-red-900/50 text-red-200 border border-red-500/50 hover:bg-red-900/80'
                                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                    }`}
                                >
                                    {selectedLeads.find(l => l.id === viewingLead.id) ? (
                                        <> <Trash2 className="w-5 h-5" /> 移出后宫 </>
                                    ) : (
                                        <> <Check className="w-5 h-5" /> 纳入后宫 </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-10 fade-in flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-30 py-4 px-2 rounded-xl border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-1 title-font">选择攻略目标</h2>
                        <p className="text-gray-400 text-sm">点击卡片查看详情，可更换立绘</p>
                    </div>
                    <button 
                        onClick={resetGame}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/20"
                    >
                        <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">重置轮回</span>
                    </button>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 mb-8">
                    {MALE_LEADS.map(lead => {
                        const isSelected = selectedLeads.some(l => l.id === lead.id);
                        return (
                            <div 
                                key={lead.id}
                                onClick={() => setViewingLead(lead)}
                                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 group aspect-[3/5] flex flex-col ${
                                    isSelected 
                                    ? 'ring-2 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-[1.02]' 
                                    : 'border border-white/10 hover:border-white/30 hover:-translate-y-2'
                                }`}
                            >
                                <div className="absolute inset-0">
                                    <img src={getLeadImage(lead)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={lead.name} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                                </div>
                                
                                {isSelected && (
                                    <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-purple-600/90 backdrop-blur text-white p-2 rounded-full shadow-lg z-20 animate-pulse">
                                        <Heart className="w-4 h-4 md:w-5 md:h-5 fill-white" />
                                    </div>
                                )}
                                
                                <div className="absolute top-2 left-2 md:top-4 md:left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur rounded-full p-2">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 z-20 flex flex-col h-1/2 justify-end">
                                    <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                        <div className="text-[10px] md:text-xs font-bold text-purple-300 mb-2 uppercase tracking-widest border border-purple-500/30 px-2 py-1 rounded w-fit bg-black/40 backdrop-blur">{lead.species}</div>
                                        <h3 className="text-xl md:text-2xl font-bold text-white title-font mb-1">{lead.name}</h3>
                                        <p className="text-xs md:text-sm text-gray-300 font-medium mb-4">{lead.archetype}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 pb-8 flex justify-center z-50 pointer-events-none">
                    <button 
                        onClick={startGame}
                        disabled={selectedLeads.length === 0}
                        className="pointer-events-auto bg-white text-black hover:bg-purple-100 disabled:bg-gray-800 disabled:text-gray-600 px-16 py-4 rounded-full font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all flex items-center gap-3 transform hover:-translate-y-1"
                    >
                        <Sparkles className={`w-5 h-5 ${selectedLeads.length > 0 ? 'fill-black' : ''}`} />
                        {selectedLeads.length === 0 ? '请选择你的男宠' : `进入世界 (${selectedLeads.length}人)`}
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // 6. PLAYING
  if (gameState === GameState.PLAYING && selectedOutfit) {
    return (
      <div className="h-screen flex flex-col text-gray-100 overflow-hidden font-sans relative">
         {/* Share Toast */}
         {showShareToast && (
             <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-full font-bold shadow-xl z-[100] animate-fade-in flex items-center gap-2">
                 <Check className="w-4 h-4" /> {shareText}
             </div>
         )}

        {/* Top Info Bar */}
        <div className="h-16 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-30">
             <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/5">
                <button 
                    onClick={() => setActiveTab('ADVENTURE')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all text-sm font-bold ${
                        activeTab === 'ADVENTURE' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    剧情
                </button>
                <button 
                    onClick={() => setActiveTab('HAREM')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all text-sm font-bold ${
                        activeTab === 'HAREM' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <Crown className="w-4 h-4" />
                    后宫
                </button>
             </div>

             <div className="flex items-center gap-2 md:gap-4">
                <button 
                    onClick={handleShare}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-colors text-purple-200"
                    title="复制剧情/链接"
                >
                    <Copy className="w-4 h-4" />
                </button>
                <div className="hidden md:flex items-center gap-2 bg-purple-900/30 px-4 py-1.5 rounded-full border border-purple-500/30 backdrop-blur">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-200 tracking-wide">天赋: {selectedOutfit.powerName}</span>
                </div>
                <button 
                    onClick={() => {
                        if(confirm('确定要结束当前轮回吗？这将返回主页并清除当前会话。')) {
                            resetGame();
                        }
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-300 rounded-full border border-red-500/10 transition-colors text-sm" 
                    title="退出当前轮回"
                >
                    <LogOut className="w-4 h-4" />
                    结束
                </button>
             </div>
        </div>

        {/* --- TAB CONTENT: ADVENTURE (CHAT) --- */}
        {activeTab === 'ADVENTURE' && (
            <>
                <div className="flex-grow overflow-y-auto p-4 md:p-8 space-y-8 relative scroll-smooth z-10 custom-scrollbar">
                    <div className="max-w-3xl mx-auto pb-32">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-black/50 overflow-hidden mr-4 mt-1 shrink-0 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                        <img src={getLeadImage(selectedLeads[0])} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                
                                <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-6 text-base md:text-lg leading-relaxed font-light tracking-wide shadow-xl backdrop-blur-xl ${
                                    msg.role === 'user' 
                                        ? 'bg-purple-900/40 text-white rounded-tr-none border border-purple-500/30' 
                                        : 'bg-gray-900/60 text-gray-100 rounded-tl-none border border-white/10'
                                }`}>
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className="mb-4 last:mb-0 min-h-[1em]">{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {isProcessing && (
                            <div className="flex justify-start animate-pulse">
                                <div className="ml-14 flex items-center gap-2 text-purple-300 text-sm bg-purple-900/20 px-4 py-2 rounded-full border border-purple-500/20">
                                    <Sparkles className="w-3 h-3" />
                                    <span>对方正在输入...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>
                </div>

                <div className="bg-[#050505]/80 backdrop-blur-xl border-t border-white/10 p-6 shrink-0 z-20">
                    <div className="max-w-3xl mx-auto flex items-end gap-4">
                        <div className="flex-grow relative group transition-all">
                            <textarea 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="描述你的行动，或对他们下达命令..."
                                className="w-full bg-white/5 text-white rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-purple-500/50 resize-none overflow-hidden transition-all min-h-[64px] border border-white/10 placeholder-gray-500 shadow-inner"
                                rows={1}
                            />
                            <div className="absolute right-3 bottom-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                <VoiceInput onTranscript={(text) => setInputText(text)} isProcessing={isProcessing} />
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isProcessing}
                            className="bg-white text-black rounded-full p-4 hover:bg-purple-200 hover:scale-105 transition-all disabled:opacity-50 disabled:bg-gray-600 disabled:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <Send className="w-6 h-6 ml-0.5" />
                        </button>
                    </div>
                </div>
            </>
        )}

        {/* --- TAB CONTENT: HAREM MANAGEMENT --- */}
        {activeTab === 'HAREM' && (
            <div className="flex-grow overflow-y-auto p-4 md:p-8 z-10">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 pb-20">
                    {selectedLeads.map(lead => (
                        <div key={lead.id} className="bg-gray-900/40 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 hover:border-purple-400/80 transition-all duration-500 group hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] hover:-translate-y-2 relative">
                            <div className="relative h-48 overflow-hidden">
                                <img src={getLeadImage(lead)} className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-700 ease-in-out" alt={lead.name} />
                                <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/20 mix-blend-overlay transition-colors duration-700 pointer-events-none"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                                <div className="absolute bottom-4 left-6">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                        {lead.name}
                                        <span className="text-[10px] bg-white/10 backdrop-blur text-purple-200 px-2 py-1 rounded border border-white/10 uppercase tracking-wider">{lead.species}</span>
                                    </h3>
                                    <p className="text-sm text-gray-300 mt-1">{lead.archetype}</p>
                                </div>
                                <div className="absolute top-4 right-4">
                                     <div className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                                         lead.haremStatus === '敌对' ? 'bg-red-500/20 border-red-500/50 text-red-200' :
                                         lead.haremStatus === '陌生人' ? 'bg-gray-500/20 border-gray-500/50 text-gray-200' :
                                         'bg-pink-500/20 border-pink-500/50 text-pink-200'
                                     }`}>
                                        {lead.haremStatus}
                                     </div>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Stats */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                                            <span>Favor (好感)</span>
                                            <span>{lead.favorability}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-1000" style={{ width: `${lead.favorability}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                                            <span className="flex items-center gap-1"><Baby className="w-3 h-3" /> Imprint (孕育)</span>
                                            <span>{lead.pregnancy}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${lead.pregnancy}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-3 gap-3 pt-2">
                                    <button 
                                        onClick={() => handleSummon(lead.id)}
                                        className="flex flex-col items-center justify-center p-3 bg-purple-600/10 hover:bg-purple-600/30 border border-purple-500/20 hover:border-purple-500/50 rounded-xl transition-all gap-2 text-xs font-bold text-purple-200 group/btn"
                                    >
                                        <Crown className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        <span>侍寝</span>
                                    </button>
                                    <button 
                                        onClick={() => handleGift(lead.id)}
                                        className="flex flex-col items-center justify-center p-3 bg-amber-600/10 hover:bg-amber-600/30 border border-amber-500/20 hover:border-amber-500/50 rounded-xl transition-all gap-2 text-xs font-bold text-amber-200 group/btn"
                                    >
                                        <Heart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        <span>赏赐</span>
                                    </button>
                                    <button 
                                        onClick={() => handleImpregnate(lead.id)}
                                        className="flex flex-col items-center justify-center p-3 bg-cyan-600/10 hover:bg-cyan-600/30 border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl transition-all gap-2 text-xs font-bold text-cyan-200 group/btn"
                                    >
                                        <Baby className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        <span>赐子</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    );
  }

  return <div>Loading...</div>;
};

export default App;
