import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Trainee, TrainingModule } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface ReportsProps {
  trainees: Trainee[];
  modules: TrainingModule[];
}

const Reports: React.FC<ReportsProps> = ({ trainees, modules }) => {
  const { t, language } = useLocalization();

  const completionData = modules.map(module => {
    const completions = trainees.filter(t => t.completedModules.includes(module.id)).length;
    return {
      name: module.title,
      'Completions': completions,
    };
  });
  
  const branchDataMap = new Map<string, number>();
    trainees.forEach(trainee => {
        branchDataMap.set(trainee.branch, (branchDataMap.get(trainee.branch) || 0) + trainee.completedModules.length);
    });

  const branchData = Array.from(branchDataMap.entries()).map(([name, value]) => ({ name, 'Total Completions': value }));


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">{t('reportsTitle')}</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6">{t('moduleCompletion')}</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={completionData} layout="vertical" margin={{ top: 5, right: 20, left: language === 'ar' ? 20 : 80, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} reversed={language === 'ar'} />
              <YAxis yAxisId={0} type="category" dataKey="name" width={150} tick={{ fontSize: 12, transform: 'translate(0, 0)' }} orientation={language === 'ar' ? 'right' : 'left'} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completions" fill="#0284c7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6">{t('completionsByBranch')}</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={branchData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total Completions" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
