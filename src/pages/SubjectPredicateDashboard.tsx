import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardPaste, Clock, Trash2, ArrowRight, Link2, Copy, Check, X, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  sentences, roles, roleStyleMap, roleBadgeMap, correctAnswers, getWordFeedback, calculateGrade,
  type Role,
} from "@/lib/subject-predicate-data";

type Submission = {
  id: string;
  student_name: string;
  answer_text: string;
  word_count: number;
  time_spent_seconds: number;
  paste_count: number;
  submitted_at: string;
  grade: number | null;
};

type SortMode = "time" | "name" | "grade";

interface Props {
  taskId: string;
  taskTitle: string;
}

// ─── Error explanation ──────────────────────────────────────────────────────
function getSentenceExplanation(
  sentenceIdx: number,
  studentAnswers: Record<number, Record<number, Role>>
): string | null {
  const correct = correctAnswers[sentenceIdx] || {};
  const student = studentAnswers[sentenceIdx] || {};
  const words = sentences[sentenceIdx].split(/\s+/);
  const errors: string[] = [];

  for (const [wi, correctRole] of Object.entries(correct)) {
    const studentRole = student[Number(wi)];
    const word = words[Number(wi)];
    if (!studentRole) {
      errors.push(`"${word}" → ${correctRole} (לא סומן)`);
    } else if (studentRole !== correctRole) {
      errors.push(`"${word}" → ${correctRole} (סומן כ${studentRole})`);
    }
  }

  for (const [wi, studentRole] of Object.entries(student)) {
    if (!(wi in correct)) {
      errors.push(`"${words[Number(wi)]}" → מיותר (סומן כ${studentRole})`);
    }
  }

  return errors.length > 0 ? errors.join(" · ") : null;
}

// ─── Sentence display with V/X icons ────────────────────────────────────────
const SentenceWithFeedback = ({
  sentenceIdx,
  studentAnswers,
}: {
  sentenceIdx: number;
  studentAnswers: Record<number, Record<number, Role>>;
}) => {
  const words = sentences[sentenceIdx].split(/\s+/);
  const studentSel = studentAnswers[sentenceIdx] || {};
  const explanation = getSentenceExplanation(sentenceIdx, studentAnswers);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
          {sentenceIdx + 1}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 leading-relaxed">
          {words.map((word, wi) => {
            const { feedback, correctRole } = getWordFeedback(sentenceIdx, wi, studentAnswers);
            const role = studentSel[wi];

            if (feedback === "none") {
              return <span key={wi} className="text-sm text-foreground px-1 py-0.5">{word}</span>;
            }

            return (
              <span key={wi} className="inline-flex items-center gap-0.5">
                {feedback === "correct" && <Check className="h-3 w-3 text-success shrink-0" />}
                {(feedback === "wrong-role" || feedback === "extra") && <X className="h-3 w-3 text-destructive shrink-0" />}
                {feedback === "missing" && <Check className="h-3 w-3 text-success/50 shrink-0" />}

                <span className={`px-1.5 py-0.5 rounded border text-sm font-medium ${
                  feedback === "correct" ? roleStyleMap[role!] :
                  feedback === "wrong-role" ? "bg-destructive/10 text-destructive border-destructive/30" :
                  feedback === "extra" ? "bg-destructive/10 text-destructive border-destructive/30" :
                  feedback === "missing" ? `border-dashed ${roleBadgeMap[correctRole!]} opacity-50` : ""
                }`}>
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      </div>
      {explanation && (
        <div className="mr-8 text-xs text-destructive bg-destructive/5 rounded px-3 py-1.5 border border-destructive/10">
          💡 {explanation}
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const SubjectPredicateDashboard = ({ taskId, taskTitle }: Props) => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const queryClient = useQueryClient();

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
    if (sortMode === "grade") return (b.grade ?? -1) - (a.grade ?? -1);
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  const formatMinutes = (seconds: number) => `${Math.round(seconds / 60)} דקות`;

  const parseSelections = (text: string): Record<number, Record<number, Role>> => {
    try { return JSON.parse(text); } catch { return {}; }
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

  const handleGradeChange = async (id: string, value: string) => {
    const grade = value === "" ? null : Math.min(100, Math.max(0, parseInt(value) || 0));
    const { error } = await supabase.from("submissions").update({ grade }).eq("id", id);
    if (error) {
      toast({ title: "שגיאה בשמירת הציון", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
    }
  };

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    let updated = 0;
    for (const s of submissions) {
      const answers = parseSelections(s.answer_text);
      const grade = calculateGrade(answers);
      if (grade !== s.grade) {
        await supabase.from("submissions").update({ grade }).eq("id", s.id);
        updated++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
    setIsRecalculating(false);
    toast({ title: `חושבו ${updated} ציונים מחדש` });
  };

  const handleCopyLink = (submissionId: string) => {
    const url = `${window.location.origin}/task/${taskId}/feedback/${submissionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(submissionId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "קישור הועתק ללוח" });
  };

  const avgGrade = submissions.length > 0
    ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + (s.grade ?? 0), 0) / Math.max(1, submissions.filter(s => s.grade !== null).length))
    : null;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">דשבורד – {taskTitle}</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">סה&quot;כ הגשות: <strong className="text-foreground">{submissions.length}</strong></p>
          {avgGrade !== null && (
            <p className="text-muted-foreground">ממוצע: <strong className="text-foreground">{avgGrade}</strong></p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalculateAll} disabled={isRecalculating} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${isRecalculating ? "animate-spin" : ""}`} />
            חשב ציונים מחדש
          </Button>
          {(["time", "name", "grade"] as SortMode[]).map((mode) => (
            <Button key={mode} variant={sortMode === mode ? "default" : "outline"} size="sm" onClick={() => setSortMode(mode)}>
              {mode === "time" ? "לפי זמן" : mode === "name" ? "לפי שם" : "לפי ציון"}
            </Button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <span key={r.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.colorClass}`}>
            {r.label}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 text-success"><Check className="h-3 w-3" /> נכון</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 text-destructive"><X className="h-3 w-3" /> שגוי</span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground">אין הגשות עדיין.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {sorted.map((s) => {
            const studentAnswers = parseSelections(s.answer_text);
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
                    <span className={`flex items-center gap-1 ${s.paste_count > 3 ? "text-warning font-semibold" : "text-muted-foreground"}`}>
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      {s.paste_count}
                    </span>
                    {s.grade !== null && (
                      <span className={`font-semibold ${s.grade >= 80 ? "text-success" : s.grade >= 60 ? "text-warning" : "text-destructive"}`}>
                        ציון: {s.grade}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4 border-t border-border mt-2 space-y-4">
                    {/* Graphical sentence display with V/X feedback */}
                    <div className="space-y-3">
                      {sentences.map((_, si) => (
                        <SentenceWithFeedback key={si} sentenceIdx={si} studentAnswers={studentAnswers} />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground whitespace-nowrap">ציון:</label>
                        <Input
                          dir="ltr"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0-100"
                          defaultValue={s.grade ?? ""}
                          className="w-20 h-8 text-center text-sm"
                          onBlur={(e) => handleGradeChange(s.id, e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                        />
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleCopyLink(s.id)}>
                        {copiedId === s.id ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        {copiedId === s.id ? "הועתק!" : "קישור למשוב"}
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
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default SubjectPredicateDashboard;
