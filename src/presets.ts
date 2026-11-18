import { QuizDeck } from "./types.js";

export const PREMADE_DECKS: QuizDeck[] = [
    {
        id: "hadith-truth",
        title: "Sahih vs. Fabricated: Viral Quotes",
        author: "SahihFinder Team",
        category: "Hadith Verification",
        questions: [
            {
                prompt: "What is the scholarly grading of: 'Seek knowledge even unto China'?",
                choices: ["Sahih (Authentic)", "Hasan (Good)", "Da'if / Mawdu' (Weak/Fabricated)", "Mutawatir"],
                correctIndex: 2,
                explanation: "Imam al-Bukhari, Ibn Hibban, and Ibn al-Jawzi graded its chains as weak or fabricated, though seeking knowledge itself is obligatory in authentic Hadiths."
            },
            {
                prompt: "Which Hadith opens Imam al-Bukhari's Sahih?",
                choices: ["Cleanliness is half of faith", "Actions are judged by intentions", "None of you truly believes until...", "Islam is built on five pillars"],
                correctIndex: 1,
                explanation: "Umar ibn al-Khattab narrated 'Innama al-a'malu bi-n-niyyat' (Actions are judged by intentions), which opens Sahih al-Bukhari."
            },
            {
                prompt: "What makes a Hadith 'Munqati' (Disconnected)?",
                choices: ["A narrator had a weak memory", "A narrator is missing from the chain", "It contradicts the Quran", "It only has one Sahabi"],
                correctIndex: 1,
                explanation: "Inqita' occurs when a link between two narrators is broken—for example, when a student never met their claimed teacher."
            },
            {
                prompt: "Which chain did Imam al-Bukhari call 'Silsilat al-Dhahab' (The Golden Chain)?",
                choices: ["Malik → Nafi' → Ibn Umar", "Zuhri → Anas → Prophet ﷺ", "Shu'bah → Qatadah → Anas", "Sufyan → Mansur → Ibrahim"],
                correctIndex: 0,
                explanation: "Imam Malik narrating from Nafi' Mawla Ibn Umar from Abdullah ibn Umar is renowned as the Golden Chain."
            }
        ]
    },
    {
        id: "seerah-speed",
        title: "Seerah & Islamic History Blitz",
        author: "SahihFinder Team",
        category: "Seerah",
        questions: [
            {
                prompt: "In which Hijri year did the Prophet ﷺ pass away in Madinah?",
                choices: ["8 AH", "10 AH", "11 AH", "13 AH"],
                correctIndex: 2,
                explanation: "The Prophet Muhammad ﷺ passed away in Rabi' al-Awwal in the year 11 AH."
            },
            {
                prompt: "Who was the first Muezzin appointed in Islam?",
                choices: ["Abu Bakr al-Siddiq", "Bilal ibn Rabah", "Abdullah ibn Umm Maktum", "Salman al-Farisi"],
                correctIndex: 1,
                explanation: "Bilal ibn Rabah (may Allah be pleased with him) was chosen by the Prophet ﷺ for his powerful, resonant voice."
            },
            {
                prompt: "Which Surah is known as 'The Heart of the Quran' in classical literature?",
                choices: ["Surah Al-Fatihah", "Surah Al-Mulk", "Surah Ya-Sin", "Surah Al-Ikhlas"],
                correctIndex: 2,
                explanation: "Surah Ya-Sin is widely referred to by scholars as Qalb al-Quran (the Heart of the Quran)."
            }
        ]
    }
];
