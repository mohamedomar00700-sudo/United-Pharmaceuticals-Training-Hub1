import React, { useState, useEffect } from 'react';
import type { TrainingModule, QuizQuestion } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

// This component is defined outside Modules to avoid re-creation on re-renders.
const ModuleForm: React.FC<{
  module: TrainingModule | null;
  onSave: (module: TrainingModule) => void;
  onCancel: () => void;
}> = ({ module, onSave, onCancel }) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState<TrainingModule>(
    module || { id: '', title: '', category: '', description: '', content: '', quiz: [] }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(module || { id: '', title: '', category: '', description: '', content: '', quiz: [] });
  }, [module]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuizChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuiz = [...formData.quiz];
    (newQuiz[index] as any)[field] = value;
    setFormData({ ...formData, quiz: newQuiz });
  };
  
  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuiz = [...formData.quiz];
    newQuiz[qIndex].options[oIndex] = value;
    setFormData({ ...formData, quiz: newQuiz });
  };

  const handleGenerateQuiz = async () => {
    if (!formData.content) {
      setError(t('enterContentFirst'));
      return;
    }
    setIsGenerating(true);
    setError('');
    try {
      // FIX: Provide all 5 required arguments to generateQuiz: material, distribution, difficulty, objectives, and includeExplanations.
      const questions = await generateQuiz(formData.content, { 'multiple-choice': 5 }, 'Medium', '', true);
      setFormData(prev => ({ ...prev, quiz: questions }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!module) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">{formData.id ? t('editModule') : t('addModuleTitle')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">{t('moduleTitleLabel')}</label>
              <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700">{t('moduleCategoryLabel')}</label>
              <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">{t('descriptionLabel')}</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700">{t('contentLabel')}</label>
            <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{t('quizLabel')}</h3>
              <button type="button" onClick={handleGenerateQuiz} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-400 transition-colors">
                {isGenerating ? t('generating') : <><Icons.sparkles className="w-5 h-5"/> {t('generateQuiz')}</>}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            <div className="space-y-4">
              {formData.quiz.map((q, qIndex) => (
                <div key={qIndex} className="p-4 bg-slate-50 rounded-md border">
                  <label className="block text-sm font-medium text-slate-700">{t('questionLabel')} {qIndex + 1}</label>
                  <input type="text" value={q.question} onChange={e => handleQuizChange(qIndex, 'question', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
{/* FIX: Use `correctAnswer` (string) instead of `correctAnswerIndex` for checked state and updates, matching the QuizQuestion type. */}
                        <input type="radio" name={`q${qIndex}`} checked={q.correctAnswer === opt} onChange={() => handleQuizChange(qIndex, 'correctAnswer', opt)} />
                        <input type="text" value={opt} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} className="block w-full px-2 py-1 bg-white border border-slate-300 rounded-md" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">{t('saveModule')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Modules: React.FC<{
  modules: TrainingModule[];
  onAddModule: (module: Omit<TrainingModule, 'id'>) => void;
  onUpdateModule: (module: TrainingModule) => void;
}> = ({ modules, onAddModule, onUpdateModule }) => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const { t } = useLocalization();

  const handleSave = (module: TrainingModule) => {
    if(module.id) {
        onUpdateModule(module);
    } else {
        const { id, ...newModuleData } = module;
        onAddModule(newModuleData);
    }
    setSelectedModule(null);
  };
  
  const openNewModuleForm = () => {
    setSelectedModule({ id: '', title: '', category: '', description: '', content: '', quiz: [] });
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">{t('modulesTitle')}</h1>
        <button onClick={openNewModuleForm} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors">
            <Icons.plus className="w-5 h-5"/> {t('addModule')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => (
          <div key={module.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-sky-600">{module.category}</p>
              <h3 className="text-lg font-bold mt-1">{module.title}</h3>
              <p className="text-slate-600 mt-2 text-sm line-clamp-3">{module.description}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setSelectedModule(module)} className="text-sm font-medium text-sky-600 hover:text-sky-800">
                {t('moduleDetails')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedModule && <ModuleForm module={selectedModule} onSave={handleSave} onCancel={() => setSelectedModule(null)} />}
    </div>
  );
};

export default Modules;