import React, { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { 
  Plane, 
  Plus, 
  Sparkles, 
  ArrowRight,
  X,
  Loader2,
  Download,
  Receipt,
  Users,
  Copy,
  Check
} from 'lucide-react';

import { Place, TripMetadata } from './types';
import DayColumn from './components/DayColumn';
import { generateItinerarySuggestions, getLiveExchangeRate, extractPlaceInfo } from './services/geminiService';

const STORAGE_KEY_PREFIX = 'lucky_arkiv_v11_';

const PixelClover = ({ className, size = 20, color = "#84cc16", opacity = 0.6 }: { className?: string; size?: number; color?: string; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" className={className} style={{ opacity }}>
    <path d="M4 1h2v1h1v1h1v2H7v1H6v1H4V7H3V6H2V4h1V3h1V1z" fill={color} />
  </svg>
);

const InviteModal: React.FC<{ isOpen: boolean; onClose: () => void; tripId: string }> = ({ isOpen, onClose, tripId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}#/trip/${tripId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-green-900/5 backdrop-blur-md">
      <div className="w-full max-w-[260px] bg-white rounded-[2rem] border-[4px] border-[#fbcfe8] p-5 shadow-2xl animate-float text-center">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 rounded-[1.2rem] bg-gradient-to-br from-green-400 to-yellow-300 border-2 border-white flex items-center justify-center text-white">
            <Users size={20} />
          </div>
        </div>
        <h2 className="text-lg font-retro text-orange-500 mb-1 uppercase tracking-tighter">HUB</h2>
        <p className="font-bubbly text-green-600 text-[8px] mb-4 italic opacity-80">"Sync the reel."</p>
        
        <div className="bg-pink-50 p-3 rounded-[1.2rem] border-2 border-white mb-4">
          <label className="text-[7px] font-digital text-pink-300 uppercase tracking-widest block mb-1 text-left">LINK</label>
          <div className="flex gap-2">
            <input 
              readOnly 
              className="bg-white border border-[#fbcfe8] flex-1 py-1.5 px-3 rounded-full text-[8px] font-digital outline-none truncate" 
              value={shareUrl} 
            />
            <button 
              onClick={handleCopy}
              className="w-8 h-8 bg-pink-400 text-white rounded-full flex items-center justify-center hover:bg-pink-500 transition-all shadow-md active:scale-90 flex-shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-green-500 text-white font-black py-2 rounded-full text-[8px] tracking-widest uppercase hover:bg-green-600 transition-all border-2 border-white shadow-lg"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

const AddPlaceModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (data: Partial<Place>) => void }> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const extracted = await extractPlaceInfo(input);
      onAdd(extracted);
      setInput('');
      onClose();
    } catch (e) {
      onAdd({ name: input.split('http')[0].trim() || 'New Entry' });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-green-900/5 backdrop-blur-sm">
      <div className="w-full max-w-[320px] bg-white rounded-[2rem] border-[4px] border-[#fbcfe8] p-5 shadow-2xl animate-float">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-retro text-green-600">NEW_FRAME</h3>
          <button onClick={onClose} className="text-pink-300 hover:scale-110 transition-transform"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[9px] font-digital text-green-400 uppercase tracking-widest leading-relaxed">
            PASTE LINK OR NAME FOR AUTO ARCHIVING.
          </p>
          <input 
            autoFocus
            className="w-full bg-green-50/50 border-2 border-[#fbcfe8] py-3 px-5 rounded-xl font-korean text-green-900 outline-none focus:border-green-400 text-sm shadow-inner"
            placeholder="Place name or URL..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" disabled={loading} className="w-full bg-green-500 text-white font-black py-3 rounded-full flex items-center justify-center gap-2 hover:bg-green-600 transition-all border-2 border-white shadow-lg text-[11px] uppercase tracking-widest">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'ANALYZING...' : 'CAPTURE DATA'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ReceiptModal: React.FC<{ isOpen: boolean; onClose: () => void; places: Place[] }> = ({ isOpen, onClose, places }) => {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ KRW: 1 });
  const [loading, setLoading] = useState(false);

  const parseCost = (costStr: string): { amount: number, currency: string } => {
    const amountMatch = (costStr || "").match(/(\d+(\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
    const clean = (costStr || "").toLowerCase();
    let currency = 'KRW';
    if (clean.includes('yen') || clean.includes('¥') || clean.includes('jpy')) currency = 'JPY';
    else if (clean.includes('usd') || clean.includes('$')) currency = 'USD';
    else if (clean.includes('eur') || clean.includes('€')) currency = 'EUR';
    return { amount, currency };
  };

  const syncRates = useCallback(async () => {
    setLoading(true);
    const currencies = Array.from(new Set(places.map(p => parseCost(p.cost).currency))).filter(c => c !== 'KRW');
    const newRates: Record<string, number> = { KRW: 1 };
    for (const cur of currencies) {
      try {
        const rate = await getLiveExchangeRate(cur, 'KRW');
        newRates[cur] = rate;
      } catch (e) {
        newRates[cur] = 1;
      }
    }
    setExchangeRates(newRates);
    setLoading(false);
  }, [places]);

  useEffect(() => { if (isOpen) syncRates(); }, [isOpen, syncRates]);
  if (!isOpen) return null;

  const totalKRW = places.reduce((sum, p) => {
    const { amount, currency } = parseCost(p.cost);
    const rate = (exchangeRates[currency] || 1) as number;
    return sum + (amount * rate);
  }, 0);

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-lg overflow-y-auto">
      <div className="w-full max-w-[340px] bg-white rounded-t-[2rem] border-x-[4px] border-t-[4px] border-[#fbcfe8] relative animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
        <div className="absolute top-3 right-5 print-hide">
          <button onClick={onClose} className="p-1 bg-pink-50 rounded-full text-pink-400 hover:bg-pink-100"><X size={16} /></button>
        </div>
        <div className="p-6 pt-10 font-digital text-slate-700">
          <div className="text-center mb-5 border-b-2 border-dashed border-slate-200 pb-3">
            <h2 className="text-xl font-retro text-green-600 mb-0.5">ARKIV_RECEIPT</h2>
            <p className="text-[7px] tracking-widest opacity-50 uppercase">{new Date().toLocaleDateString()}</p>
          </div>
          <div className="space-y-3 mb-6 max-h-[250px] overflow-y-auto custom-scrollbar px-1">
            {Array.from(new Set(places.map(p => p.day))).sort((a, b) => a - b).map(day => (
              <div key={day} className="space-y-1.5">
                <div className="text-[8px] font-black text-orange-400 border-b border-orange-50 pb-0.5 mb-1 uppercase">Day {day} Settlements</div>
                {places.filter(p => p.day === day).map(p => {
                  const { amount, currency } = parseCost(p.cost);
                  const rate = (exchangeRates[currency] || 1) as number;
                  const krw = (amount as number) * rate;
                  return (
                    <div key={p.id} className="flex justify-between items-center text-[9px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 uppercase tracking-tighter truncate max-w-[120px] font-korean">{p.name}</span>
                        <span className="text-[6px] opacity-40 uppercase">{amount} {currency}</span>
                      </div>
                      <div className="text-right"><span>₩{Math.round(krw).toLocaleString()}</span></div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t-4 border-double border-slate-200 pt-3 flex justify-between items-end">
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-green-500">Total</span>
                <span className="text-[6px] opacity-40 uppercase tracking-widest">{loading ? 'SYNCING...' : 'SYNCED'}</span>
             </div>
             <div className="text-right"><div className="text-xl font-retro text-orange-500 leading-none">₩{Math.round(totalKRW).toLocaleString()}</div></div>
          </div>
        </div>
        <div className="h-3 w-full bg-[radial-gradient(circle_at_bottom,_transparent_5px,_#ffffff_5px)] bg-[length:10px_10px] bg-repeat-x -mb-3"></div>
      </div>
    </div>
  );
};

export default function App() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [meta, setMeta] = useState<TripMetadata | null>(null);
  const [tripId, setTripId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<Record<number, boolean>>({});
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeDayForAdd, setActiveDayForAdd] = useState<number | null>(null);
  const [tempDest, setTempDest] = useState('');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/trip\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const id = match[1];
        setTripId(id);
        const savedMeta = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}_meta`);
        if (savedMeta) {
          try {
            setMeta(JSON.parse(savedMeta));
          } catch (e) {
            setMeta({ destination: "LUCKY ARCHIVE", duration: 3, dayTitles: {} });
          }
        } else {
          setMeta({ destination: "LUCKY ARCHIVE", duration: 3, dayTitles: {} });
        }
      } else {
        setTripId("");
        setMeta(null);
        setPlaces([]);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!tripId) return;
    const savedPlaces = localStorage.getItem(`${STORAGE_KEY_PREFIX}${tripId}_places`);
    if (savedPlaces) {
      try {
        setPlaces(JSON.parse(savedPlaces));
      } catch (e) {
        console.error("Failed to parse saved places", e);
      }
    }
    
    const channel = new BroadcastChannel(`sync_${tripId}`);
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (data && data.type === 'SYNC_DATA') {
        if (data.places) setPlaces(data.places);
        if (data.meta) setMeta(data.meta);
      }
    };
    return () => channel.close();
  }, [tripId]);

  useEffect(() => {
    if (tripId && meta) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tripId}_places`, JSON.stringify(places));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${tripId}_meta`, JSON.stringify(meta));
      const channel = new BroadcastChannel(`sync_${tripId}`);
      channel.postMessage({ type: 'SYNC_DATA', places, meta });
      channel.close();
    }
  }, [places, meta, tripId]);

  const handleLaunch = () => {
    if (!tempDest.trim()) return;
    const newId = `trip_${Date.now()}`;
    window.location.hash = `/trip/${newId}`;
    setMeta({ destination: tempDest, duration: 3, dayTitles: {} });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlaces((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const overItem = items[newIndex];
        const updated = arrayMove(items, oldIndex, newIndex);
        return updated.map(p => p.id === active.id.toString() && overItem ? { ...p, day: overItem.day } : p);
      });
    }
  };

  const toggleVisited = (id: string) => setPlaces(prev => prev.map(p => p.id === id ? { ...p, visited: !p.visited } : p));
  const updateMemo = (id: string, field: keyof Place, value: any) => setPlaces(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removePlace = (id: string) => setPlaces(prev => prev.filter(p => p.id !== id));

  const handleAddPlace = (day: number, data: Partial<Place>) => {
    const newPlace: Place = {
      id: `pl-${Date.now()}`,
      name: data.name || 'New Place',
      day,
      visited: false,
      transport: data.transport || '',
      cost: data.cost || '',
      description: data.description || '',
      category: data.category || 'POINT',
      photos: [],
      musicLink: ''
    };
    setPlaces([...places, newPlace]);
  };

  const updateDayTitle = (day: number, title: string) => {
    setMeta(prev => {
      if (!prev) return null;
      return {
        ...prev,
        dayTitles: {
          ...(prev.dayTitles || {}),
          [day]: title
        }
      };
    });
  };

  const generateAI = async (day: number) => {
    if (!meta) return;
    setIsGenerating(prev => ({ ...prev, [day]: true }));
    try {
      const suggestions = await generateItinerarySuggestions(meta.destination, day);
      // Clean up AI suggestions to ensure placeholders don't look like final text
      const cleaned = suggestions.map(s => ({
        ...s,
        transport: (s.transport || '').toLowerCase().includes('estimated') ? '' : s.transport,
        cost: (s.cost || '').toLowerCase().includes('estimated') ? '' : s.cost,
        description: (s.description || '').toLowerCase().includes('no description') ? '' : s.description
      }));
      setPlaces(prev => [...prev, ...cleaned]);
    } finally {
      setIsGenerating(prev => ({ ...prev, [day]: false }));
    }
  };

  if (!tripId || !meta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-clover-pixel bg-[#f7fee7] select-none">
        <div className="landing-shape-left"></div>
        <div className="landing-shape-right"></div>
        
        <div className="absolute top-4 left-4 text-[6px] font-digital uppercase tracking-[0.3em] text-green-900/40 z-10">STUDIO: ARKIV</div>
        <div className="absolute top-4 right-4 text-[6px] font-digital uppercase tracking-[0.3em] text-green-900/40 z-10">CORE: V11.0</div>

        <div className="w-full max-w-xl flex flex-col items-center gap-4 z-20">
          <div className="relative text-center">
            <div className="font-script text-orange-500 absolute top-[-1.2rem] left-1/2 transform -translate-x-1/2 text-[2.2rem] md:text-[2.8rem] z-30 pointer-events-none drop-shadow-[2px_2px_0px_#fff]">Lucky</div>
            <h1 className="text-[4.5rem] md:text-[6.5rem] arkiv-logo-3d leading-none italic select-none">ARKIV</h1>
            <div className="text-orange-500 text-[6px] font-black tracking-[1em] uppercase -mt-2 mb-4 flex justify-center w-full">MEMORIES ARCHIVE</div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-5 w-full max-md px-4">
             <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#bef264] to-[#f59e0b] flex items-center justify-center text-white animate-float shadow-lg flex-shrink-0 border-[3px] border-white">
                <Plane size={38} strokeWidth={1.5} />
             </div>

             <div className="flex-1 space-y-2.5">
                <p className="font-bubbly text-green-800 text-sm font-bold leading-tight uppercase tracking-tight max-w-[180px]">
                  BOLD ROOTS. <br/> LAUNCH REEL.
                </p>
                
                <form onSubmit={e => { e.preventDefault(); handleLaunch(); }} className="flex flex-col gap-2.5 w-full">
                  <div className="relative">
                    <input 
                      required 
                      placeholder="DESTINATION..." 
                      className="w-full bg-white border-[2px] border-[#fbcfe8] py-2.5 px-6 rounded-full text-green-900 text-sm font-retro italic placeholder:text-[#bbf7d0] shadow-md focus:shadow-green-50 focus:outline-none transition-all placeholder:not-italic font-korean" 
                      value={tempDest} 
                      onChange={e => setTempDest(e.target.value)} 
                    />
                  </div>
                  
                  <button type="submit" className="bg-[#86efac] hover:bg-[#4ade80] text-white font-black px-6 py-2.5 rounded-full text-sm uppercase transition-all shadow-md active:scale-95 border-[2px] border-white flex items-center justify-center gap-2 w-max group">
                    LAUNCH <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-bubbly relative bg-clover-pixel">
      <header className="px-5 pt-5 pb-2 flex items-center justify-between sticky top-0 z-[100] glass-light print-hide">
        <div className="flex items-center gap-5">
          <div className="relative cursor-pointer hover:scale-105 transition-transform group" onClick={() => { window.location.hash = ''; }}>
             <span className="absolute -top-3 left-0 text-[6px] font-digital text-orange-400 font-black tracking-widest">@LUCKY_STUDIO</span>
             <h2 className="text-2xl arkiv-logo-3d">ARKIV</h2>
          </div>
          <div className="hidden lg:flex flex-col border-l border-[#fbcfe8] pl-5 h-7 justify-center">
            <span className="text-[6px] font-digital text-green-600 tracking-widest uppercase font-black">REEL</span>
            <h1 className="text-base font-retro text-orange-500 uppercase truncate max-w-[150px] italic drop-shadow-sm font-korean">{meta.destination}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setIsInviteOpen(true)} className="px-3 py-1.5 bg-pink-400 text-white rounded-full border-[2px] border-white hover:scale-110 transition-all text-[9px] font-black tracking-widest uppercase flex items-center gap-2 shadow-md">
            <Users size={12} /> COLLAB
          </button>
          <button onClick={() => setIsReceiptOpen(true)} className="px-3 py-1.5 bg-green-500 text-white rounded-full border-[2px] border-white hover:scale-110 transition-all text-[9px] font-black tracking-widest uppercase flex items-center gap-2 shadow-md">
            <Receipt size={12} /> SETTLE
          </button>
          <button onClick={() => window.print()} className="bg-orange-400 text-white font-black px-5 py-1.5 rounded-full text-[9px] tracking-widest uppercase hover:scale-110 transition-all shadow-md border-[2px] border-white flex items-center gap-2">
            <Download size={12} /> EXPORT
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto custom-scrollbar px-5 py-6 relative z-10 flex h-full items-start gap-5 print:block">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {Array.from({ length: meta.duration }, (_, i) => i + 1).map((dayNum) => (
            <DayColumn 
              key={dayNum} 
              dayNum={dayNum} 
              places={places.filter(p => p.day === dayNum)} 
              addPlace={(day) => setActiveDayForAdd(day)} 
              toggleVisited={toggleVisited} 
              updateMemo={updateMemo} 
              removePlace={removePlace} 
              generateAI={generateAI} 
              isGenerating={isGenerating[dayNum]} 
              title={meta.dayTitles?.[dayNum] ?? ''} 
              onUpdateTitle={(val) => updateDayTitle(dayNum, val)}
            />
          ))}
          <button onClick={() => setMeta(p => p ? { ...p, duration: p.duration + 1 } : null)} className="flex-none w-12 h-[240px] bg-white/40 backdrop-blur-sm rounded-[1.8rem] border-[3px] border-dashed border-[#fbcfe8] hover:border-green-400 flex items-center justify-center text-pink-300 hover:text-green-500 transition-all shadow-sm print-hide mt-8"><Plus size={32} className="rotate-90" /></button>
        </DndContext>
      </main>

      <AddPlaceModal isOpen={activeDayForAdd !== null} onClose={() => setActiveDayForAdd(null)} onAdd={(data) => { if (activeDayForAdd !== null) handleAddPlace(activeDayForAdd, data); }} />
      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} tripId={tripId} />
      <ReceiptModal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} places={places} />
      
      <footer className="px-6 py-2 border-t-[2px] border-[#fbcfe8] bg-white/40 backdrop-blur-md flex items-center justify-between z-50 print-hide">
         <div className="flex items-center gap-4">
            <span className="text-[8px] font-digital text-green-600 uppercase tracking-[0.1em] font-black">SYNC</span>
            <div className="w-32 h-2 bg-white rounded-full overflow-hidden border border-[#fbcfe8] shadow-inner">
               <div className="h-full bg-gradient-to-r from-green-300 to-green-500 rounded-full transition-all duration-700" style={{ width: `${places.length > 0 ? (places.filter(p => p.visited).length / (places.length as number)) * 100 : 0}%` }} />
            </div>
         </div>
         <div className="flex items-center gap-4">
            {tripId && (
              <div className="flex items-center gap-2 bg-pink-100/60 px-2.5 py-1 rounded-full border border-white shadow-sm">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase text-pink-500">Live</span>
              </div>
            )}
            <PixelClover size={14} color="#84cc16" opacity={0.7} />
            <span className="text-[8px] font-black tracking-[0.1em] uppercase text-pink-400">v11</span>
         </div>
      </footer>
    </div>
  );
}
