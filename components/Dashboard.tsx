import React from 'react';
import type { Stat, ScheduledSession } from '../types';
import { useMockData } from '../hooks/useMockData';
import { useLocalization } from '../contexts/LocalizationContext';

interface DashboardProps {
  stats: Stat[];
  sessions: ScheduledSession[];
}

const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4 transition-transform hover:scale-105">
    <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
      <stat.icon className="w-8 h-8" />
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
      <p className="text-slate-500">{stat.label}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, sessions }) => {
  const { modules } = useMockData();
  const { t, language } = useLocalization();
  const upcomingSessions = sessions
    .filter(s => new Date(s.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const getModuleName = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.title || 'Unknown Module';
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">{t('dashboardTitle')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">{t('upcomingSessions')}</h2>
        <div className="space-y-4">
            {upcomingSessions.length > 0 ? (
                upcomingSessions.map(session => (
                    <div key={session.id} className={`p-4 rounded-md flex justify-between items-center bg-slate-50 ${language === 'ar' ? 'border-r-4' : 'border-l-4'} border-sky-500`}>
                        <div>
                            <p className="font-bold text-slate-800">{getModuleName(session.moduleId)}</p>
                            <p className="text-sm text-slate-500">{t('trainerLabel')}: {session.trainer}</p>
                        </div>
                        <div className={language === 'ar' ? 'text-left' : 'text-right'}>
                             <p className="font-semibold text-sky-600">{new Date(session.date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-slate-500">{session.attendees.length} {t('attendeesLabel')}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-slate-500">{t('noUpcomingSessions')}</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
