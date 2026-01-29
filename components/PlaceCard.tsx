import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  CheckCircle, 
  Circle, 
  GripVertical, 
  Sparkles, 
  Languages, 
  Loader2, 
  MapPin,
  Camera,
  Music,
  ExternalLink,
  X,
  Upload
} from 'lucide-react';
import { Place } from '../types';
import { getQuickTip, translateText } from '../services/geminiService';

interface PlaceCardProps {
  place: Place;
  toggleVisited: (id: string) => void;
  updateMemo: (id: string, field: keyof Place, value: any) => void;
  removePlace: (id: string) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, toggleVisited, updateMemo, removePlace }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: place.id });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingTip, setLoadingTip] = useState(false);
  const [loadingTranslate, setLoadingTranslate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    zIndex: isDragging ? 999 : 'auto' 
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateMemo(place.id, 'photos', [...(place.photos || []), base64String]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (idx: number) => {
    const newPhotos = [...(place.photos || [])];
    newPhotos.splice(idx, 1);
    updateMemo(place.id, 'photos', newPhotos);
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative rounded-[2rem] bg-white shadow-md overflow-hidden transition-all duration-400 border-[2px] border-white hover:border-[#fbcfe8] ${isDragging ? 'opacity-50 scale-95' : ''} ${place.visited ? 'grayscale-[0.6] opacity-70' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div {...attributes} {...listeners} className="p-1.5 bg-pink-50 rounded-lg text-pink-300 cursor-grab hover:text-pink-500 transition-colors print-hide"><GripVertical size={14} /></div>
          <button onClick={() => toggleVisited(place.id)} className={`p-1.5 rounded-full transition-all border ${place.visited ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-300 border-green-100 shadow-inner'}`}>
            {place.visited ? <CheckCircle size={14} /> : <Circle size={14} />}
          </button>
        </div>

        <div className="cursor-pointer group relative" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="font-script text-orange-400 text-base absolute -top-5 left-0 opacity-80 pointer-events-none italic">Capture...</span>
          <span className="text-[7px] font-digital text-green-500 uppercase tracking-[0.3em] mt-1.5 block">{place.category || 'DATAPOINT'}</span>
          <h3 className="text-xl font-retro text-slate-800 group-hover:text-green-600 transition-colors mt-0.5 leading-tight italic uppercase tracking-tighter font-korean">{place.name}</h3>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-3 duration-400">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[8px] font-digital text-green-600 uppercase tracking-widest">PHOTOS</label>
                <div className="flex gap-1.5 print-hide">
                  <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"><Upload size={12} /></button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar min-h-[60px]">
                {place.photos?.map((photo, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-[1.2rem] overflow-hidden border border-pink-50 shadow-sm group">
                    <img src={photo} className="w-full h-full object-cover" alt="Memory" />
                    <button onClick={() => removePhoto(idx)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 print-hide"><X size={8} /></button>
                  </div>
                ))}
                {(!place.photos || place.photos.length === 0) && (
                  <div className="w-full h-16 border border-dashed border-green-100 rounded-[1.2rem] flex flex-col items-center justify-center text-[8px] text-green-200 uppercase font-digital tracking-widest shadow-inner">
                    <span>EMPTY</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-50/30 to-white p-3 rounded-[1.2rem] border border-white space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5"><Music size={12} className="text-pink-400" /><label className="text-[8px] font-digital text-pink-400 uppercase tracking-widest">SONIC</label></div>
              <div className="flex gap-2">
                <input className="bg-transparent flex-1 outline-none font-bubbly text-pink-900 text-[10px] placeholder:text-pink-100" value={place.musicLink || ''} onChange={(e) => updateMemo(place.id, 'musicLink', e.target.value)} placeholder="SEARCH..." />
                {place.musicLink && <a href={place.musicLink} target="_blank" rel="noreferrer" className="bg-white p-1 rounded-md text-pink-400 hover:scale-105"><ExternalLink size={12} /></a>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50/20 p-3 rounded-[1.2rem] border border-white">
                <label className="text-[7px] font-digital text-green-600 uppercase tracking-widest block mb-0.5">LOGS</label>
                <input className="bg-transparent w-full outline-none font-bubbly text-green-900 text-[9px] italic font-korean" value={place.transport || ''} onChange={(e) => updateMemo(place.id, 'transport', e.target.value)} placeholder="" />
              </div>
              <div className="bg-orange-50/20 p-3 rounded-[1.2rem] border border-white">
                <label className="text-[7px] font-digital text-orange-600 uppercase tracking-widest block mb-0.5">COST</label>
                <input className="bg-transparent w-full outline-none font-bubbly text-orange-900 text-[9px] font-bold font-korean" value={place.cost || ''} onChange={(e) => updateMemo(place.id, 'cost', e.target.value)} placeholder="" />
              </div>
            </div>

            <div className="bg-white p-3 rounded-[1.5rem] border border-[#fbcfe8] relative shadow-xs">
               <textarea className="bg-transparent w-full outline-none text-slate-700 leading-normal font-bubbly text-[10px] resize-none custom-scrollbar font-korean" rows={3} value={place.description || ''} onChange={(e) => updateMemo(place.id, 'description', e.target.value)} placeholder="" />
               <div className="flex gap-1.5 absolute bottom-1.5 right-3 print-hide">
                  <button onClick={async (e) => { e.stopPropagation(); setLoadingTranslate(true); try { const res = await translateText(place.description); updateMemo(place.id, 'description', res); } finally { setLoadingTranslate(false); } }} className="bg-white p-1 rounded-md text-pink-100 hover:text-green-500 border border-pink-50">{loadingTranslate ? <Loader2 size={10} className="animate-spin" /> : <Languages size={12} />}</button>
                  <button onClick={async (e) => { e.stopPropagation(); setLoadingTip(true); try { const tip = await getQuickTip(place.name); updateMemo(place.id, 'description', `${place.description}\n\n✨ TIP: ${tip}`.trim()); } finally { setLoadingTip(false); } }} className="bg-white p-1 rounded-md text-pink-100 hover:text-orange-500 border border-pink-50">{loadingTip ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={12} />}</button>
               </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#fbcfe8]">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`} target="_blank" className="text-green-600 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 hover:translate-x-0.5 transition-transform bg-white px-2.5 py-1 rounded-full border border-green-50 shadow-xs"><MapPin size={10} /> MAP</a>
              <button onClick={() => removePlace(place.id)} className="text-pink-50 hover:text-red-500 transition-all print-hide"><Trash2 size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;