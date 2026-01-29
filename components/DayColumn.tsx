import React, { useState } from 'react';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus, Sparkles, Loader2, Camera, Check } from 'lucide-react';
import { Place } from '../types';
import PlaceCard from './PlaceCard';

interface DayColumnProps {
  dayNum: number;
  places: Place[];
  addPlace: (day: number) => void;
  toggleVisited: (id: string) => void;
  updateMemo: (id: string, field: keyof Place, value: any) => void;
  removePlace: (id: string) => void;
  generateAI: (day: number) => void;
  isGenerating: boolean;
  title: string;
  onUpdateTitle: (title: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ 
  dayNum, places, addPlace, toggleVisited, updateMemo, removePlace, generateAI, isGenerating, title, onUpdateTitle
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const SortableContextAny = SortableContext as any;

  return (
    <div className="flex-none w-[340px] flex flex-col h-full rounded-[3.5rem] bg-white/70 backdrop-blur-md border-[5px] border-[#fbcfe8] shadow-lg relative pt-12 transition-all hover:border-pink-300 group/column overflow-visible">
      {/* Decorative Labels */}
      <div className="absolute top-6 left-12 text-[8px] font-digital text-green-300 tracking-[0.4em] uppercase font-black opacity-60">REEL_LOG</div>
      <div className="absolute top-6 right-12 text-[8px] font-digital text-green-300 tracking-[0.4em] uppercase font-black opacity-60">FR_{dayNum}</div>
      
      <div className="px-10 pb-6 relative overflow-visible">
        <div className="flex items-center justify-between overflow-visible">
          <div className="relative group cursor-pointer flex-1 overflow-visible" onClick={() => setIsEditingHeader(true)}>
            <span className="font-script text-orange-400 text-[2.2rem] absolute -top-8 -left-4 -rotate-12 opacity-95 pointer-events-none transition-transform group-hover:scale-110 drop-shadow-[2px_2px_0px_#fff] z-10">Lucky</span>
            
            {isEditingHeader ? (
              <div className="flex items-center gap-2 relative z-20">
                <input 
                  autoFocus
                  className="text-3xl font-retro text-[#439c4e] leading-none italic uppercase tracking-tighter bg-white/95 rounded-xl px-3 py-1.5 border-4 border-green-200 outline-none w-full shadow-md font-korean"
                  value={title}
                  placeholder="LOCATION"
                  onChange={e => onUpdateTitle(e.target.value.toUpperCase())}
                  onBlur={() => setIsEditingHeader(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingHeader(false)}
                />
              </div>
            ) : (
              <h2 className="text-5xl font-retro text-[#439c4e] leading-[0.8] italic uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,0.05)] transition-all hover:scale-[1.02] relative z-0">
                DAY {dayNum}-<br/>
                <span className="text-3xl text-[#439c4e] opacity-90 italic font-korean">{title || 'CITY'}</span>
              </h2>
            )}
          </div>
          
          <div className="flex gap-2.5 pt-4 print-hide relative z-30">
             <button 
               onClick={() => generateAI(dayNum)} 
               disabled={isGenerating} 
               className="w-11 h-11 bg-white text-orange-400 rounded-full flex items-center justify-center shadow-md border-[3px] border-white transition-all hover:scale-110 active:scale-90 group/ai"
             >
               {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="group-hover/ai:rotate-12 transition-transform" />}
             </button>
             <button 
               onClick={() => addPlace(dayNum)} 
               className="w-11 h-11 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 shadow-md border-[3px] border-white pointer-events-auto"
             >
               <Plus size={24} strokeWidth={2.5} />
             </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-3 flex-1 overflow-y-auto custom-scrollbar print:overflow-visible">
        {places.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-[5px] border-dashed border-white/60 rounded-[2.5rem] text-green-200 print-hide opacity-30">
            <Camera size={56} className="mb-5 opacity-20" />
            <p className="font-retro text-xl uppercase tracking-[0.3em]">EMPTY</p>
          </div>
        ) : (
          <SortableContextAny items={places.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {places.map(place => (
                <PlaceCard 
                  key={place.id} 
                  place={place} 
                  toggleVisited={toggleVisited} 
                  updateMemo={updateMemo} 
                  removePlace={removePlace} 
                />
              ))}
            </div>
          </SortableContextAny>
        )}
      </div>
      
      <div className="h-12 flex items-center justify-center opacity-10 pointer-events-none pb-4">
        <Camera size={24} />
      </div>
    </div>
  );
};

export default DayColumn;
