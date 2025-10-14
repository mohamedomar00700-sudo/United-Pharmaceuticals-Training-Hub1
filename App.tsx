import React, { useState } from 'react';
import Header from './components/Header';
import Activities from './components/Activities';
import Toolbox from './components/Toolbox';
import Sidebar from './components/Sidebar';
import SessionPlanner from './components/SessionPlanner';
import QuizGenerator from './components/QuizGenerator';
import { useMockData } from './hooks/useMockData';
import { LocalizationProvider } from './contexts/LocalizationContext';

type View = 'activities' | 'toolbox' | 'planner' | 'quizGenerator';

const App: React.FC = () => {
  const {
    activities,
    tools,
  } = useMockData();
  
  const [activeView, setActiveView] = useState<View>('activities');
  const [initialToolId, setInitialToolId] = useState<string | null>(null);

  const handleSelectTool = (toolId: string) => {
    setInitialToolId(toolId);
    setActiveView('toolbox');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'activities':
        return <Activities activities={activities} tools={tools} onSelectTool={handleSelectTool} />;
      case 'toolbox':
        return <Toolbox tools={tools} activities={activities} initialToolId={initialToolId} onToolOpened={() => setInitialToolId(null)} />;
      case 'planner':
        return <SessionPlanner activities={activities} tools={tools} />;
      case 'quizGenerator':
        return <QuizGenerator />;
      default:
        return <Activities activities={activities} tools={tools} onSelectTool={handleSelectTool} />;
    }
  };

  return (
    <LocalizationProvider>
      <div className="bg-slate-100 min-h-screen text-slate-800">
        <Header />
        <div className="flex">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default App;