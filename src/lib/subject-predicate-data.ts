// ─── Types ───────────────────────────────────────────────────────────────────
export type Role = "נשוא" | "נושא" | "נשוא+נושא" | "נשוא+נושא סתמי";

export const roles: { label: Role; colorClass: string }[] = [
  { label: "נשוא", colorClass: "bg-destructive text-destructive-foreground" },
  { label: "נושא", colorClass: "bg-primary text-primary-foreground" },
  { label: "נשוא+נושא", colorClass: "bg-accent-purple text-white" },
  { label: "נשוא+נושא סתמי", colorClass: "bg-warning text-warning-foreground" },
];

export const roleStyleMap: Record<Role, string> = {
  "נשוא": "bg-destructive/15 text-destructive border-destructive/30",
  "נושא": "bg-primary/15 text-primary border-primary/30",
  "נשוא+נושא": "bg-accent-purple/15 text-accent-purple border-accent-purple/30",
  "נשוא+נושא סתמי": "bg-warning/15 text-warning border-warning/30",
};

export const roleBadgeMap: Record<Role, string> = {
  "נשוא": "bg-destructive text-destructive-foreground",
  "נושא": "bg-primary text-primary-foreground",
  "נשוא+נושא": "bg-accent-purple text-white",
  "נשוא+נושא סתמי": "bg-warning text-warning-foreground",
};

// ─── Sentences ──────────────────────────────────────────────────────────────
export const sentences = [
  "מחר נלמד את הנושא החדש.",
  "סגרו את הדלת בצאתכם החוצה!",
  "כתבו את המשפטים הבאים במחברת!",
  "בפגישה דחופה בבית הנשיא סוכם על הקמת ממשלה חדשה.",
  "במקרה של עומס תנועה אני אנסע בדרך אחרת.",
  "הספר החדש של הסופר המוערך הגיע לחנויות.",
  "הבחינה בלשון כבר כתובה.",
  "הנזקים הבריאותיים של העישון מטרידים כמעט כל מעשן.",
  "הבוקר דיווחו בהרחבה על ההצפות בצפון הארץ.",
  "מצאתי את האפיקומן בליל הסדר.",
  "ילדים אוהבים שוקולד.",
  "עברית כותבים מימין לשמאל.",
];

// ─── Word groups: selecting one word auto-selects linked words ──────────────
// Map: sentenceIdx → { wordIdx → array of all word indices in the group }
export const wordGroups: Record<number, Record<number, number[]>> = {
  3: { 4: [4, 5], 5: [4, 5] }, // "סוכם על" linked together
};

// ─── Answer key ─────────────────────────────────────────────────────────────
export const correctAnswers: Record<number, Record<number, Role>> = {
  0: { 1: "נשוא+נושא" },                     // נלמד
  1: { 0: "נשוא+נושא" },                     // סגרו
  2: { 0: "נשוא+נושא" },                     // כתבו
  3: { 4: "נשוא+נושא סתמי", 5: "נשוא+נושא סתמי" }, // סוכם על
  4: { 4: "נושא", 5: "נשוא" },               // אני, אנסע
  5: { 0: "נושא", 5: "נשוא" },               // הספר, הגיע
  6: { 0: "נושא", 3: "נשוא" },               // הבחינה, כתובה
  7: { 0: "נושא", 4: "נשוא" },               // הנזקים, מטרידים
  8: { 1: "נשוא+נושא סתמי" },                // דיווחו
  9: { 0: "נשוא+נושא" },                     // מצאתי
  10: { 0: "נושא", 1: "נשוא" },              // ילדים, אוהבים
  11: { 1: "נשוא+נושא סתמי" },               // כותבים
};

// ─── Grading ────────────────────────────────────────────────────────────────
export function calculateGrade(studentAnswers: Record<number, Record<number, Role>>): number {
  let totalPoints = 0;
  let earnedPoints = 0;
  const pointsPerSentence = 100 / sentences.length;

  for (let si = 0; si < sentences.length; si++) {
    const correct = correctAnswers[si] || {};
    const student = studentAnswers[si] || {};
    const correctKeys = Object.keys(correct);
    const studentKeys = Object.keys(student);

    if (correctKeys.length === 0) {
      totalPoints += pointsPerSentence;
      if (studentKeys.length === 0) earnedPoints += pointsPerSentence;
      continue;
    }

    totalPoints += pointsPerSentence;

    // Check: all correct words marked correctly + no extra wrong markings
    let sentenceCorrect = true;

    // All correct answers must be present
    for (const key of correctKeys) {
      if (student[key as any] !== correct[Number(key)]) {
        sentenceCorrect = false;
        break;
      }
    }

    // No extra wrong markings
    if (sentenceCorrect) {
      for (const key of studentKeys) {
        if (!(key in correct)) {
          sentenceCorrect = false;
          break;
        }
      }
    }

    if (sentenceCorrect) earnedPoints += pointsPerSentence;
  }

  return Math.round(earnedPoints);
}

// ─── Comparison helpers ─────────────────────────────────────────────────────
export type WordFeedback = "correct" | "wrong-role" | "extra" | "missing" | "none";

export function getWordFeedback(
  sentenceIdx: number,
  wordIdx: number,
  studentAnswers: Record<number, Record<number, Role>>
): { feedback: WordFeedback; studentRole?: Role; correctRole?: Role } {
  const correct = correctAnswers[sentenceIdx] || {};
  const student = studentAnswers[sentenceIdx] || {};
  const studentRole = student[wordIdx];
  const correctRole = correct[wordIdx];

  if (correctRole && studentRole === correctRole) return { feedback: "correct", studentRole, correctRole };
  if (correctRole && studentRole && studentRole !== correctRole) return { feedback: "wrong-role", studentRole, correctRole };
  if (!correctRole && studentRole) return { feedback: "extra", studentRole };
  if (correctRole && !studentRole) return { feedback: "missing", correctRole };
  return { feedback: "none" };
}
