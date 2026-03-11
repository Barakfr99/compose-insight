import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, ArrowRight, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

const exerciseLabels: Record<number, string> = {
  1: "תרגיל 1 - המורה",
  2: "תרגיל 2 - פורטנייט",
  3: "תרגיל 3 - קריאת ספרים",
  4: "תרגיל 4 - ספורט",
  5: "תרגיל 5 - מסכים (מסכם)",
};

const fieldLabels: Record<string, string> = {
  "1_shared": "מידע משותף",
  "1_unique_tomer": "ייחודי לתומר",
  "1_unique_michal": "ייחודי למיכל",
  "2_shared": "מידע משותף",
  "2_unique_roi": "ייחודי לרועי",
  "2_unique_noa": "ייחודי לנועה",
  "3_shared_a": "מידע משותף א",
  "3_shared_b": "מידע משותף ב",
  "3_unique_omer": "ייחודי לעומר",
  "3_unique_rachel": "ייחודי לרחל",
  "4_shared_a": "מידע משותף א",
  "4_shared_b": "מידע משותף ב",
  "4_unique_dani_a": "ייחודי לדני א",
  "4_unique_dani_b": "ייחודי לדני ב",
  "4_unique_sara_a": "ייחודי לשרה א",
  "4_unique_sara_b": "ייחודי לשרה ב",
  "5_shared_a": "מידע משותף א",
  "5_shared_b": "מידע משותף ב",
  "5_shared_c": "מידע משותף ג",
  "5_unique_rosen": "ייחודי לרוזן",
  "5_unique_cohen": "ייחודי לכהן",
};

interface MergeWritingDashboardProps {
  taskId: string;
  taskTitle: string;
}

const MergeWritingDashboard = ({ taskId, taskTitle }: MergeWritingDashboardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, string>>({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("task_id", taskId)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleGrade = async (id: string) => {
    const grade = parseInt(grades[id]);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({ title: "ציון חייב להיות בין 0 ל-100", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("submissions").update({ grade }).eq("id", id);
    if (error) {
      toast({ title: "שגיאה בשמירת ציון", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["submissions", taskId] });
      toast({ title: "ציון נשמר" });
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const parseAnswers = (text: string): Record<string, string> => {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  const getExerciseAnswers = (answers: Record<string, string>, exNum: number) => {
    const partA = Object.entries(answers).filter(
      ([key]) => key.startsWith(`${exNum}_`) && !key.startsWith("writing_")
    );
    const writing = answers[`writing_${exNum}`] || "";
    return { partA, writing };
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">דשבורד - {taskTitle}</h1>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">{submissions.length} הגשות</p>

      {isLoading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : submissions.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">אין הגשות עדיין</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            const answers = parseAnswers(sub.answer_text);

            return (
              <Card key={sub.id}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{sub.student_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(sub.submitted_at)} · {formatTime(sub.time_spent_seconds)} דק' · {sub.paste_count} הדבקות · {sub.word_count} מילים
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {sub.grade !== null && (
                        <span className="text-sm font-bold text-primary">{sub.grade}</span>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-5 border-t border-border pt-4">
                      {[1, 2, 3, 4, 5].map((exNum) => {
                        const { partA, writing } = getExerciseAnswers(answers, exNum);
                        if (partA.length === 0 && !writing) return null;

                        return (
                          <div key={exNum} className="space-y-2">
                            <h4 className="font-bold text-sm text-primary">
                              {exerciseLabels[exNum]}
                            </h4>

                            {partA.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">חלק א' - זיהוי:</p>
                                {partA.map(([key, val]) => (
                                  <div key={key} className="flex gap-2 text-sm">
                                    <span className="text-muted-foreground min-w-[100px]">
                                      {fieldLabels[key] || key}:
                                    </span>
                                    <span className="text-foreground">{val || "—"}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {writing && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">חלק ב' - כתיבה:</p>
                                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md leading-relaxed whitespace-pre-wrap">
                                  {writing}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="ציון (0-100)"
                          value={grades[sub.id] ?? (sub.grade !== null ? String(sub.grade) : "")}
                          onChange={(e) => setGrades(prev => ({ ...prev, [sub.id]: e.target.value }))}
                          className="w-32 h-9 text-sm"
                        />
                        <Button size="sm" onClick={() => handleGrade(sub.id)}>
                          שמור ציון
                        </Button>
                        <div className="flex-1" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="gap-1">
                              <Trash2 className="h-3.5 w-3.5" />
                              מחק
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת הגשה</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם למחוק את ההגשה של {sub.student_name}? פעולה זו לא ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex gap-2 sm:justify-start">
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sub.id)}>
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MergeWritingDashboard;
