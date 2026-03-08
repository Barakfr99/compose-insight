import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardPaste, Clock, FileText, Trash2, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Submission = {
  id: string;
  student_name: string;
  answer_text: string;
  word_count: number;
  time_spent_seconds: number;
  paste_count: number;
  submitted_at: string;
  grade: number | null;
  task_id: string | null;
};

type SortMode = "time" | "name";

const TaskDashboard = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("task_id", taskId!)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
    refetchInterval: 5000,
    enabled: !!taskId,
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

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          דשבורד – {task?.title || "טוען..."}
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
          {sorted.map((s) => (
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
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {s.word_count} מילים
                  </span>
                  {s.grade !== null && (
                    <span className="text-primary font-semibold">ציון: {s.grade}</span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4 border-t border-border mt-2 space-y-4">
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{s.answer_text}</p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
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
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleCopy(s.answer_text, s.id)}>
                      {copiedId === s.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === s.id ? "הועתק" : "העתקה"}
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
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default TaskDashboard;
