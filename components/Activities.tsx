import React, { useState, useMemo, Fragment, useRef, useEffect } from 'react';
import type { TrainingActivity, Tool } from '../types';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

const ACTIVITY_CATEGORIES = ['Openers', 'Linking & Summarizing', 'Delivery', 'Energizers', 'Practice', 'Closing'] as const;
type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

const CATEGORY_DETAILS: Record<ActivityCategory, { icon: React.FC<{className?: string}> }> = {
    'Openers': { icon: Icons.sunrise },
    'Linking & Summarizing': { icon: Icons.link },
    'Delivery': { icon: Icons.presentation },
    'Energizers': { icon: Icons.zap },
    'Practice': { icon: Icons.cog },
    'Closing': { icon: Icons.sunset },
};


const ToolTag: React.FC<{
    toolName: string;
    tools: Tool[];
    onLearnMore: (toolId: string) => void;
}> = ({ toolName, tools, onLearnMore }) => {
    const { t } = useLocalization();
    const [showPopover, setShowPopover] = useState(false);
    const hideTimeoutRef = useRef<number | null>(null);
    
    const handleMouseEnter = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setShowPopover(true);
    };

    const handleMouseLeave = () => {
        hideTimeoutRef.current = window.setTimeout(() => {
            setShowPopover(false);
        }, 200); // A small delay to allow moving to the popover
    };

    const tool = tools.find(t => t.name.toLowerCase() === toolName.trim().toLowerCase());

    if (!tool) {
        return <>{toolName}</>;
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <span
                className="bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-1 rounded-full cursor-pointer"
            >
                {tool.name}
            </span>
            {showPopover && (
                <div
                    className="absolute bottom-full mb-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-20 p-4 text-left"
                >
                    <h4 className="font-bold text-slate-800">{tool.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{tool.description}</p>
                    <button onClick={() => onLearnMore(tool.id)} className="text-xs text-sky-600 font-bold mt-2 inline-block">
                        {t('learnMore')} &rarr;
                    </button>
                </div>
            )}
        </div>
    );
};

const ActivityDetailsModal: React.FC<{
  activity: TrainingActivity | null;
  onClose: () => void;
  tools: Tool[];
  onSelectTool: (toolId: string) => void;
}> = ({ activity, onClose, tools, onSelectTool }) => {
  const { t } = useLocalization();
  
  if (!activity) return null;

  const handleLearnMore = (toolId: string) => {
    onClose();
    onSelectTool(toolId);
  };

  const renderTextWithToolTags = (text: string) => {
    const toolNames = tools.map(t => t.name.replace(/!/g, '\\!')).join('|');
    if (!toolNames) return text;
    
    const regex = new RegExp(`\\b(${toolNames})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const matchingTool = tools.find(t => t.name.toLowerCase() === part.toLowerCase());
        if (matchingTool) {
            return <ToolTag key={index} toolName={matchingTool.name} tools={tools} onLearnMore={handleLearnMore} />;
        }
        return <Fragment key={index}>{part}</Fragment>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-sky-600">{t(`category_${activity.category}`)}</p>
                <h2 className="text-2xl font-bold text-slate-800 mt-1">{activity.title}</h2>
            </div>
            <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex justify-between text-sm">
                <span className="font-semibold">{t('timeLabel')}: <span className="font-normal text-slate-600">{activity.duration} {t('minutes')}</span></span>
                <span className="font-semibold">{t('bestForLabel')}: <span className="font-normal text-slate-600">{t(`groupSize_${activity.groupSize}`)}</span></span>
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">{t('purposeLabel')}</h3>
                <p className="text-slate-600 mt-1">{activity.objective}</p>
            </div>
             <div>
                <h3 className="font-semibold text-slate-800">{t('pharmaExampleLabel')}</h3>
                <p className="text-slate-600 mt-1">{activity.pharmaExample}</p>
            </div>
             <div>
                <h3 className="font-semibold text-slate-800">{t('toolsLabel')}</h3>
                <div className="mt-1 text-slate-600 space-x-1">
                    {renderTextWithToolTags(activity.tools)}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">{t('instructionsLabel')}</h3>
                <div className="text-slate-600 mt-1 whitespace-pre-wrap">{renderTextWithToolTags(activity.instructions)}</div>
            </div>
        </div>
         <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
};


const Activities: React.FC<{
  activities: TrainingActivity[];
  tools: Tool[];
  onSelectTool: (toolId: string) => void;
}> = ({ activities, tools, onSelectTool }) => {
  const { t } = useLocalization();
  const [selectedActivity, setSelectedActivity] = useState<TrainingActivity | null>(null);
  
  // --- New State for Filters, Sorting, and Favorites ---
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all'); // 'all', 'short', 'medium', 'long'
  const [groupSizeFilter, setGroupSizeFilter] = useState('all'); // 'all', 'small', 'large'
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('title_asc'); // 'title_asc', 'duration_asc', 'duration_desc'
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // --- Favorites Persistence ---
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('training_activity_favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error("Failed to parse favorites from localStorage", error);
    }
  }, []);

  const toggleFavorite = (activityId: string) => {
    const newFavorites = favorites.includes(activityId)
      ? favorites.filter(id => id !== activityId)
      : [...favorites, activityId];
    setFavorites(newFavorites);
    try {
      localStorage.setItem('training_activity_favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
    }
  };
  
  const filteredActivities = useMemo(() => {
    let processedActivities = [...activities];

    // 1. Filter by Favorites
    if (showFavoritesOnly) {
      processedActivities = processedActivities.filter(activity => favorites.includes(activity.id));
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      processedActivities = processedActivities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.objective.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 3. Filter by Category
    if (categoryFilter !== 'all') {
      processedActivities = processedActivities.filter(activity => activity.category === categoryFilter);
    }

    // 4. Filter by Duration
    if (durationFilter !== 'all') {
      processedActivities = processedActivities.filter(activity => {
        if (durationFilter === 'short') return activity.duration < 10;
        if (durationFilter === 'medium') return activity.duration >= 10 && activity.duration <= 20;
        if (durationFilter === 'long') return activity.duration > 20;
        return true;
      });
    }
    
    // 5. Filter by Group Size
    if (groupSizeFilter !== 'all') {
        processedActivities = processedActivities.filter(activity => {
            if (groupSizeFilter === 'small') return activity.groupSize === 'Small Groups' || activity.groupSize === 'Both';
            if (groupSizeFilter === 'large') return activity.groupSize === 'Big Groups' || activity.groupSize === 'Both';
            return true;
        });
    }

    // 6. Filter by Tag
    if (activeTag) {
        processedActivities = processedActivities.filter(activity => activity.tags?.includes(activeTag));
    }

    // 7. Sorting
    processedActivities.sort((a, b) => {
      switch (sortBy) {
        case 'duration_asc':
          return a.duration - b.duration;
        case 'duration_desc':
          return b.duration - a.duration;
        case 'title_asc':
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return processedActivities;
  }, [activities, searchTerm, categoryFilter, durationFilter, groupSizeFilter, activeTag, sortBy, favorites, showFavoritesOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">{t('activitiesLibrary')}</h1>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:col-span-2 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
            <div>
                <label htmlFor="sort-by" className="sr-only">{t('sortBy')}</label>
                <select 
                id="sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                <option value="title_asc">{t('sort_title_asc')}</option>
                <option value="duration_asc">{t('sort_duration_asc')}</option>
                <option value="duration_desc">{t('sort_duration_desc')}</option>
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('duration')}</label>
                <div className="flex flex-wrap gap-2">
                {['all', 'short', 'medium', 'long'].map(d => (
                    <button key={d} onClick={() => setDurationFilter(d)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${durationFilter === d ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {t(`duration_${d}`)}
                    </button>
                ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('groupSize')}</label>
                <div className="flex flex-wrap gap-2">
                {['all', 'small', 'large'].map(s => (
                    <button key={s} onClick={() => setGroupSizeFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${groupSizeFilter === s ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    {t(`groupSize_${s}`)}
                    </button>
                ))}
                </div>
            </div>
            
            <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" checked={showFavoritesOnly} onChange={() => setShowFavoritesOnly(!showFavoritesOnly)} className="sr-only" />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${showFavoritesOnly ? 'bg-sky-600' : 'bg-slate-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${showFavoritesOnly ? 'translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-slate-700">{t('showFavoritesOnly')}</div>
                </label>
            </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <button 
                onClick={() => { setCategoryFilter('all'); setActiveTag(null); }}
                className={`p-3 rounded-lg text-center transition-colors ${categoryFilter === 'all' && !activeTag ? 'bg-sky-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200'}`}
            >
                <span className="font-bold text-sm">{t('allCategories')}</span>
            </button>
            {ACTIVITY_CATEGORIES.map(cat => {
                const Icon = CATEGORY_DETAILS[cat].icon;
                const isActive = categoryFilter === cat;
                return (
                     <button 
                        key={cat}
                        onClick={() => { setCategoryFilter(cat); setActiveTag(null); }}
                        className={`p-3 rounded-lg text-center transition-colors flex flex-col items-center justify-center gap-1 ${isActive ? 'bg-sky-600 text-white shadow' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-sky-600'}`} />
                        <span className="font-bold text-sm">{t(`category_${cat}`)}</span>
                        <span className={`text-xs ${isActive ? 'text-sky-100' : 'text-slate-500'}`}>{t(`category_desc_${cat}`)}</span>
                    </button>
                )
            })}
        </div>
        {activeTag && (
            <div className="flex items-center gap-2 pt-2">
                <span className="text-sm font-medium">{t('tags')}:</span>
                <span className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-sm font-semibold px-2.5 py-1 rounded-full">
                    {activeTag}
                    <button onClick={() => setActiveTag(null)} className="text-sky-700 hover:text-sky-900">&times;</button>
                </span>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities.map(activity => (
          <div key={activity.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-sky-600">{t(`category_${activity.category}`)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{t(`groupSize_${activity.groupSize}`)}</span>
                    <button 
                        onClick={() => toggleFavorite(activity.id)} 
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label={favorites.includes(activity.id) ? t('removeFromFavorites') : t('addToFavorites')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={favorites.includes(activity.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-6 h-6 ${favorites.includes(activity.id) ? 'text-red-500' : ''}`}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                  </div>
              </div>
              <h3 className="text-lg font-bold mt-2">{activity.title}</h3>
              <p className="text-slate-600 mt-2 text-sm line-clamp-2">{activity.objective}</p>
              
              {activity.tags && activity.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activity.tags.map(tag => (
                    <button 
                        key={tag} 
                        onClick={() => { setActiveTag(tag); setCategoryFilter('all'); }} 
                        className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full hover:bg-slate-300 transition-colors"
                    >
                        #{tag}
                    </button>
                    ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-slate-500">{activity.duration} {t('minutes')}</span>
                <button onClick={() => setSelectedActivity(activity)} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                    {t('activityDetails')}
                </button>
            </div>
          </div>
        ))}
      </div>
       {filteredActivities.length === 0 && (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-slate-500">{t('noActivitiesFound')}</p>
        </div>
      )}

      <ActivityDetailsModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} tools={tools} onSelectTool={onSelectTool} />
    </div>
  );
};

export default Activities;