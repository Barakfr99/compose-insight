export interface Idiom {
  id: number;
  idiom: string;
  meaning: string;
  example: string;
}

export const IDIOMS: Idiom[] = [
  { id: 1, idiom: "העלה חרס", meaning: "נכשל במאמציו, לא מצא דבר", example: "כל ניסיונותיו לאתר את הקובץ העלו חרס." },
  { id: 2, idiom: "נתן אור ירוק", meaning: "נתן אישור לצאת לדרך או להתחיל בפעולה", example: "המנהל נתן אור ירוק לתחילת הפרויקט." },
  { id: 3, idiom: "פתח דף חדש", meaning: "התחיל מהתחלה, בדרך כלל לאחר כישלון או מריבה", example: "לאחר הסכסוך, השכנים פתחו דף חדש." },
  { id: 4, idiom: "עשה חיל", meaning: "הצליח מאוד בתחומו", example: "הקצין הצעיר עשה חיל בתפקידו החדש." },
  { id: 5, idiom: "בא אל קיצו", meaning: "הסתיים", example: "המשבר הפוליטי בא אל קיצו לאחר חודשים." },
  { id: 6, idiom: "נתן את הדין", meaning: "נשא באחריות למעשיו או נענש עליהם", example: "העבריין נתן את הדין על מעשיו בבית המשפט." },
  { id: 7, idiom: "שם פעמיו", meaning: "יצא לדרך, צעד לכיוון מסוים", example: "המטייל שם פעמיו לעבר פסגת ההר." },
  { id: 8, idiom: "בא לידי ביטוי", meaning: "נראה בשטח, בא לידי מימוש או הגשמה", example: "כישרונה בא לידי ביטוי בתערוכה החדשה." },
  { id: 9, idiom: "טמן ידו בצלחת", meaning: "התערב בעניין (בשלילה: לא טמן ידו – כלומר פעל)", example: "השר לא טמן ידו בצלחת והגיב למתקפות." },
  { id: 10, idiom: "תקע יתד", meaning: "התיישב או התבסס במקום מסוים באופן קבוע", example: "החברה תקעה יתד בשוק האירופי." },
  { id: 11, idiom: "פשט את הרגל", meaning: "העסק נסגר מחוסר תקציב וחובות", example: "החברה הגדולה פשטה את הרגל." },
  { id: 12, idiom: "ירד לטמיון", meaning: "אבד לגמרי, הלך לאיבוד", example: "כל רכושו ירד לטמיון עקב השרפה." },
  { id: 13, idiom: "הצביע ברגליים", meaning: "הביע דעה על ידי הגעה או אי-הגעה", example: "הקהל הצביע ברגליים למרות הביקורות." },
  { id: 14, idiom: "הדיר שינה מעיניו", meaning: "גרם לדאגה גדולה שהפריעה לישון", example: "המחשבות הדירו שינה מעיניי." },
  { id: 15, idiom: "ביקש את ידה", meaning: "הציע נישואין", example: "הבחור ביקש את ידה של חברתו." },
  { id: 16, idiom: "שם כספו על קרן הצבי", meaning: "השקיע במקום מסוכן ולא בטוח", example: "המשקיע שם כספו על קרן הצבי." },
  { id: 17, idiom: "הגיע לעמק השווה", meaning: "הגיע להסכמה או לפשרה", example: "הצדדים הגיעו לעמק השווה." },
  { id: 18, idiom: "העביר על דעתו", meaning: "גרם לו לאבד את שיקול הדעת", example: "ההצלחה העבירה את היזם על דעתו." },
  { id: 19, idiom: "צובר תאוצה", meaning: "הולך ומתגבר מהר", example: "התהליך הולך וצובר תאוצה." },
  { id: 20, idiom: "יצא לאור", meaning: "התפרסם (ספר/שיר)", example: "הספר יצא לאור בשבוע שעבר." },
  { id: 21, idiom: "יצא בשן ועין", meaning: "יצא בנזק כבד אך ניצל", example: "הוא יצא בשן ועין מהתאונה." },
  { id: 22, idiom: "מקדים את זמנו", meaning: "חדשני מדי לתקופתו", example: "המדען מקדים את זמנו." },
];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Split idioms into rounds of ~6 each */
export function getRounds(): Idiom[][] {
  const shuffled = shuffleArray(IDIOMS);
  const rounds: Idiom[][] = [];
  const perRound = 6;
  for (let i = 0; i < shuffled.length; i += perRound) {
    rounds.push(shuffled.slice(i, i + perRound));
  }
  return rounds;
}

export interface MatchResult {
  idiomId: number;
  idiom: string;
  correctMeaning: string;
  selectedMeaning: string;
  attempts: number;
  correct: boolean;
}

/**
 * Calculate grade 0-100 based on attempts per idiom.
 * 1st attempt = 100%, 2nd = 50%, 3rd+ = 0%
 */
export function calculateIdiomsGrade(results: MatchResult[]): number {
  if (results.length === 0) return 0;
  let totalScore = 0;
  for (const r of results) {
    if (r.attempts === 1) totalScore += 100;
    else if (r.attempts === 2) totalScore += 50;
    // 3+ = 0
  }
  return Math.round(totalScore / results.length);
}
