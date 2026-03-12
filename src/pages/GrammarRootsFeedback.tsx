import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Minus } from "lucide-react";

// ─── Answer Key (duplicated from dashboard for standalone page) ──────────────
const correctAnswers: Record<string, string> = {
  'pair0_a_root': 'כפה', 'pair0_b_root': 'כפת',
  'pair1_a_root': 'כרת', 'pair1_b_root': 'כרה',
  'pair2_a_root': 'רשמ', 'pair2_b_root': 'רשה',
  'pair3_a_root': 'פנמ', 'pair3_b_root': 'פנה',
  'pair4_a_root': 'לאמ', 'pair4_b_root': 'לאה',
  'pair5_a_root': 'טעה', 'pair5_b_root': 'טעמ',
  'pair6_a_root': 'תרמ', 'pair6_b_root': 'תרה',
  'pair7_a_root': 'שלמ', 'pair7_b_root': 'שלה',
  'pair8_a_root': 'תפר', 'pair8_b_root': 'פרה',
  'pair0_a_binyan': 'פעל', 'pair0_b_binyan': 'פעל',
  'pair1_a_binyan': 'פעל', 'pair1_b_binyan': 'פעל',
  'pair2_a_binyan': 'הפעיל', 'pair2_b_binyan': 'הפעיל',
  'pair3_a_binyan': 'הפעיל', 'pair3_b_binyan': 'הפעיל',
  'pair4_a_binyan': 'הפעיל', 'pair4_b_binyan': 'הפעיל',
  'pair5_a_binyan': 'הפעיל', 'pair5_b_binyan': 'הפעיל',
  'pair6_a_binyan': 'הפעיל', 'pair6_b_binyan': 'הפעיל',
  'pair7_a_binyan': 'הפעיל', 'pair7_b_binyan': 'הפעיל',
  'pair8_a_binyan': 'פעל', 'pair8_b_binyan': 'הפעיל',
  'ex1_q0': 'נטוי', 'ex1_q1': 'קפוא', 'ex1_q2': 'כלואה',
  'ex1_q3': 'שגוי', 'ex1_q4': 'מצויימ',
  'ex2_q0': 'המצאה', 'ex2_q1': 'מלוי', 'ex2_q2': 'שנוי',
  'ex2_q3': 'מחאה', 'ex2_q4': 'מלאי',
};

const displayAnswers: Record<string, string> = {
  'pair0_a_root': 'כפ"ה', 'pair0_b_root': 'כפ"ת',
  'pair1_a_root': 'כר"ת', 'pair1_b_root': 'כר"ה',
  'pair2_a_root': 'רש"מ', 'pair2_b_root': 'רש"ה',
  'pair3_a_root': 'פנ"מ', 'pair3_b_root': 'פנ"ה',
  'pair4_a_root': 'לא"מ', 'pair4_b_root': 'לא"ה',
  'pair5_a_root': 'טע"ה', 'pair5_b_root': 'טע"מ',
  'pair6_a_root': 'תר"מ', 'pair6_b_root': 'תר"ה',
  'pair7_a_root': 'של"מ', 'pair7_b_root': 'של"ה',
  'pair8_a_root': 'תפ"ר', 'pair8_b_root': 'פר"ה',
  'pair0_a_binyan': 'פעל (קל)', 'pair0_b_binyan': 'פעל (קל)',
  'pair1_a_binyan': 'פעל (קל)', 'pair1_b_binyan': 'פעל (קל)',
  'pair2_a_binyan': 'הפעיל', 'pair2_b_binyan': 'הפעיל',
  'pair3_a_binyan': 'הפעיל', 'pair3_b_binyan': 'הפעיל',
  'pair4_a_binyan': 'הפעיל', 'pair4_b_binyan': 'הפעיל',
  'pair5_a_binyan': 'הפעיל', 'pair5_b_binyan': 'הפעיל',
  'pair6_a_binyan': 'הפעיל', 'pair6_b_binyan': 'הפעיל',
  'pair7_a_binyan': 'הפעיל', 'pair7_b_binyan': 'הפעיל',
  'pair8_a_binyan': 'פעל (קל)', 'pair8_b_binyan': 'הפעיל',
  'ex1_q0': 'נָטוּי', 'ex1_q1': 'קָפוּא', 'ex1_q2': 'כְּלוּאָה',
  'ex1_q3': 'שָׁגוּי', 'ex1_q4': 'מְצוּיִים',
  'ex2_q0': 'הַמְצָאָה', 'ex2_q1': 'מִלּוּי', 'ex2_q2': 'שִׁנּוּי',
  'ex2_q3': 'מְחָאָה', 'ex2_q4': 'מְלַאי',
};

const BINYAN_VARIANTS: Record<string, string[]> = {
  'פעל': ['פעל', 'קל', 'פעלקל', 'קלפעל'],
  'הפעיל': ['הפעיל', 'היפעיל'],
};

const pairWords = ["כָּפְתָה", "כָּרְתָה", "מַרְשִׁים", "מַפְנִים", "מַלְאִים", "מַטְעִים", "מַתְרִים", "מַשְׁלִים", "תָּפְרוּ / תַּפְרוּ"];

function normalizeHebrew(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[.\-\s"'״׳()]/g, '')
    .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
    .trim();
}

function checkAnswer(key: string, studentVal: string): "correct" | "incorrect" | "empty" {
  if (!studentVal || !studentVal.trim()) return "empty";
  const correct = correctAnswers[key];
  if (!correct) return "empty";
  const normalizedInput = normalizeHebrew(studentVal);
  if (key.includes("binyan")) {
    const variants = BINYAN_VARIANTS[correct] || [correct];
    return variants.some(v => normalizeHebrew(v) === normalizedInput) ? "correct" : "incorrect";
  }
  return normalizedInput === normalizeHebrew(correct) ? "correct" : "incorrect";
}

function computeScore(answers: Record<string, string>): { correct: number; total: number } {
  let correct = 0, total = 0;
  for (const key of Object.keys(correctAnswers)) {
    total++;
    if (checkAnswer(key, answers[key] || "") === "correct") correct++;
  }
  return { correct, total };
}

const StatusIcon = ({ status }: { status: "correct" | "incorrect" | "empty" }) => {
  if (status === "correct") return <Check className="h-4 w-4 text-success" />;
  if (status === "incorrect") return <X className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const GrammarRootsFeedback = () => {
  const { submissionId } = useParams<{ submissionId: string }>();

  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission-feedback", submissionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select("*").eq("id", submissionId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!submissionId,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">טוען משוב...</p></div>;
  }
  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-destructive font-medium">ההגשה לא נמצאה</p></div>;
  }

  let answers: Record<string, string> = {};
  try { answers = JSON.parse(submission.answer_text); } catch {}
  const score = computeScore(answers);
  const grade = submission.grade ?? Math.round((score.correct / score.total) * 100);

  return (
    <div className="min-h-screen bg-background pb-safe" dir="rtl">
      <div className="sticky top-0 z-50 bg-primary shadow-md px-4 py-3 text-center">
        <h1 className="text-lg font-bold text-primary-foreground">משוב — נל"א ונל"ה</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="bg-card">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-lg text-foreground">שם התלמיד/ה: <strong>{submission.student_name}</strong></p>
            <p className={`text-3xl font-bold ${grade >= 80 ? "text-success" : grade >= 60 ? "text-warning" : "text-destructive"}`}>
              ציון: {grade}
            </p>
            <p className="text-muted-foreground text-sm">תשובות נכונות: {score.correct}/{score.total}</p>
          </CardContent>
        </Card>

        {/* Part A */}
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">חלק א': שורשים ובניינים</h3>
          <div className="space-y-3">
            {pairWords.map((word, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="font-semibold text-primary mb-2">זוג {i + 1}: {word}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["a", "b"].map((side) => {
                      const rootKey = `pair${i}_${side}_root`;
                      const binyanKey = `pair${i}_${side}_binyan`;
                      const rootStatus = checkAnswer(rootKey, answers[rootKey] || "");
                      const binyanStatus = checkAnswer(binyanKey, answers[binyanKey] || "");
                      return (
                        <div key={side} className={`rounded-lg p-3 space-y-1.5 ${
                          rootStatus === "correct" && binyanStatus === "correct" ? "bg-success/5 border border-success/20" :
                          "bg-muted/30 border border-destructive/10"
                        }`}>
                          <p className="text-sm font-medium text-muted-foreground">משפט {side === "a" ? "א'" : "ב'"}</p>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={rootStatus} />
                            <span className="text-sm text-muted-foreground">שורש:</span>
                            <span className={`font-medium ${rootStatus === "correct" ? "text-success" : rootStatus === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                              {answers[rootKey] || "—"}
                            </span>
                            {rootStatus === "incorrect" && (
                              <span className="text-xs text-success">← {displayAnswers[rootKey]}</span>
                            )}
                            {rootStatus === "empty" && (
                              <span className="text-xs text-muted-foreground">(לא נענה — {displayAnswers[rootKey]})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={binyanStatus} />
                            <span className="text-sm text-muted-foreground">בניין:</span>
                            <span className={`font-medium ${binyanStatus === "correct" ? "text-success" : binyanStatus === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                              {answers[binyanKey] || "—"}
                            </span>
                            {binyanStatus === "incorrect" && (
                              <span className="text-xs text-success">← {displayAnswers[binyanKey]}</span>
                            )}
                            {binyanStatus === "empty" && (
                              <span className="text-xs text-muted-foreground">(לא נענה — {displayAnswers[binyanKey]})</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Part B */}
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">חלק ב': יוצא הדופן</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { prefix: "ex1", title: "תרגיל 1 – פועל", count: 5 },
              { prefix: "ex2", title: "תרגיל 2 – שם", count: 5 },
            ].map(({ prefix, title, count }) => (
              <Card key={prefix}>
                <CardContent className="p-4">
                  <p className="font-semibold text-foreground mb-2">{title}</p>
                  <div className="space-y-1.5">
                    {Array.from({ length: count }, (_, qi) => {
                      const key = `${prefix}_q${qi}`;
                      const status = checkAnswer(key, answers[key] || "");
                      return (
                        <div key={qi} className="flex items-center gap-2">
                          <StatusIcon status={status} />
                          <span className="text-sm text-muted-foreground">שאלה {qi + 1}:</span>
                          <span className={`font-medium ${status === "correct" ? "text-success" : status === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                            {answers[key] || "—"}
                          </span>
                          {status === "incorrect" && (
                            <span className="text-xs text-success">← {displayAnswers[key]}</span>
                          )}
                          {status === "empty" && (
                            <span className="text-xs text-muted-foreground">(לא נענה — {displayAnswers[key]})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarRootsFeedback;
