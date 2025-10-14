import React from 'react';
import type { Trainee } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

const Trainees: React.FC<{ trainees: Trainee[] }> = ({ trainees }) => {
  const { t, language } = useLocalization();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">{t('traineesTitle')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <thead className="border-b-2 border-slate-200">
            <tr>
              <th className="p-3 text-sm font-bold text-slate-600">{t('traineeName')}</th>
              <th className="p-3 text-sm font-bold text-slate-600">{t('employeeId')}</th>
              <th className="p-3 text-sm font-bold text-slate-600">{t('branch')}</th>
              <th className="p-3 text-sm font-bold text-slate-600">{t('role')}</th>
              <th className="p-3 text-sm font-bold text-slate-600">{t('completedModules')}</th>
            </tr>
          </thead>
          <tbody>
            {trainees.map(trainee => (
              <tr key={trainee.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-medium">{trainee.name}</td>
                <td className="p-3 text-slate-600">{trainee.employeeId}</td>
                <td className="p-3 text-slate-600">{trainee.branch}</td>
                <td className="p-3 text-slate-600">{trainee.role}</td>
                <td className="p-3 text-slate-600">{trainee.completedModules.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Trainees;
