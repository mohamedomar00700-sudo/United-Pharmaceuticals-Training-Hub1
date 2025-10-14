import React from 'react';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

type View = 'activities' | 'toolbox' | 'planner' | 'quizGenerator';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
    const { t, language } = useLocalization();

    const navItems = [
        { id: 'activities', label: t('activitiesLibrary'), icon: Icons.book },
        { id: 'toolbox', label: t('trainersToolbox'), icon: Icons.box },
        { id: 'planner', label: t('sessionPlanner'), icon: Icons.planner },
        { id: 'quizGenerator', label: t('quizGenerator'), icon: Icons.fileText },
    ];

    const baseItemClass = "flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors";
    const activeItemClass = "bg-sky-100 text-sky-700";
    const inactiveItemClass = "text-slate-600 hover:bg-slate-200 hover:text-slate-900";

    return (
        <aside className={`w-64 bg-white p-4 shadow-md ${language === 'ar' ? 'border-l' : 'border-r'} border-slate-200`}>
            <nav className="space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as View)}
                        className={`${baseItemClass} ${activeView === item.id ? activeItemClass : inactiveItemClass} w-full`}
                        aria-current={activeView === item.id ? 'page' : undefined}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;