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
    <div className="flex-none w-[320px] flex flex-col h-full rounded-[2rem] bg-white/70 backdrop-blur-md border-[1px] border-[#fbcfe8] shadow-lg relative pt-10 transition-all hover:border-pink-300 group/column overflow-visible">
      {/* Decorative Labels */}
      <div className="absolute top-4 left-8 text-[7px] font-digital text-green-300 tracking-[0.4em] uppercase font-black opacity-60">REEL_LOG</div>
      <div className="absolute top-4 right-8 text-[7px] font-digital text-green-300 tracking-[0.4em] uppercase font-black opacity-60">FR_{dayNum}</div>
      
      <div className="px-8 pb-4 relative overflow-visible">
        <div className="flex items-center justify-between overflow-visible">
          <div className="relative group cursor-pointer flex-1 overflow-visible" onClick={() => setIsEditingHeader(true)}>
            <span className="font-script text-orange-400 text-xl absolute -top-6 -left-2 -rotate-12 opacity-95 pointer-events-none transition-transform group-hover:scale-110 drop-shadow-[1px_1px_0px_#fff] z-10">Lucky</span>
            
            {isEditingHeader ? (
              <div className="flex items-center gap-2 relative z-20">
                <input 
                  autoFocus
                  className="text-xl font-retro text-[#439c4e] leading-none italic uppercase tracking-tighter bg-white/95 rounded-lg px-2 py-1 border border-green-200 outline-none w-full shadow-md font-korean"
                  value={title}
                  placeholder="LOCATION"
                  onChange={e => onUpdateTitle(e.target.value.toUpperCase())}
                  onBlur={() => setIsEditingHeader(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingHeader(false)}
                />
              </div>
            ) : (
              <h2 className="text-3xl font-retro text-[#439c4e] leading-tight italic uppercase tracking-tighter transition-all hover:scale-[1.01] relative z-0 truncate max-w-[180px]">
                DAY {dayNum}-<span className="text-2xl text-[#439c4e] opacity-90 italic font-korean">{title || 'CITY'}</span>
              </h2>
            )}
          </div>
          
          <div className="flex gap-2 pt-2 print-hide relative z-30">
             <button 
               onClick={() => generateAI(dayNum)} 
               disabled={isGenerating} 
               className="w-9 h-9 bg-white text-orange-400 rounded-full flex items-center justify-center shadow-md border border-white transition-all hover:scale-110 active:scale-90 group/ai"
             >
               {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="group-hover/ai:rotate-12 transition-transform" />}
             </button>
             <button 
               onClick={() => addPlace(dayNum)} 
               className="w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 shadow-md border border-white"
             >
               <Plus size={20} strokeWidth={2.5} />
             </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-2 flex-1 overflow-y-auto custom-scrollbar print:overflow-visible">
        {places.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border-[1px] border-dashed border-green-100 rounded-[1.5rem] text-green-200 print-hide opacity-30">
            <Camera size={32} className="mb-4 opacity-20" />
            <p className="font-retro text-sm uppercase tracking-[0.2em]">EMPTY</p>
          </div>
        ) : (
          <SortableContextAny items={places.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
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
      
      <div className="h-10 flex items-center justify-center opacity-10 pointer-events-none pb-2">
        <Camera size={20} />
      </div>
    </div>
  );
};

export default DayColumn;