export type Lesson = {
  id: string;
  title: string;
  shortTitle: string;
  level: "Beginner";
  minutes: number;
  goal: string;
  setting: string;
  starter: string;
  phrases: string[];
  hints: string[];
};

export const lessons: Lesson[] = [
  {
    id: "greetings",
    title: "Greetings and Introductions",
    shortTitle: "Greetings",
    level: "Beginner",
    minutes: 6,
    goal: "Introduce yourself and ask one simple follow-up question.",
    setting: "You meet a new neighbor in the hallway.",
    starter: "Hola, soy Lucia. Como te llamas?",
    phrases: ["Me llamo...", "Mucho gusto.", "De donde eres?", "Soy de..."],
    hints: ["Use soy for identity.", "Ask one short question back."]
  },
  {
    id: "food",
    title: "Ordering Food and Drinks",
    shortTitle: "Cafe",
    level: "Beginner",
    minutes: 7,
    goal: "Order a drink and a small item politely.",
    setting: "You are at a small cafe in Madrid.",
    starter: "Buenos dias. Que quieres tomar?",
    phrases: ["Quiero un cafe.", "Para mi, una tostada.", "Cuanto cuesta?", "Gracias."],
    hints: ["Quiero means I want.", "Use por favor to sound polite."]
  },
  {
    id: "routine",
    title: "Daily Routine",
    shortTitle: "Routine",
    level: "Beginner",
    minutes: 8,
    goal: "Describe two things you do during a normal day.",
    setting: "A classmate asks about your day.",
    starter: "Como es un dia normal para ti?",
    phrases: ["Me levanto a las...", "Trabajo por la manana.", "Como a la una.", "Por la noche..."],
    hints: ["Keep verbs in the present tense.", "Use a time phrase if you can."]
  },
  {
    id: "family",
    title: "Family and Friends",
    shortTitle: "Family",
    level: "Beginner",
    minutes: 7,
    goal: "Say who is in your family or friend group.",
    setting: "You are chatting before a beginner Spanish class.",
    starter: "Cuentame un poco sobre tu familia o tus amigos.",
    phrases: ["Tengo un hermano.", "Mi amiga se llama...", "Vive en...", "Es muy amable."],
    hints: ["Tengo means I have.", "Use mi for my."]
  },
  {
    id: "hobbies",
    title: "Hobbies and Preferences",
    shortTitle: "Hobbies",
    level: "Beginner",
    minutes: 8,
    goal: "Say what you like and ask what the other person likes.",
    setting: "You meet someone at a weekend meetup.",
    starter: "Que te gusta hacer los fines de semana?",
    phrases: ["Me gusta...", "No me gusta mucho...", "Tambien me gusta...", "Y a ti?"],
    hints: ["Me gusta is followed by an activity.", "Y a ti? keeps the conversation going."]
  }
];

export function getLessonById(id: string): Lesson {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}
