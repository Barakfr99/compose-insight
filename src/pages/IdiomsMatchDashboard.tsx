import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Trash2, ArrowRight, Check, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { MatchResult } from "@/lib/idioms-data";

type SortMode = "time" | "name";

interface Submission {
  id: string;
  student_name: string;
  answer_text: string;
  time_spent_seconds: number;
  submitted_at: string;
  grade: number | null;
}

interface Props {
  taskId: string;
  taskTitle: string;
}

function parseResults(answerText: string): MatchResult[] {
  try {
    const data = JSON.parse(answerText);
    return data.matches || [];
  } catch {
    return [];
  }
}

function attemptsColor(a: number) {
  if (a === 1) return "text-success";
  if (a === 2) return "text-warning";
  return "text-destructive";
}

function attemptsBg(a: number) {
  if (a === 1) return "bg-success/10 border-success/30";
  if (a === 2) return "bg-warning/10 border-warning/30";
  return "bg-destructive/10 border-destructive/30";
}

const IdiomsMatchDashboard = ({ taskId, taskTitle }: Props) => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  };

  const formatMinutes = (s: number) => `${Math.round(s / 60)} דקות`;

  const handleCopyLink = (submissionId: string) => {
    const url = `${window.location.origin}/task/${taskId}/feedback/${submissionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(submissionId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "קישור הועתק ללוח" });
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
    const results = parseResults(s.answer_text);
    if (results.length === 0) return <p className="text-muted-foreground">שגיאה בפענוח התשובות</p>;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((r, i) => (
            <div key={i} className={`rounded-lg border p-3 ${attemptsBg(r.attempts)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">{r.idiom}</span>
                <span className={`text-xs font-bold ${attemptsColor(r.attempts)}`}>
                  {r.attempts === 1 ? "ניסיון ראשון ✓" : `${r.attempts} ניסיונות`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{r.correctMeaning}</p>
            </div>
          ))}
        </div>

        {/* Score & actions */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
          <div className="bg-primary/10 rounded-lg px-4 py-2">
            <span className="text-sm text-muted-foreground">ציון מחושב: </span>
            <span className="font-bold text-primary text-lg">{s.grade ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">ציון סופי:</label>
            <Input
              dir="ltr"
              type="number"
              min={0}
              max={100}
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
                <AlertDialogDescription>האם למחוק את ההגשה של {s.student_name}?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2 sm:justify-start">
                <AlertDialogCancel>ביטול</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        <h1 className="text-2xl font-bold text-foreground">דשבורד – {taskTitle}</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">סה&quot;כ הגשות: <strong className="text-foreground">{submissions.length}</strong></p>
        <div className="flex gap-2">
          <Button variant={sortMode === "time" ? "default" : "outline"} size="sm" onClick={() => setSortMode("time")}>לפי זמן</Button>
          <Button variant={sortMode === "name" ? "default" : "outline"} size="sm" onClick={() => setSortMode("name")}>לפי שם</Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground">אין הגשות עדיין.</p>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {sorted.map((s) => {
            const results = parseResults(s.answer_text);
            const firstAttempts = results.filter(r => r.attempts === 1).length;

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
                    <span className="text-success font-medium">{firstAttempts}/{results.length} בניסיון ראשון</span>
                    <span className="text-primary font-semibold">ציון: {s.grade ?? 0}</span>
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

export default IdiomsMatchDashboard;
