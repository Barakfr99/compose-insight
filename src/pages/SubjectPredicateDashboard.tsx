import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardPaste, Clock, Trash2, ArrowRight, FileText, Printer, Check as CheckIcon, X as XIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  sentences, roles, roleStyleMap, roleBadgeMap, correctAnswers, getWordFeedback, calculateGrade,
  type Role, type WordFeedback,
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

// ─── Sentence renderer (shared for dashboard & PDF) ──────────────────────────
const SentenceDisplay = ({
  sentenceIdx,
  studentAnswers,
  showFeedback,
}: {
  sentenceIdx: number;
  studentAnswers: Record<number, Record<number, Role>>;
  showFeedback: boolean;
}) => {
  const words = sentences[sentenceIdx].split(/\s+/);
  const studentSel = studentAnswers[sentenceIdx] || {};

  return (
    <div className="flex items-start gap-2">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
        {sentenceIdx + 1}
      </span>
      <div className="flex flex-wrap gap-1 leading-relaxed">
        {words.map((word, wi) => {
          const role = studentSel[wi];
          if (!showFeedback) {
            // Simple display: just color the marked words
            if (role) {
              return (
                <span key={wi} className={`px-1.5 py-0.5 rounded border text-sm font-medium ${roleStyleMap[role]}`}>
                  {word}
                </span>
              );
            }
            return <span key={wi} className="text-sm text-foreground">{word}</span>;
          }

          // Feedback mode
          const { feedback, correctRole } = getWordFeedback(sentenceIdx, wi, studentAnswers);
          let className = "text-sm px-1.5 py-0.5 rounded ";
          switch (feedback) {
            case "correct":
              className += `border-2 border-success ${roleStyleMap[role!]}`;
              break;
            case "wrong-role":
              className += "border-2 border-destructive bg-destructive/10 text-destructive line-through font-medium";
              break;
            case "extra":
              className += "border-2 border-destructive bg-destructive/10 text-destructive line-through font-medium";
              break;
            case "missing":
              className += `border-2 border-dashed border-success/60 ${roleBadgeMap[correctRole!]} opacity-60 font-medium`;
              break;
            default:
              className += "text-foreground";
          }

          return (
            <span key={wi} className={className} title={
              feedback === "wrong-role" ? `סימנת: ${role} | נכון: ${correctRole}` :
              feedback === "missing" ? `חסר: ${correctRole}` :
              feedback === "extra" ? `מיותר: ${role}` : ""
            }>
              {word}
              {feedback === "missing" && <span className="text-[10px] mr-0.5">(חסר)</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ─── PDF Print View ──────────────────────────────────────────────────────────
const PrintFeedback = ({
  studentName,
  studentAnswers,
  grade,
  printRef,
}: {
  studentName: string;
  studentAnswers: Record<number, Record<number, Role>>;
  grade: number;
  printRef: React.RefObject<HTMLDivElement | null>;
}) => (
  <div ref={printRef} className="hidden print:block p-8 text-right" dir="rtl">
    <style>{`
      @media print {
        body * { visibility: hidden; }
        .print-feedback, .print-feedback * { visibility: visible; }
        .print-feedback { position: absolute; top: 0; right: 0; left: 0; }
      }
    `}</style>
    <div className="print-feedback space-y-6">
      <div className="text-center border-b-2 border-primary pb-4 mb-6">
        <h1 className="text-2xl font-bold">משוב — תרגול נושא ונשוא</h1>
        <p className="text-lg mt-2">שם התלמיד/ה: <strong>{studentName}</strong></p>
        <p className="text-xl mt-1 font-bold" style={{ color: grade >= 80 ? '#22c55e' : grade >= 60 ? '#f59e0b' : '#ef4444' }}>
          ציון: {grade}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 justify-center text-sm">
        <span className="px-2 py-1 rounded border-2 border-green-500 bg-green-50">✓ תשובה נכונה</span>
        <span className="px-2 py-1 rounded border-2 border-red-500 bg-red-50 line-through">✗ תשובה שגויה</span>
        <span className="px-2 py-1 rounded border-2 border-dashed border-green-400 bg-green-50 opacity-70">חסר (תשובה נכונה)</span>
      </div>

      <div className="space-y-4">
        {sentences.map((_, si) => {
          const correct = correctAnswers[si] || {};
          const student = studentAnswers[si] || {};
          const words = sentences[si].split(/\s+/);
          const isCorrect = JSON.stringify(correct) === JSON.stringify(
            Object.fromEntries(Object.entries(student).map(([k, v]) => [k, v]))
          );

          return (
            <div key={si} className="py-2 border-b border-gray-200">
              <div className="flex items-start gap-2 mb-1">
                <span className="font-bold text-sm w-6 text-center">{si + 1}.</span>
                <div className="flex items-center gap-1">
                  {isCorrect ? (
                    <span className="text-green-600 text-sm font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 text-sm font-bold">✗</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mr-8">
                {words.map((word, wi) => {
                  const { feedback, studentRole, correctRole } = getWordFeedback(si, wi, studentAnswers);
                  let style: React.CSSProperties = { padding: '2px 6px', borderRadius: '4px', fontSize: '14px' };

                  switch (feedback) {
                    case "correct":
                      style = { ...style, border: '2px solid #22c55e', backgroundColor: '#f0fdf4', fontWeight: 600 };
                      break;
                    case "wrong-role":
                      style = { ...style, border: '2px solid #ef4444', backgroundColor: '#fef2f2', textDecoration: 'line-through', fontWeight: 600 };
                      break;
                    case "extra":
                      style = { ...style, border: '2px solid #ef4444', backgroundColor: '#fef2f2', textDecoration: 'line-through' };
                      break;
                    case "missing":
                      style = { ...style, border: '2px dashed #22c55e', backgroundColor: '#f0fdf4', opacity: 0.7, fontWeight: 600 };
                      break;
                  }

                  return (
                    <span key={wi} style={style}>
                      {word}
                      {feedback === "wrong-role" && (
                        <span style={{ fontSize: '10px', display: 'block', color: '#ef4444' }}>
                          סימנת: {studentRole} | נכון: {correctRole}
                        </span>
                      )}
                      {feedback === "missing" && (
                        <span style={{ fontSize: '10px', display: 'block', color: '#22c55e' }}>חסר: {correctRole}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Main Dashboard ──────────────────────────────────────────────────────────
const SubjectPredicateDashboard = ({ taskId, taskTitle }: Props) => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [printSubmission, setPrintSubmission] = useState<Submission | null>(null);
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = (s: Submission) => {
    setPrintSubmission(s);
    setTimeout(() => window.print(), 300);
  };

  const avgGrade = submissions.length > 0
    ? Math.round(submissions.filter(s => s.grade !== null).reduce((sum, s) => sum + (s.grade ?? 0), 0) / Math.max(1, submissions.filter(s => s.grade !== null).length))
    : null;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right print:hidden">
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
            <p className="text-muted-foreground">ממוצע ציון: <strong className="text-foreground">{avgGrade}</strong></p>
          )}
        </div>
        <div className="flex gap-2">
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
        <span className="text-xs px-2 py-0.5 rounded-full font-medium border-2 border-success bg-success/10 text-success">✓ נכון</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium border-2 border-destructive bg-destructive/10 text-destructive line-through">✗ שגוי</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium border-2 border-dashed border-success/60 opacity-60">חסר</span>
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
                    {/* Graphical sentence display with feedback */}
                    <div className="space-y-3">
                      {sentences.map((_, si) => (
                        <div key={si} className="py-1">
                          <SentenceDisplay sentenceIdx={si} studentAnswers={studentAnswers} showFeedback={true} />
                        </div>
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
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handlePrint(s)}>
                        <Printer className="h-3.5 w-3.5" />
                        הדפסת משוב
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

      {/* Hidden print view */}
      {printSubmission && (
        <PrintFeedback
          studentName={printSubmission.student_name}
          studentAnswers={parseSelections(printSubmission.answer_text)}
          grade={printSubmission.grade ?? calculateGrade(parseSelections(printSubmission.answer_text))}
          printRef={printRef}
        />
      )}
    </div>
  );
};

export default SubjectPredicateDashboard;
