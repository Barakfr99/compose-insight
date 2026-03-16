export interface BlendWord {
  blend: string;
  word1: string;
  word2: string;
  explanation: string;
}

export const ALL_WORDS: BlendWord[] = [
  { blend: "קוֹלְנוֹעַ", word1: "קוֹל", word2: "נוֹעַ", explanation: "קוֹל + נוֹעַ (תנועה) — מקום שבו \"התמונות נעות עם קול\"" },
  { blend: "כַּדּוּרְסַל", word1: "כַּדּוּר", word2: "סַל", explanation: "כַּדּוּר + סַל — משחק שבו זורקים כדור לסל" },
  { blend: "כַּדּוּרֶגֶל", word1: "כַּדּוּר", word2: "רֶגֶל", explanation: "כַּדּוּר + רֶגֶל — משחק שבו בועטים בכדור ברגל" },
  { blend: "רַמְזוֹר", word1: "רֶמֶז", word2: "אוֹר", explanation: "רֶמֶז + אוֹר — אור שנותן רמז (עצור/סע)" },
  { blend: "רַמְקוֹל", word1: "רָם", word2: "קוֹל", explanation: "רָם + קוֹל — מכשיר שמגביר את הקול (קול רם)" },
  { blend: "כַּסְפּוֹמָט", word1: "כֶּסֶף", word2: "אוֹטוֹמָט", explanation: "כֶּסֶף + אוֹטוֹמָט — מכונה אוטומטית שמוציאה כסף" },
  { blend: "תַּפּוּז", word1: "תַּפּוּחַ", word2: "זָהָב", explanation: "תַּפּוּחַ + זָהָב — \"תפוח הזהב\" (הפרי הכתום)" },
  { blend: "אוֹפַנּוֹעַ", word1: "אוֹפַן", word2: "נוֹעַ", explanation: "אוֹפַן (גלגל) + נוֹעַ (תנועה) — גלגלים שנעים" },
  { blend: "מִדְרְחוֹב", word1: "מִדְרָכָה", word2: "רְחוֹב", explanation: "מִדְרָכָה + רְחוֹב — רחוב שהפך כולו למדרכה (להולכי רגל)" },
  { blend: "מַדְחֹם", word1: "מַד", word2: "חֹם", explanation: "מַד + חֹם — מכשיר שמודד חום" },
  { blend: "חַיְדַּק", word1: "חַי", word2: "דַּק", explanation: "חַי + דַּק — יצור חי דק (זעיר) שלא רואים בעין" },
  { blend: "קַרְנַף", word1: "קֶרֶן", word2: "אַף", explanation: "קֶרֶן + אַף — חיה שיש לה קרן על האף" },
  { blend: "רַכֶּבֶל", word1: "רַכֶּבֶת", word2: "כֶּבֶל", explanation: "רַכֶּבֶת + כֶּבֶל — רכבת שנעה על כבלים (באוויר)" },
  { blend: "דַּחְפּוֹר", word1: "דָּחַף", word2: "חָפַר", explanation: "דָּחַף + חָפַר — מכונה שדוחפת וחופרת אדמה" },
  { blend: "דִּיוֹנוּן", word1: "דְּיוֹ", word2: "נוּן", explanation: "דְּיוֹ + נוּן (דג) — יצור ימי (דג) שמפריש דיו" },
  { blend: "חַרְסִינָה", word1: "חֶרֶס", word2: "סִין", explanation: "חֶרֶס + סִין — כלי חרס מיוחד שהגיע מסין" },
  { blend: "לַהַבְיוֹר", word1: "לֶהָבָה", word2: "יוֹרֶה", explanation: "לֶהָבָה + יוֹרֶה — מכשיר שיורה להבות (להבה + יורה)" },
  { blend: "מִצְפּוֹר", word1: "מִצְפֶּה", word2: "צִפּוֹר", explanation: "מִצְפֶּה + צִפּוֹר — מקום תצפית על ציפורים" },
  { blend: "שַׁלְדָּג", word1: "שָׁלָה", word2: "דָּג", explanation: "שָׁלָה (שלה = דג, צד דגים) + דָּג — ציפור ששולה (צדה) דגים" },
];

export function removeNikkud(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, "").replace(/[\s"'״׳\-()]/g, "").trim();
}

export function checkMatch(input: string, correct: string): boolean {
  return removeNikkud(input) === removeNikkud(correct);
}

export function shuffleArray<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDistractors(currentWord: BlendWord, allData: BlendWord[], count = 4): string[] {
  const others = allData.filter((w) => w.blend !== currentWord.blend);
  const pool: string[] = [];
  others.forEach((w) => { pool.push(w.word1, w.word2); });
  const unique = [...new Set(pool.map(removeNikkud))];
  const correctNorm = [removeNikkud(currentWord.word1), removeNikkud(currentWord.word2)];
  const filtered = unique.filter((w) => !correctNorm.includes(w));
  const shuffled = shuffleArray(filtered);
  const nikkudMap: Record<string, string> = {};
  allData.forEach((w) => {
    nikkudMap[removeNikkud(w.word1)] = w.word1;
    nikkudMap[removeNikkud(w.word2)] = w.word2;
  });
  return shuffled.slice(0, count).map((n) => nikkudMap[n] || n);
}

export interface HalachmimResult {
  blend: string;
  word1: string;
  word2: string;
  correct: boolean;
  attempts: number;
  phase: "typing" | "hints" | "options";
}

export function calculateHalachmimGrade(results: HalachmimResult[]): number {
  if (results.length === 0) return 0;
  const maxPoints = results.length * 3;
  let totalPoints = 0;
  for (const r of results) {
    if (!r.correct) continue;
    if (r.attempts === 1) totalPoints += 3;
    else if (r.attempts === 2) totalPoints += 2;
    else totalPoints += 1;
  }
  return Math.round((totalPoints / maxPoints) * 100);
}
