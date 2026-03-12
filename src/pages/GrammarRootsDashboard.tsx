import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ClipboardPaste, Trash2, ArrowRight, Check, X, Minus, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ─── Answer Key ─────────────────────────────────────────────────────────────

interface AnswerKey {
  [key: string]: string;
}

const correctAnswers: AnswerKey = {
  // Part A - roots
  'pair0_a_root': 'כפה',
  'pair0_b_root': 'כפת',
  'pair1_a_root': 'כרת',
  'pair1_b_root': 'כרה',
  'pair2_a_root': 'רשמ',
  'pair2_b_root': 'רשה',
  'pair3_a_root': 'פנמ',
  'pair3_b_root': 'פנה',
  'pair4_a_root': 'לאמ',
  'pair4_b_root': 'לאה',
  'pair5_a_root': 'טעה',
  'pair5_b_root': 'טעמ',
  'pair6_a_root': 'תרמ',
  'pair6_b_root': 'תרה',
  'pair7_a_root': 'שלמ',
  'pair7_b_root': 'שלה',
  'pair8_a_root': 'תפר',
  'pair8_b_root': 'פרה',
  // Part A - binyanim (canonical keys)
  'pair0_a_binyan': 'פעל',
  'pair0_b_binyan': 'פעל',
  'pair1_a_binyan': 'פעל',
  'pair1_b_binyan': 'פעל',
  'pair2_a_binyan': 'הפעיל',
  'pair2_b_binyan': 'הפעיל',
  'pair3_a_binyan': 'הפעיל',
  'pair3_b_binyan': 'הפעיל',
  'pair4_a_binyan': 'הפעיל',
  'pair4_b_binyan': 'הפעיל',
  'pair5_a_binyan': 'הפעיל',
  'pair5_b_binyan': 'הפעיל',
  'pair6_a_binyan': 'הפעיל',
  'pair6_b_binyan': 'הפעיל',
  'pair7_a_binyan': 'הפעיל',
  'pair7_b_binyan': 'הפעיל',
  'pair8_a_binyan': 'פעל',
  'pair8_b_binyan': 'הפעיל',
  // Part B - Exercise 1
  'ex1_q0': 'נטוי',
  'ex1_q1': 'קפוא',
  'ex1_q2': 'כלואה',
  'ex1_q3': 'שגוי',
  'ex1_q4': 'מצויימ',
  // Part B - Exercise 2
  'ex2_q0': 'המצאה',
  'ex2_q1': 'מלוי',
  'ex2_q2': 'שנוי',
  'ex2_q3': 'מחאה',
  'ex2_q4': 'מלאי',
};

// Display-friendly names for correct answers
const displayAnswers: AnswerKey = {
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
  'נפעל': ['נפעל', 'ניפעל'],
  'פיעל': ['פיעל'],
  'פועל': ['פועל'],
  'הפעיל': ['הפעיל', 'היפעיל'],
  'הופעל': ['הופעל'],
  'התפעל': ['התפעל', 'היתפעל'],
};

const pairWords = ["כָּפְתָה", "כָּרְתָה", "מַרְשִׁים", "מַפְנִים", "מַלְאִים", "מַטְעִים", "מַתְרִים", "מַשְׁלִים", "תָּפְרוּ / תַּפְרוּ"];

type SortMode = "time" | "name";

interface Submission {
  id: string;
  student_name: string;
  answer_text: string;
  word_count: number;
  time_spent_seconds: number;
  paste_count: number;
  submitted_at: string;
  grade: number | null;
}

interface GrammarRootsDashboardProps {
  taskId: string;
  taskTitle: string;
}

function normalizeHebrew(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u0591-\u05C7]/g, '')   // ניקוד
    .replace(/[.\-\s"'״׳()]/g, '')     // סימנים (כולל סוגריים)
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ')
    .trim();
}

function checkAnswer(key: string, studentVal: string): "correct" | "incorrect" | "empty" {
  if (!studentVal || !studentVal.trim()) return "empty";
  const correct = correctAnswers[key];
  if (!correct) return "empty";

  const normalizedInput = normalizeHebrew(studentVal);

  // For binyan answers, check against variants
  if (key.includes("binyan")) {
    const variants = BINYAN_VARIANTS[correct] || [correct];
    return variants.some(v => normalizeHebrew(v) === normalizedInput) ? "correct" : "incorrect";
  }
  // For exercise answers, normalize and compare
  if (key.startsWith("ex")) {
    return normalizeHebrew(studentVal) === normalizeHebrew(correct) ? "correct" : "incorrect";
  }
  // For roots, normalize and compare
  return normalizedInput === normalizeHebrew(correct) ? "correct" : "incorrect";
}

function computeScore(answers: Record<string, string>): { correct: number; total: number } {
  let correct = 0;
  let total = 0;
  for (const key of Object.keys(correctAnswers)) {
    total++;
    if (checkAnswer(key, answers[key] || "") === "correct") correct++;
  }
  return { correct, total };
}

const StatusIcon = ({ status }: { status: "correct" | "incorrect" | "empty" }) => {
  if (status === "correct") return <Check className="h-4 w-4 text-green-600" />;
  if (status === "incorrect") return <X className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const GrammarRootsDashboard = ({ taskId, taskTitle }: GrammarRootsDashboardProps) => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleCopyLink = (submissionId: string) => {
    const url = `${window.location.origin}/task/${taskId}/feedback/${submissionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(submissionId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "קישור הועתק ללוח" });
  };

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("task_id", taskId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
    refetchInterval: 5000,
  });

  const sorted = [...submissions].sort((a, b) => {
    if (sortMode === "name") return a.student_name.localeCompare(b.student_name, "he");
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  const formatMinutes = (seconds: number) => `${Math.round(seconds / 60)} דקות`;

  const handleGradeChange = async (id: string, value: string) => {
    const grade = value === "" ? null : Math.min(100, Math.max(0, parseInt(value) || 0));
    const { error } = await supabase.from("submissions").update({ grade }).eq("id", id);
    if (error) {
      toast({ title: "שגיאה בשמירת הציון", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
      toast({ title: "ההגשה נמחקה" });
    }
  };

  const renderSubmissionContent = (s: Submission) => {
    let answers: Record<string, string> = {};
    try {
      answers = JSON.parse(s.answer_text);
    } catch {
      return <p className="text-muted-foreground">שגיאה בפענוח התשובות</p>;
    }

    const score = computeScore(answers);

    return (
      <div className="space-y-6">
        {/* Part A */}
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">חלק א': שורשים ובניינים</h3>
          <div className="space-y-3">
            {pairWords.map((word, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <p className="font-semibold text-primary mb-2 text-base">זוג {i + 1}: {word}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["a", "b"].map((side) => {
                      const rootKey = `pair${i}_${side}_root`;
                      const binyanKey = `pair${i}_${side}_binyan`;
                      const rootStatus = checkAnswer(rootKey, answers[rootKey] || "");
                      const binyanStatus = checkAnswer(binyanKey, answers[binyanKey] || "");
                      return (
                        <div key={side} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                          <p className="text-sm font-medium text-muted-foreground">משפט {side === "a" ? "א'" : "ב'"}</p>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={rootStatus} />
                            <span className="text-sm text-muted-foreground">שורש:</span>
                            <span className={`font-medium ${rootStatus === "correct" ? "text-green-700" : rootStatus === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                              {answers[rootKey] || "—"}
                            </span>
                            {rootStatus === "incorrect" && (
                              <span className="text-xs text-muted-foreground">(נכון: {displayAnswers[rootKey]})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusIcon status={binyanStatus} />
                            <span className="text-sm text-muted-foreground">בניין:</span>
                            <span className={`font-medium ${binyanStatus === "correct" ? "text-green-700" : binyanStatus === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                              {answers[binyanKey] || "—"}
                            </span>
                            {binyanStatus === "incorrect" && (
                              <span className="text-xs text-muted-foreground">(נכון: {displayAnswers[binyanKey]})</span>
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
                          <span className={`font-medium ${status === "correct" ? "text-green-700" : status === "incorrect" ? "text-destructive" : "text-muted-foreground"}`}>
                            {answers[key] || "—"}
                          </span>
                          {status === "incorrect" && (
                            <span className="text-xs text-muted-foreground">(נכון: {displayAnswers[key]})</span>
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

        {/* Score + Grade */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <div className="bg-primary/10 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">תשובות נכונות: </span>
            <span className="font-bold text-primary text-lg">{score.correct}/{score.total}</span>
          </div>
          <div className="bg-muted/50 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">ציון מחושב: </span>
            <span className="font-bold text-foreground text-lg">{Math.round((score.correct / score.total) * 100)}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">ציון סופי:</label>
            <Input
              dir="ltr"
              type="number"
              min={0}
              max={100}
              placeholder={String(Math.round((score.correct / score.total) * 100))}
              defaultValue={s.grade ?? ""}
              className="w-20 h-8 text-center text-sm"
              onBlur={(e) => {
                const val = e.target.value;
                if (val === "") {
                  // If cleared, save auto-calculated grade
                  handleGradeChange(s.id, String(Math.round((score.correct / score.total) * 100)));
                } else {
                  handleGradeChange(s.id, val);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              const grade = s.grade ?? Math.round((score.correct / score.total) * 100);
              generateGrammarPDF(s.student_name, taskTitle, answers, grade);
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            ייצוא דף משוב
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                מחיקה
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>מחיקת הגשה</AlertDialogTitle>
                <AlertDialogDescription>
                  האם למחוק את ההגשה של {s.student_name}? פעולה זו לא ניתנת לביטול.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2 sm:justify-start">
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(s.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  מחיקה
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right" dir="rtl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          דשבורד – {taskTitle}
        </h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">סה&quot;כ הגשות: <strong className="text-foreground">{submissions.length}</strong></p>
        <div className="flex gap-2">
          <Button variant={sortMode === "time" ? "default" : "outline"} size="sm" onClick={() => setSortMode("time")}>
            לפי זמן
          </Button>
          <Button variant={sortMode === "name" ? "default" : "outline"} size="sm" onClick={() => setSortMode("name")}>
            לפי שם
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground">אין הגשות עדיין.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {sorted.map((s) => {
            let score = { correct: 0, total: 0 };
            try {
              score = computeScore(JSON.parse(s.answer_text));
            } catch {}

            return (
              <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-wrap items-center gap-4 text-sm w-full">
                    <span className="font-semibold text-foreground">{s.student_name}</span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(s.submitted_at)}
                    </span>
                    <span className="text-muted-foreground">{formatMinutes(s.time_spent_seconds)}</span>
                    <span className={`flex items-center gap-1 ${s.paste_count > 3 ? "text-orange-500 font-semibold" : "text-muted-foreground"}`}>
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      {s.paste_count}
                    </span>
                    <span className={`font-semibold ${score.correct === score.total ? "text-green-600" : score.correct >= score.total * 0.7 ? "text-primary" : "text-orange-500"}`}>
                      {score.correct}/{score.total}
                    </span>
                    <span className="text-primary font-semibold">
                      ציון: {s.grade ?? Math.round((score.correct / score.total) * 100)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4 border-t border-border mt-2">
                    {renderSubmissionContent(s)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default GrammarRootsDashboard;
