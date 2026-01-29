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

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!place.description) return;
    setLoadingTranslate(true);
    try {
      const res = await translateText(place.description);
      updateMemo(place.id, 'description', res);
    } catch (err) {
      console.error("Translate error:", err);
    } finally {
      setLoadingTranslate(false);
    }
  };

  const handleTip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingTip(true);
    try {
      const tip = await getQuickTip(place.name);
      updateMemo(place.id, 'description', `${place.description}\n\n✨ TIP: ${tip}`.trim());
    } catch (err) {
      console.error("Tip error:", err);
    } finally {
      setLoadingTip(false);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative rounded-[1.2rem] bg-white shadow-sm overflow-hidden transition-all duration-400 border border-slate-100 hover:border-[#fbcfe8] ${isDragging ? 'opacity-50 scale-95' : ''} ${place.visited ? 'grayscale-[0.6] opacity-70' : ''}`}>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <div {...attributes} {...listeners} className="p-1 bg-pink-50 rounded text-pink-300 cursor-grab hover:text-pink-500 transition-colors print-hide"><GripVertical size={12} /></div>
          <button onClick={() => toggleVisited(place.id)} className={`p-1 rounded-full transition-all border ${place.visited ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-300 border-green-100'}`}>
            {place.visited ? <CheckCircle size={12} /> : <Circle size={12} />}
          </button>
        </div>

        <div className="cursor-pointer group relative" onClick={() => setIsExpanded(!isExpanded)}>
          <span className="text-[6px] font-digital text-green-500 uppercase tracking-[0.2em] block">{place.category || 'DATAPOINT'}</span>
          <h3 className="text-lg font-retro text-slate-800 group-hover:text-green-600 transition-colors mt-0.5 leading-tight italic uppercase tracking-tight font-korean">{place.name}</h3>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[7px] font-digital text-green-600 uppercase tracking-widest">GALLERY</label>
                <button onClick={() => fileInputRef.current?.click()} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-all print-hide"><Upload size={10} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar min-h-[50px]">
                {place.photos?.map((photo, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-50 shadow-xs group">
                    <img src={photo} className="w-full h-full object-cover" alt="Memory" />
                    <button onClick={() => removePhoto(idx)} className="absolute top-0.5 right-0.5 p-0.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity print-hide"><X size={6} /></button>
                  </div>
                ))}
                {(!place.photos || place.photos.length === 0) && (
                  <div className="w-full h-12 border border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center text-[7px] text-slate-200 font-digital tracking-widest">
                    <span>EMPTY</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50/50 p-2 rounded-xl border border-white space-y-1 shadow-xs">
              <div className="flex items-center gap-1"><Music size={10} className="text-pink-400" /><label className="text-[7px] font-digital text-pink-400 uppercase tracking-widest">MUSIC</label></div>
              <div className="flex gap-1.5">
                <input className="bg-transparent flex-1 outline-none font-korean text-pink-900 text-[9px] placeholder:text-pink-100" value={place.musicLink || ''} onChange={(e) => updateMemo(place.id, 'musicLink', e.target.value)} placeholder="URL..." />
                {place.musicLink && <a href={place.musicLink} target="_blank" rel="noreferrer" className="bg-white p-1 rounded text-pink-400 border border-slate-50"><ExternalLink size={10} /></a>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50/30 p-2 rounded-xl border border-white">
                <label className="text-[6px] font-digital text-green-600 uppercase tracking-widest block mb-0.5">LOGS</label>
                <input className="bg-transparent w-full outline-none font-korean text-green-900 text-[8px]" value={place.transport || ''} onChange={(e) => updateMemo(place.id, 'transport', e.target.value)} placeholder="..." />
              </div>
              <div className="bg-slate-50/30 p-2 rounded-xl border border-white">
                <label className="text-[6px] font-digital text-orange-600 uppercase tracking-widest block mb-0.5">COST</label>
                <input className="bg-transparent w-full outline-none font-korean text-orange-900 text-[8px] font-bold" value={place.cost || ''} onChange={(e) => updateMemo(place.id, 'cost', e.target.value)} placeholder="..." />
              </div>
            </div>

            <div className="bg-white p-2 rounded-xl border border-slate-100 relative shadow-inner">
               <textarea className="bg-transparent w-full outline-none text-slate-700 leading-tight font-korean text-[9px] resize-none custom-scrollbar" rows={2} value={place.description || ''} onChange={(e) => updateMemo(place.id, 'description', e.target.value)} placeholder="Notes..." />
               <div className="flex gap-1 absolute bottom-1 right-2 print-hide">
                  <button onClick={handleTranslate} title="Translate" className="bg-white p-1 rounded text-slate-300 hover:text-green-500 border border-slate-50 transition-colors shadow-xs">{loadingTranslate ? <Loader2 size={10} className="animate-spin" /> : <Languages size={10} />}</button>
                  <button onClick={handleTip} title="AI Tip" className="bg-white p-1 rounded text-slate-300 hover:text-orange-500 border border-slate-50 transition-colors shadow-xs">{loadingTip ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}</button>
               </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`} target="_blank" className="text-green-600 text-[7px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-green-700 bg-white px-2 py-0.5 rounded border border-slate-50 shadow-xs"><MapPin size={8} /> MAP</a>
              <button onClick={() => removePlace(place.id)} className="text-slate-100 hover:text-red-400 transition-colors print-hide"><Trash2 size={12} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceCard;