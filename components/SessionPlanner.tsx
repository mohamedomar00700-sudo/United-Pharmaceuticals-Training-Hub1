import React, { useState, useMemo } from 'react';
import type { SessionPlan, TrainingActivity, Tool, AgendaItem } from '../types';
import { generateSessionPlan } from '../services/geminiService';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

interface SessionPlannerProps {
    activities: TrainingActivity[];
    tools: Tool[];
}

type TrainingType = 'Summer' | 'Onboarding' | 'Regular';


const AddActivityModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    activities: TrainingActivity[];
    onAddActivity: (activity: TrainingActivity) => void;
}> = ({ isOpen, onClose, activities, onAddActivity }) => {
    const { t } = useLocalization();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => 
            activity.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [activities, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">{t('addActivityToPlan')}</h2>
                    <input 
                        type="text" 
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mt-2 w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {filteredActivities.map(activity => (
                            <li key={activity.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                                <div>
                                    <p className="font-semibold">{activity.title}</p>
                                    <p className="text-sm text-slate-500">{t(`category_${activity.category}`)} - {activity.duration} {t('minutes')}</p>
                                </div>
                                <button onClick={() => onAddActivity(activity)} className="p-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">
                                    <Icons.plus className="w-5 h-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};

const CalendarModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, time: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLocalization();
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(date, time);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">{t('calendarModalTitle')}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="session-date" className="block text-sm font-medium text-slate-700">{t('sessionStartDate')}</label>
                        <input type="date" id="session-date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="session-time" className="block text-sm font-medium text-slate-700">{t('sessionStartTime')}</label>
                        <input type="time" id="session-time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md" required />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700">{t('createCalendarEvent')}</button>
                </div>
            </form>
        </div>
    );
};


const SessionPlanner: React.FC<SessionPlannerProps> = ({ activities, tools }) => {
    const { t } = useLocalization();
    const [topic, setTopic] = useState('');
    const [objectives, setObjectives] = useState('');
    const [trainingType, setTrainingType] = useState<TrainingType>('Onboarding');
    const [numberOfTrainees, setNumberOfTrainees] = useState<number | ''>('');
    const [duration, setDuration] = useState<number | ''>('');
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [plan, setPlan] = useState<SessionPlan | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic || !objectives || !duration || !numberOfTrainees) {
            setError('Please fill in all fields.');
            return;
        }
        setIsGenerating(true);
        setError('');
        setPlan(null);

        try {
            const generatedPlan = await generateSessionPlan(topic, objectives, trainingType, numberOfTrainees, duration, activities, additionalInstructions);
            setPlan(generatedPlan);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('planGenerationError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const recalculatePlan = (agenda: AgendaItem[], currentPlan: SessionPlan): SessionPlan => {
        let currentTime = 0;
        const newAgenda = agenda.map(item => {
            const newItem = {
                ...item,
                startTime: currentTime,
                endTime: currentTime + item.duration,
            };
            currentTime += item.duration;
            return newItem;
        });
        
        const requiredToolSet = new Set<string>();
        newAgenda.forEach(item => {
            const activity = getActivityById(item.activityId);
            if (activity) {
                 tools.forEach(tool => {
                    if(activity.tools.toLowerCase().includes(tool.name.toLowerCase())) {
                        requiredToolSet.add(tool.name);
                    }
                });
            }
        });

        return {
            ...currentPlan,
            agenda: newAgenda,
            totalDuration: currentTime,
            requiredTools: Array.from(requiredToolSet)
        };
    };

    const handleDurationChange = (index: number, newDurationStr: string) => {
        const newDuration = parseInt(newDurationStr) || 0;
        if (!plan) return;
        const newAgenda = [...plan.agenda];
        newAgenda[index].duration = newDuration;
        setPlan(recalculatePlan(newAgenda, plan));
    };

    const handleDeleteItem = (index: number) => {
        if (!plan) return;
        const newAgenda = plan.agenda.filter((_, i) => i !== index);
        setPlan(recalculatePlan(newAgenda, plan));
    };

    const handleAddActivity = (activity: TrainingActivity) => {
        if (!plan) return;
        const newAgendaItem: AgendaItem = {
            activityId: activity.id,
            duration: activity.duration,
            justification: "Added by trainer.",
            startTime: 0,
            endTime: 0,
        };
        const newAgenda = [...plan.agenda, newAgendaItem];
        setPlan(recalculatePlan(newAgenda, plan));
        setIsAddModalOpen(false);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        if (draggedItemIndex === null || !plan) return;
        const draggedItem = plan.agenda[draggedItemIndex];
        const newAgenda = [...plan.agenda];
        newAgenda.splice(draggedItemIndex, 1);
        newAgenda.splice(dropIndex, 0, draggedItem);
        setPlan(recalculatePlan(newAgenda, plan));
        setDraggedItemIndex(null);
    };
    
    const handleDownloadPlan = () => {
        if (!plan) return;

        let content = `Session Plan: ${plan.title}\n`;
        content += `Total Duration: ${plan.totalDuration} minutes\n\n`;
        content += `--------------------\n`;
        content += `Required Tools:\n`;
        plan.requiredTools.forEach(toolName => {
            content += `- ${toolName}\n`;
        });
        content += `--------------------\n\n`;
        content += `Agenda:\n\n`;

        plan.agenda.forEach(item => {
            const activity = getActivityById(item.activityId);
            content += `(${item.startTime}-${item.endTime} min | Duration: ${item.duration} min) - ${activity ? activity.title : 'Unknown Activity'}\n`;
            if (activity) {
                content += `  Category: ${t(`category_${activity.category}`)}\n`;
            }
            content += `  Justification: ${item.justification}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'session-plan.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCreateCalendarEvent = (date: string, time: string) => {
        if (!plan || !date || !time) return;

        const toICSDate = (d: Date) => {
            return d.toISOString().replace(/-|:|\.\d+/g, '');
        };
        
        const sessionStartDate = new Date(`${date}T${time}`);
        if (isNaN(sessionStartDate.getTime())) {
            alert("Invalid date or time provided.");
            return;
        }

        let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UnitedPharma//TrainingHub//EN\n`;

        plan.agenda.forEach(item => {
            const activity = getActivityById(item.activityId);
            const itemStart = new Date(sessionStartDate.getTime() + item.startTime * 60000);
            const itemEnd = new Date(sessionStartDate.getTime() + item.endTime * 60000);

            icsContent += `BEGIN:VEVENT\n`;
            icsContent += `UID:${item.activityId}-${itemStart.getTime()}@traininghub.com\n`;
            icsContent += `DTSTAMP:${toICSDate(new Date())}\n`;
            icsContent += `DTSTART:${toICSDate(itemStart)}\n`;
            icsContent += `DTEND:${toICSDate(itemEnd)}\n`;
            icsContent += `SUMMARY:${activity?.title || 'Training Activity'}\n`;
            icsContent += `DESCRIPTION:Part of session: ${plan.title}\\nCategory: ${activity ? t(`category_${activity.category}`) : 'N/A'}\\nJustification: ${item.justification.replace(/\n/g, "\\n")}\n`;
            icsContent += `END:VEVENT\n`;
        });

        icsContent += `END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'training-session.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsCalendarModalOpen(false);
    };

    const getActivityById = (id: string) => activities.find(a => a.id === id);
    const getToolByName = (name: string) => tools.find(t => t.name.toLowerCase() === name.trim().toLowerCase());

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{t('sessionPlanner')}</h1>
                <p className="mt-2 text-slate-600">{t('plannerDescription')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="topic" className="block text-sm font-medium text-slate-700">{t('sessionTopic')}</label>
                        <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('sessionTopicPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                    </div>
                     <div>
                        <label htmlFor="objectives" className="block text-sm font-medium text-slate-700">{t('learningObjectives')}</label>
                        <textarea id="objectives" value={objectives} onChange={e => setObjectives(e.target.value)} rows={3} placeholder={t('learningObjectivesPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">{t('trainingType')}</label>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {(['Summer', 'Onboarding', 'Regular'] as const).map(type => (
                                <label key={type} className={`flex items-center p-3 border rounded-md has-[:checked]:bg-sky-50 has-[:checked]:border-sky-500 cursor-pointer transition-colors ${t('language') === 'ar' ? 'flex-row-reverse' : ''}`}>
                                    <input type="radio" name="trainingType" value={type} checked={trainingType === type} onChange={() => setTrainingType(type)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300" />
                                    <span className={`text-sm text-slate-700 font-medium ${t('language') === 'ar' ? 'mr-3' : 'ml-3'}`}>{t(`trainingType_${type}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="numberOfTrainees" className="block text-sm font-medium text-slate-700">{t('numberOfTrainees')}</label>
                            <input type="number" id="numberOfTrainees" value={numberOfTrainees} onChange={e => setNumberOfTrainees(e.target.value ? parseInt(e.target.value) : '')} placeholder={t('numberOfTrainees_placeholder')} min="1" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-slate-700">{t('sessionDuration')}</label>
                            <input type="number" id="duration" value={duration} onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : '')} placeholder={t('sessionDurationPlaceholder')} min="1" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="additionalInstructions" className="block text-sm font-medium text-slate-700">{t('additionalInstructions')}</label>
                        <textarea id="additionalInstructions" value={additionalInstructions} onChange={e => setAdditionalInstructions(e.target.value)} rows={2} placeholder={t('additionalInstructionsPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isGenerating} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400 transition-colors">
                            {isGenerating ? (
                                <>
                                    <Icons.sparkles className="w-5 h-5 animate-pulse" />
                                    {t('generatingPlan')}
                                </>
                            ) : (
                                <>
                                    <Icons.sparkles className="w-5 h-5" />
                                    {t('generatePlan')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {isGenerating && (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p className="text-slate-600">{t('generatingPlan')}</p>
                    <div className="mt-4 w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
                </div>
            )}


            {plan && (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                             <h2 className="text-2xl font-bold text-slate-800">{t('editPlanTitle')}</h2>
                             <input 
                                type="text" 
                                value={plan.title}
                                onChange={e => setPlan(p => p ? {...p, title: e.target.value} : null)}
                                className="mt-1 text-lg font-semibold text-slate-700 border-b-2 border-transparent focus:border-sky-500 focus:outline-none"
                             />
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setIsCalendarModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                                <Icons.calendar className="w-5 h-5" />
                                {t('addToCalendar')}
                            </button>
                            <button onClick={handleDownloadPlan} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors">
                                <Icons.download className="w-5 h-5" />
                                {t('downloadPlan')}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                             <h3 className="text-xl font-semibold text-slate-700">{t('agenda')} (<span className="font-bold">{t('totalDuration')}: {plan.totalDuration} {t('minutes')}</span>)</h3>
                             
                             <div className="space-y-1">
                                {plan.agenda.map((item, index) => {
                                     const activity = getActivityById(item.activityId);
                                     if (!activity) return null;
                                     return (
                                         <div 
                                            key={item.activityId + index}
                                            draggable 
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`flex items-start gap-3 p-3 rounded-md bg-slate-50 border-2 ${draggedItemIndex === index ? 'border-sky-500' : 'border-transparent'}`}
                                        >
                                            <div className="flex flex-col items-center gap-1 text-slate-500 pt-1">
                                                <Icons.gripVertical className="w-5 h-5 cursor-move" title={t('dragToReorder')} />
                                                <span className="text-sm font-bold">{index + 1}</span>
                                            </div>

                                            <div className="flex-1">
                                                 <h4 className="font-bold text-slate-800">{activity.title}</h4>
                                                 <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t(`category_${activity.category}`)}</p>
                                                 <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">{t('justification')}:</span> {item.justification}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                 <input 
                                                    type="number" 
                                                    value={item.duration}
                                                    onChange={(e) => handleDurationChange(index, e.target.value)}
                                                    className="w-16 px-2 py-1 text-center border border-slate-300 rounded-md"
                                                    aria-label="Duration"
                                                 />
                                                 <span>{t('minutes')}</span>
                                                 <button onClick={() => handleDeleteItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-md">
                                                    <Icons.trash className="w-5 h-5"/>
                                                 </button>
                                            </div>
                                         </div>
                                     );
                                 })}
                             </div>
                             <button onClick={() => setIsAddModalOpen(true)} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 text-slate-500 rounded-md hover:bg-slate-100 hover:border-slate-400">
                                 <Icons.plus className="w-5 h-5"/> {t('addActivityToPlan')}
                             </button>
                        </div>
                         <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-slate-700">{t('requiredTools')}</h3>
                            <div className="flex flex-col gap-3">
                                {plan.requiredTools.length > 0 ? plan.requiredTools.map((toolName, index) => {
                                     const tool = getToolByName(toolName);
                                     if (!tool) return <span key={index} className="text-slate-600">{toolName}</span>
                                     return (
                                        <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-md">
                                            <div className="bg-sky-100 text-sky-600 p-2 rounded-md">
                                                <tool.icon className="w-5 h-5"/>
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-slate-800">{tool.name}</h5>
                                            </div>
                                        </div>
                                     );
                                }) : <p className="text-sm text-slate-500">No specific tools required.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
             {!plan && !isGenerating && (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">{t('noPlanGenerated')}</p>
                </div>
            )}

            <AddActivityModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                activities={activities}
                onAddActivity={handleAddActivity}
            />
            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                onConfirm={handleCreateCalendarEvent}
            />
        </div>
    );
};

export default SessionPlanner;