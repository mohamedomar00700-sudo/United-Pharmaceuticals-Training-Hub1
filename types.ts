// FIX: Import React to resolve "Cannot find namespace 'React'" error.
import React from 'react';

export interface TrainingActivity {
  id: string;
  title: string; // Corresponds to 'Activity'
  category: 'Openers' | 'Linking & Summarizing' | 'Delivery' | 'Energizers' | 'Practice' | 'Closing'; // Corresponds to Excel tabs
  objective: string; // Corresponds to 'Purpose'
  duration: number; // Corresponds to 'Time' (in minutes)
  tools: string; // Corresponds to 'Tools'
  instructions: string;
  pharmaExample: string; // Corresponds to 'Pharma Example'
  groupSize: 'Big Groups' | 'Small Groups' | 'Both'; // Corresponds to 'Best for'
  tags?: string[];
}

export type ToolCategory = 'Communication' | 'Collaboration' | 'Assessment' | 'Presentation';

export interface Tool {
  id: string;
  name: string;
  description: string;
  useCase: string; // Why use it in pharma training?
  quickStart: string; // Quick start guide
  icon: React.FC<{ className?: string }>;
  category: ToolCategory;
}

export interface AgendaItem {
    startTime: number;
    endTime: number;
    activityId: string;
    justification: string;
    duration: number;
}

export interface SessionPlan {
    title: string;
    totalDuration: number;
    agenda: AgendaItem[];
    requiredTools: string[];
}


// FIX: Update QuizQuestion interface to support multiple question types and editing.
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-the-blank';

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options: string[]; // Used for 'multiple-choice'. Empty for other types.
  correctAnswer: string; // The text of the correct answer.
  explanation?: string;
}

// FIX: Add missing TrainingModule interface.
export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  quiz: QuizQuestion[];
}

// FIX: Add missing Trainee interface.
export interface Trainee {
  id: string;
  name: string;
  employeeId: string;
  branch: string;
  role: string;
  completedModules: string[];
}

// FIX: Add missing ScheduledSession interface.
export interface ScheduledSession {
  id:string;
  moduleId: string;
  trainer: string;
  date: string; // ISO string format for date and time
  attendees: string[];
}

// FIX: Add missing Stat interface.
export interface Stat {
    value: string | number;
    label: string;
    icon: React.FC<{ className?: string }>;
}