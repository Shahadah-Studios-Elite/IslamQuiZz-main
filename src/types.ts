export interface QuizQuestion {
    prompt: string;
    choices: string[];
    correctIndex: number;
    explanation: string;
}

export interface QuizDeck {
    id: string;
    title: string;
    author: string;
    category: string;
    questions: QuizQuestion[];
}
