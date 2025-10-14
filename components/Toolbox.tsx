import React, { useState, useEffect, useMemo } from 'react';
import type { Tool, TrainingActivity, ToolCategory } from '../types';
import { getToolAdvice } from '../services/geminiService';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

const ToolDetailsModal: React.FC<{
  tool: Tool | null;
  onClose: () => void;
  activities: TrainingActivity[];
}> = ({ tool, onClose, activities }) => {
    const { t } = useLocalization();
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
    const [currentResponse, setCurrentResponse] = useState('');

    const relatedActivities = useMemo(() => {
        if (!tool) return [];
        return activities.filter(activity =>
            activity.tools.toLowerCase().includes(tool.name.toLowerCase())
        );
    }, [tool, activities]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !tool) return;

        const newUserMessage = { role: 'user' as const, parts: [{ text: userInput }] };
        const newHistory = [...chatHistory, newUserMessage];
        setChatHistory(newHistory);
        setUserInput('');
        setIsLoading(true);
        setCurrentResponse('');

        try {
            const stream = await getToolAdvice(tool, userInput, chatHistory);
            
            let accumulatedText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                accumulatedText += chunkText;
                setCurrentResponse(accumulatedText);
            }
            
            setChatHistory(prev => [...prev, { role: 'model' as const, parts: [{ text: accumulatedText }] }]);

        } catch (error) {
            console.error(error);
            setCurrentResponse(error instanceof Error ? error.message : "Sorry, something went wrong.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!tool) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="bg-sky-100 text-sky-600 p-3 rounded-lg">
                            <tool.icon className="w-8 h-8"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{tool.name}</h2>
                            <p className="text-slate-500">{tool.description}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side: Tool Info */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">{t('whyUseIt')}</h3>
                            <p className="mt-2 text-slate-600 whitespace-pre-wrap">{tool.useCase}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-700">{t('quickStart')}</h3>
                            <p className="mt-2 text-slate-600 whitespace-pre-wrap">{tool.quickStart}</p>
                        </div>
                         <div>
                            <h3 className="text-lg font-bold text-slate-700">{t('relatedActivities')}</h3>
                             <div className="mt-2 space-y-2">
                                {relatedActivities.length > 0 ? (
                                    relatedActivities.map(activity => (
                                        <div key={activity.id} className="bg-slate-50 p-3 rounded-md border">
                                            <p className="font-semibold text-slate-800">{activity.title}</p>
                                            <p className="text-xs text-slate-500">{t(`category_${activity.category}`)}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">{t('noRelatedActivities')}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right side: AI Chat */}
                    <div className="flex flex-col bg-slate-50 rounded-lg border">
                         <div className="p-4 border-b">
                            <h3 className="text-lg font-bold text-slate-700">{t('askAIExpert')}</h3>
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            <div className="flex gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                                    <Icons.sparkles className="w-5 h-5"/>
                                </div>
                                <div className="bg-white p-3 rounded-lg border max-w-md">
                                    <p className="text-sm text-slate-700">{t('aiExpertWelcome')}</p>
                                </div>
                            </div>
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                     {msg.role === 'model' && 
                                        <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                                            <Icons.sparkles className="w-5 h-5"/>
                                        </div>
                                     }
                                    <div className={`p-3 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-sky-600 text-white' : 'bg-white border'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                                    </div>
                                </div>
                            ))}
                             {currentResponse && (
                                <div className="flex gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                                        <Icons.sparkles className="w-5 h-5"/>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border max-w-md">
                                        <p className="text-sm whitespace-pre-wrap">{currentResponse}</p>
                                    </div>
                                </div>
                            )}

                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder={t('askPlaceholder')}
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                disabled={isLoading}
                            />
                            <button type="submit" className="p-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-400" disabled={isLoading}>
                                <Icons.send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ToolboxProps {
    tools: Tool[];
    activities: TrainingActivity[];
    initialToolId?: string | null;
    onToolOpened: () => void;
}

const Toolbox: React.FC<ToolboxProps> = ({ tools, activities, initialToolId, onToolOpened }) => {
    const { t } = useLocalization();
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    
    const TOOL_CATEGORIES: ToolCategory[] = ['Communication', 'Collaboration', 'Assessment', 'Presentation'];

    useEffect(() => {
        if (initialToolId) {
            const toolToOpen = tools.find(t => t.id === initialToolId);
            if (toolToOpen) {
                setSelectedTool(toolToOpen);
                onToolOpened();
            }
        }
    }, [initialToolId, tools, onToolOpened]);
    
    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  tool.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'All' || tool.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [tools, searchTerm, categoryFilter]);


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{t('trainersToolbox')}</h1>
                <p className="mt-2 text-slate-600">{t('toolboxDescription')}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
                <input 
                    type="text" 
                    placeholder={t('searchToolsPlaceholder')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                />
                 <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setCategoryFilter('All')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === 'All' ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                        {t('toolCategory_All')}
                    </button>
                    {TOOL_CATEGORIES.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-sky-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                            {t(`toolCategory_${cat}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center hover:shadow-lg hover:scale-105 transition-all"
                    >
                        <div className="bg-sky-100 text-sky-600 p-4 rounded-full mb-4">
                            <tool.icon className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{tool.name}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{tool.description}</p>
                    </button>
                ))}
            </div>
             {filteredTools.length === 0 && (
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">{t('noActivitiesFound')}</p>
                </div>
            )}

            {selectedTool && <ToolDetailsModal tool={selectedTool} onClose={() => setSelectedTool(null)} activities={activities} />}
        </div>
    );
};

export default Toolbox;