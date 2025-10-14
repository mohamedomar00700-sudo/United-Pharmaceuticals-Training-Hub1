import React, { useState } from 'react';
import type { QuizQuestion, QuestionType } from '../types';
import { generateQuiz } from '../services/geminiService';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const QuizGenerator: React.FC = () => {
    const { t } = useLocalization();
    const [material, setMaterial] = useState('');
    const [editableQuiz, setEditableQuiz] = useState<QuizQuestion[] | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [copyStatus, setCopyStatus] = useState(t('copyToClipboard'));
    
    // Customization state
    const [learningObjectives, setLearningObjectives] = useState('');
    const [includeExplanations, setIncludeExplanations] = useState(true);
    const [questionDistribution, setQuestionDistribution] = useState<{ [key in QuestionType]?: number }>({
        'multiple-choice': 5,
        'true-false': 0,
        'fill-in-the-blank': 0,
    });
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

    const handleDistributionChange = (type: QuestionType, value: string) => {
        const count = parseInt(value) || 0;
        setQuestionDistribution(prev => ({
            ...prev,
            [type]: count >= 0 ? count : 0,
        }));
    };

    // FIX: Add explicit types for the reduce function parameters to resolve the TypeScript error.
    const totalQuestions = Object.values(questionDistribution).reduce((sum: number, count: number | undefined) => sum + (count || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!material.trim()) {
            setError(t('enterContentFirst'));
            return;
        }
        if (totalQuestions === 0) {
            setError('Please specify a number of questions to generate.');
            return;
        }
        setIsGenerating(true);
        setError('');
        setEditableQuiz(null);

        try {
            const generatedQuestions = await generateQuiz(material, questionDistribution, difficulty, learningObjectives, includeExplanations);
            setEditableQuiz(generatedQuestions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const formatQuizForExport = (quizToExport: QuizQuestion[]): string => {
        let content = `${t('quizResults')}\n\n`;
        content += `--------------------\n\n`;

        quizToExport.forEach((q, index) => {
            content += `Question ${index + 1}: ${q.question}\n`;
            if (q.type === 'multiple-choice') {
                q.options.forEach((opt, oIndex) => {
                    content += `  ${String.fromCharCode(65 + oIndex)}. ${opt}\n`;
                });
            } else if (q.type === 'true-false') {
                 content += `  A. True\n`;
                 content += `  B. False\n`;
            }
            content += `\nCorrect Answer: ${q.correctAnswer}\n`;
            if (q.explanation) {
                content += `Explanation: ${q.explanation}\n`;
            }
            content += `\n--------------------\n\n`;
        });
        return content;
    }

    const handleDownloadQuiz = () => {
        if (!editableQuiz) return;
        const content = formatQuizForExport(editableQuiz);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'generated-quiz.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleCopyToClipboard = () => {
        if (!editableQuiz) return;
        const content = formatQuizForExport(editableQuiz);
        navigator.clipboard.writeText(content).then(() => {
            setCopyStatus(t('copied'));
            setTimeout(() => setCopyStatus(t('copyToClipboard')), 2000);
        });
    };
    
    // Handlers for editing the quiz
    const handleQuestionChange = (qIndex: number, field: keyof QuizQuestion, value: any) => {
        setEditableQuiz(prev => {
            if (!prev) return null;
            const newQuiz = [...prev];
            (newQuiz[qIndex] as any)[field] = value;
            return newQuiz;
        });
    };
    
    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
         setEditableQuiz(prev => {
            if (!prev) return null;
            const newQuiz = [...prev];
            const oldOptionValue = newQuiz[qIndex].options[oIndex];
            newQuiz[qIndex].options[oIndex] = value;
            // If the edited option was the correct answer, update the correct answer as well
            if (newQuiz[qIndex].correctAnswer === oldOptionValue) {
                newQuiz[qIndex].correctAnswer = value;
            }
            return newQuiz;
        });
    };


    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{t('quizGeneratorTitle')}</h1>
                <p className="mt-2 text-slate-600">{t('quizGeneratorDescription')}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="material" className="block text-sm font-medium text-slate-700">{t('contentLabel')}</label>
                        <textarea id="material" value={material} onChange={e => setMaterial(e.target.value)} rows={8} placeholder={t('pasteMaterialHere')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                    </div>
                    <div>
                        <label htmlFor="learningObjectives" className="block text-sm font-medium text-slate-700">{t('learningObjectives')}</label>
                        <textarea id="learningObjectives" value={learningObjectives} onChange={e => setLearningObjectives(e.target.value)} rows={2} placeholder={t('learningObjectivesPlaceholder')} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-bold text-slate-700 mb-4">{t('quizCustomization')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="space-y-4 p-4 border rounded-md bg-slate-50">
                                {(['multiple-choice', 'true-false', 'fill-in-the-blank'] as QuestionType[]).map(type => (
                                    <div key={type} className="grid grid-cols-2 gap-4 items-center">
                                        <label htmlFor={`num_${type}`} className="block text-sm font-medium text-slate-700">{t(`qType_${type}`)}</label>
                                        <input
                                            type="number"
                                            id={`num_${type}`}
                                            value={questionDistribution[type] || 0}
                                            onChange={e => handleDistributionChange(type, e.target.value)}
                                            min="0"
                                            max="15"
                                            className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                        />
                                    </div>
                                ))}
                                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">{t('totalQuestions')}</span>
                                    <span className="font-bold text-slate-800 text-lg">{totalQuestions}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                               <fieldset>
                                    <legend className="block text-sm font-medium text-slate-700">{t('difficulty')}</legend>
                                    <div className="mt-2 flex flex-col sm:flex-row gap-4">
                                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                                            <label key={d} className="flex items-center gap-2 text-sm">
                                                <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} className="focus:ring-sky-500 h-4 w-4 text-sky-600 border-slate-300" />
                                                {t(`diff_${d.toLowerCase()}`)}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                 <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-2">
                                    <input type="checkbox" checked={includeExplanations} onChange={e => setIncludeExplanations(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"/>
                                    {t('includeExplanations')}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={isGenerating} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700 disabled:bg-slate-400 transition-colors">
                            {isGenerating ? <><Icons.sparkles className="w-5 h-5 animate-pulse" /> {t('generating')}</> : <><Icons.sparkles className="w-5 h-5" /> {t('generateQuizButton')}</>}
                        </button>
                    </div>
                </form>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {isGenerating && (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p className="text-slate-600">{t('generating')}</p>
                    <div className="mt-4 w-16 h-16 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
                </div>
            )}

            {editableQuiz && editableQuiz.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-800">{t('editYourQuiz')}</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={handleCopyToClipboard} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors text-sm">
                                <Icons.clipboardCopy className="w-4 h-4" />
                                {copyStatus}
                            </button>
                            <button onClick={handleDownloadQuiz} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 transition-colors text-sm">
                                <Icons.download className="w-4 h-4" />
                                {t('downloadQuiz')}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {editableQuiz.map((q, qIndex) => (
                            <div key={qIndex} className="p-4 border rounded-md bg-slate-50 space-y-3">
                                <label className="block text-sm font-medium text-slate-700">{t('questionLabel')} {qIndex + 1}</label>
                                <input type="text" value={q.question} onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />

                                {q.type === 'multiple-choice' && (
                                    <div className="space-y-2 pt-2">
                                        {q.options.map((option, oIndex) => (
                                            <div key={oIndex} className="flex items-center gap-3">
                                                <input type="radio" name={`q${qIndex}`} checked={q.correctAnswer === option} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', option)} className="h-4 w-4 text-sky-600 border-slate-400 focus:ring-sky-500"/>
                                                <input type="text" value={option} onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                 {q.type === 'true-false' && (
                                    <div className="flex items-center gap-6 pt-2">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name={`q${qIndex}`} checked={q.correctAnswer === 'True'} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', 'True')} className="h-4 w-4 text-sky-600 border-slate-400 focus:ring-sky-500"/>
                                            True
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name={`q${qIndex}`} checked={q.correctAnswer === 'False'} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', 'False')} className="h-4 w-4 text-sky-600 border-slate-400 focus:ring-sky-500"/>
                                            False
                                        </label>
                                    </div>
                                )}
                                {q.type === 'fill-in-the-blank' && (
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700">{t('correctAnswerLabel')}</label>
                                        <input type="text" value={q.correctAnswer} onChange={e => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} className="mt-1 w-full md:w-1/2 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500" />
                                    </div>
                                )}
                                {q.explanation && (
                                    <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 text-sm rounded-r-md">
                                        <strong className="font-semibold">{t('explanationLabel')}:</strong> {q.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {!editableQuiz && !isGenerating && (
                 <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <p className="text-slate-500">{t('noQuizGenerated')}</p>
                </div>
            )}

        </div>
    );
};

export default QuizGenerator;