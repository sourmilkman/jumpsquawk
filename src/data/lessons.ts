export type SpeakingPrompt = {
  cue: string;
  say: string;
  meaning: string;
  pattern: string;
  vocab: string[];
};

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
  prompts: SpeakingPrompt[];
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
    hints: ["Use soy for identity.", "Ask one short question back."],
    prompts: [
      {
        cue: "Say your name.",
        say: "Me llamo Tom.",
        meaning: "My name is Tom.",
        pattern: "Me llamo + your name",
        vocab: ["me llamo = my name is"]
      },
      {
        cue: "Say it is nice to meet them.",
        say: "Mucho gusto.",
        meaning: "Nice to meet you.",
        pattern: "Fixed phrase",
        vocab: ["mucho gusto = nice to meet you"]
      },
      {
        cue: "Ask where they are from.",
        say: "De donde eres?",
        meaning: "Where are you from?",
        pattern: "De donde + eres",
        vocab: ["eres = you are", "de donde = from where"]
      },
      {
        cue: "Say where you are from.",
        say: "Soy de Inglaterra.",
        meaning: "I am from England.",
        pattern: "Soy de + place",
        vocab: ["soy = I am", "de = from"]
      },
      {
        cue: "Ask how they are.",
        say: "Como estas?",
        meaning: "How are you?",
        pattern: "Como + estas",
        vocab: ["como = how", "estas = you are"]
      }
    ]
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
    hints: ["Quiero means I want.", "Use por favor to sound polite."],
    prompts: [
      {
        cue: "Order a drink.",
        say: "Quiero un cafe, por favor.",
        meaning: "I want a coffee, please.",
        pattern: "Quiero + item + por favor",
        vocab: ["quiero = I want", "por favor = please"]
      },
      {
        cue: "Add something small to eat.",
        say: "Para mi, una tostada.",
        meaning: "For me, toast.",
        pattern: "Para mi + item",
        vocab: ["para mi = for me", "una = a"]
      },
      {
        cue: "Ask the price.",
        say: "Cuanto cuesta?",
        meaning: "How much does it cost?",
        pattern: "Cuanto cuesta?",
        vocab: ["cuanto = how much", "cuesta = costs"]
      },
      {
        cue: "Say thank you.",
        say: "Gracias.",
        meaning: "Thank you.",
        pattern: "Fixed phrase",
        vocab: ["gracias = thank you"]
      },
      {
        cue: "Ask for the bill.",
        say: "La cuenta, por favor.",
        meaning: "The bill, please.",
        pattern: "La cuenta + por favor",
        vocab: ["la cuenta = the bill"]
      }
    ]
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
    hints: ["Keep verbs in the present tense.", "Use a time phrase if you can."],
    prompts: [
      {
        cue: "Say when you wake up.",
        say: "Me levanto a las siete.",
        meaning: "I get up at seven.",
        pattern: "Me levanto a las + time",
        vocab: ["me levanto = I get up", "a las = at"]
      },
      {
        cue: "Say what you do in the morning.",
        say: "Trabajo por la manana.",
        meaning: "I work in the morning.",
        pattern: "Verb + por la manana",
        vocab: ["trabajo = I work", "manana = morning"]
      },
      {
        cue: "Add something about night.",
        say: "Por la noche, estudio espanol.",
        meaning: "At night, I study Spanish.",
        pattern: "Por la noche + action",
        vocab: ["noche = night", "estudio = I study"]
      },
      {
        cue: "Say when you eat.",
        say: "Como a la una.",
        meaning: "I eat at one.",
        pattern: "Como a la + time",
        vocab: ["como = I eat", "a la una = at one"]
      },
      {
        cue: "Say when you sleep.",
        say: "Duermo a las diez.",
        meaning: "I sleep at ten.",
        pattern: "Duermo a las + time",
        vocab: ["duermo = I sleep", "diez = ten"]
      }
    ]
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
    hints: ["Tengo means I have.", "Use mi for my."],
    prompts: [
      {
        cue: "Say one person you have.",
        say: "Tengo una hermana.",
        meaning: "I have a sister.",
        pattern: "Tengo + person",
        vocab: ["tengo = I have", "hermana = sister"]
      },
      {
        cue: "Say someone's name.",
        say: "Mi amigo se llama Alex.",
        meaning: "My friend's name is Alex.",
        pattern: "Mi + person + se llama + name",
        vocab: ["mi = my", "se llama = is called"]
      },
      {
        cue: "Describe them simply.",
        say: "Es muy amable.",
        meaning: "They are very kind.",
        pattern: "Es muy + adjective",
        vocab: ["es = is", "amable = kind"]
      },
      {
        cue: "Say where someone lives.",
        say: "Vive en Londres.",
        meaning: "They live in London.",
        pattern: "Vive en + place",
        vocab: ["vive = lives", "en = in"]
      },
      {
        cue: "Ask about their family.",
        say: "Y tu familia?",
        meaning: "And your family?",
        pattern: "Y tu + topic",
        vocab: ["tu = your", "familia = family"]
      }
    ]
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
    hints: ["Me gusta is followed by an activity.", "Y a ti? keeps the conversation going."],
    prompts: [
      {
        cue: "Say one thing you like.",
        say: "Me gusta escuchar musica.",
        meaning: "I like listening to music.",
        pattern: "Me gusta + activity",
        vocab: ["me gusta = I like", "escuchar = to listen"]
      },
      {
        cue: "Add another preference.",
        say: "Tambien me gusta caminar.",
        meaning: "I also like walking.",
        pattern: "Tambien me gusta + activity",
        vocab: ["tambien = also", "caminar = to walk"]
      },
      {
        cue: "Ask them back.",
        say: "Y a ti?",
        meaning: "And you?",
        pattern: "Fixed phrase",
        vocab: ["y = and", "a ti = to you"]
      },
      {
        cue: "Say something you do not like much.",
        say: "No me gusta mucho correr.",
        meaning: "I do not like running much.",
        pattern: "No me gusta mucho + activity",
        vocab: ["no = no/not", "mucho = much"]
      },
      {
        cue: "Ask what they like.",
        say: "Que te gusta?",
        meaning: "What do you like?",
        pattern: "Que te gusta?",
        vocab: ["que = what", "te gusta = you like"]
      }
    ]
  }
];

export function getLessonById(id: string): Lesson {
  return lessons.find((lesson) => lesson.id === id) ?? lessons[0];
}
