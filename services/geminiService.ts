import { GoogleGenAI, Type } from "@google/genai";
import type { QuizQuestion, Tool, TrainingActivity, SessionPlan, QuestionType } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const quizSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: {
        type: Type.STRING,
        description: "The question itself. For fill-in-the-blank, it should include '___' to indicate the blank space.",
      },
      type: {
        type: Type.STRING,
        enum: ['multiple-choice', 'true-false', 'fill-in-the-blank'],
        description: "The type of the question."
      },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "An array of 4 possible answer choices for 'multiple-choice' questions. For 'true-false', this array should contain 'True' and 'False'. For 'fill-in-the-blank', it should be an empty array.",
      },
      correctAnswer: {
        type: Type.STRING,
        description: "The correct answer. For 'multiple-choice', this is the text of the correct option. For 'true-false', it is either 'True' or 'False'. For 'fill-in-the-blank', it is the word that fills the blank.",
      },
      explanation: {
        type: Type.STRING,
        description: "A brief explanation of why the correct answer is correct, based on the provided material. This should only be included if requested in the prompt.",
      },
    },
    required: ["question", "type", "options", "correctAnswer"],
  },
};

const sessionPlanSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        totalDuration: { type: Type.INTEGER },
        requiredTools: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of unique tool names required for the session.",
        },
        agenda: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    startTime: { type: Type.INTEGER, description: "Start time in minutes from the beginning of the session." },
                    endTime: { type: Type.INTEGER, description: "End time in minutes from the beginning of the session." },
                    activityId: { type: Type.STRING, description: "The ID of the chosen activity from the provided library." },
                    justification: { type: Type.STRING, description: "A brief reason why this activity was chosen for this session." },
                    duration: { type: Type.INTEGER, description: "Duration of this activity in minutes, copied from the selected activity." },
                },
                required: ["startTime", "endTime", "activityId", "justification", "duration"],
            },
        },
    },
    required: ["title", "totalDuration", "agenda", "requiredTools"],
};


export const generateQuiz = async (material: string, questionDistribution: { [key in QuestionType]?: number }, difficulty: string, learningObjectives: string, includeExplanations: boolean): Promise<QuizQuestion[]> => {
  if (!API_KEY) {
    throw new Error("API key is not configured.");
  }

  const totalQuestions = Object.values(questionDistribution).reduce((sum, count) => sum + (count || 0), 0);
  if (totalQuestions === 0) {
      return [];
  }

  const distributionText = Object.entries(questionDistribution)
      .filter(([, count]) => count && count > 0)
      .map(([type, count]) => `- ${count} ${type.replace('-', ' ')} questions`)
      .join('\n');

  try {
    const prompt = `Based on the following training material, generate a quiz with a total of ${totalQuestions} questions.
The difficulty level should be "${difficulty}". The questions should be in English.

The quiz must have the following composition:
${distributionText}

For "multiple-choice", provide 4 distinct options.
For "true-false", the options array MUST contain only "True" and "False".
For "fill-in-the-blank", the question text must contain "___" representing the blank, and the options array should be empty.

Key Learning Objectives to focus on when creating questions:
---
${learningObjectives || 'General understanding of the material.'}
---

${includeExplanations ? 'For each question, you MUST also provide a brief explanation for why the correct answer is correct. The explanation should be based on the provided training material.' : ''}

Training Material:
---
${material}
---
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);

    // Basic validation
    if (Array.isArray(quizData)) {
      return quizData.map((q: any) => ({
        question: q.question || '',
        type: q.type || 'multiple-choice',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || undefined,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};

export const getToolAdvice = async (tool: Tool, question: string, history: {role: 'user' | 'model', parts: {text: string}[]}[]) => {
   if (!API_KEY) {
    throw new Error("API key is not configured.");
  }

  const systemInstruction = `You are an expert in training technologies and instructional design, acting as a helpful "AI Expert" for pharmaceutical trainers.
The user is asking about a specific tool. Your response should be clear, concise, and highly practical.
Use markdown for formatting, like lists and bold text, to make the steps easy to follow.

Tool Context:
- Tool Name: ${tool.name}
- Description: ${tool.description}
- Use Case in Pharma Training: ${tool.useCase}
`;

  const contents = [...history, { role: 'user', parts: [{ text: question }] }];

  try {
     const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response;
  } catch (error) {
    console.error("Error getting tool advice from Gemini:", error);
    throw new Error("Failed to get advice. Please try again.");
  }
};

export const generateSessionPlan = async (
    topic: string,
    objectives: string,
    trainingType: 'Summer' | 'Onboarding' | 'Regular',
    numberOfTrainees: number,
    duration: number,
    activities: TrainingActivity[],
    additionalInstructions: string
): Promise<SessionPlan> => {
    if (!API_KEY) {
        throw new Error("API key is not configured.");
    }
    
    const systemInstruction = `You are an expert instructional designer specializing in pharmaceutical training. Your task is to create a detailed, timed training session plan based on user requirements and a provided library of activities.
You MUST ONLY select activities from the provided library.
Your plan should be logical, starting with an opener, moving to practice/delivery activities, and ending with a summary or closing activity.
The total duration of the activities you select must not exceed the user-specified session duration.
Ensure chosen activities are appropriate for the specified group size.
For each agenda item, you MUST include the 'duration' field, copying the value from the selected activity's duration property.
Return the plan in the specified JSON format.`;

    const audienceMap = {
        'Summer': 'pharmacy students on a summer internship',
        'Onboarding': 'newly hired pharmacists',
        'Regular': 'current, experienced pharmacists'
    };
    const audience = audienceMap[trainingType];

    const groupSize = numberOfTrainees <= 12 ? 'Small Groups' : 'Big Groups';

    const prompt = `
        Please create a session plan with the following details:
        - Training Type: ${trainingType} Training
        - Target Audience: ${audience}
        - Topic: ${topic}
        - Objectives: ${objectives}
        - Number of Trainees: ${numberOfTrainees} (This means it is a '${groupSize}' session. You must select activities where the 'groupSize' property is compatible with this, i.e., it is '${groupSize}' or 'Both'.)
        - Total Duration: ${duration} minutes

        Also, tailor the choice of activities to the training type. For example:
        - 'Summer Training' for students should focus more on foundational 'Practice' and 'Openers'.
        - 'Onboarding' for new hires should have a good mix of 'Delivery' (for product knowledge, consultation) and 'Practice' (for skills).
        - 'Regular Training' for existing staff could include advanced topics, 'Linking & Summarizing' to build on existing knowledge, and activities related to cross-selling/up-selling if the topic allows.
        
        ${additionalInstructions ? `Additionally, here are some special instructions to follow: ${additionalInstructions}` : ''}

        Here is the library of available activities you MUST choose from. Do not invent new activities.
        Activity Library (JSON format):
        ---
        ${JSON.stringify(activities, null, 2)}
        ---
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: sessionPlanSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating session plan with Gemini:", error);
        throw new Error("Failed to generate a session plan. The model might not have found a suitable combination of activities for your request. Please try adjusting the duration or objectives.");
    }
};