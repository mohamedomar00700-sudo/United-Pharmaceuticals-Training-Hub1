import React from 'react';
import type { ScheduledSession } from '../types';
import { useMockData } from '../hooks/useMockData';
import { useLocalization } from '../contexts/LocalizationContext';

const Schedule: React.FC<{ sessions: ScheduledSession[] }> = ({ sessions }) => {
  const { modules, trainees } = useMockData();
  const { t, language } = useLocalization();

  const getModuleTitle = (id: string) => modules.find(m => m.id === id)?.title || 'Unknown';
  const getTraineeName = (id: string) => trainees.find(t => t.id === id)?.name || 'Unknown';
  
  const sortedSessions = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">{t('scheduleTitle')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-6">
          {sortedSessions.map(session => (
            <div key={session.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-sky-700">{getModuleTitle(session.moduleId)}</h3>
                  <p className="text-sm text-slate-500">{t('trainerLabel')}: {session.trainer}</p>
                  <p className="text-sm text-slate-500">{new Date(session.date).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${new Date(session.date) > new Date() ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {new Date(session.date) > new Date() ? t('upcoming') : t('completed')}
                </span>
              </div>
              <div className="mt-4 border-t pt-2">
                <p className="text-sm font-semibold">{t('registeredTrainees')} ({session.attendees.length}):</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {session.attendees.map(id => (
                        <span key={id} className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full">
                            {getTraineeName(id)}
                        </span>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
