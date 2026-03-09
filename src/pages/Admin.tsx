import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Share2, BarChart3, Pencil, Trash2, Check, X, Eye } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MERGE_TASK_TITLE_KEY = "merge_task_title";
const MERGE_TASK_DESC_KEY = "merge_task_desc";

const Admin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingMerge, setEditingMerge] = useState(false);
  const [mergeTitle, setMergeTitle] = useState(() => localStorage.getItem(MERGE_TASK_TITLE_KEY) || "משימת כתיבה ממזגת");
  const [mergeDesc, setMergeDesc] = useState(() => localStorage.getItem(MERGE_TASK_DESC_KEY) || "משימה קבועה עם 5 תרגילים");
  const [mergeTitleDraft, setMergeTitleDraft] = useState("");
  const [mergeDescDraft, setMergeDescDraft] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch submission counts per task
  const { data: submissionCounts = {} } = useQuery({
    queryKey: ["submission-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("task_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((s) => {
        if (s.task_id) {
          counts[s.task_id] = (counts[s.task_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const handleShare = async (taskId: string) => {
    const url = `${window.location.origin}/task/${taskId}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "הקישור הועתק ללוח" });
  };

  const handleDelete = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast({ title: "שגיאה במחיקה", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["submission-counts"] });
      toast({ title: "המשימה נמחקה" });
    }
  };

  const handleRename = async (taskId: string) => {
    if (!renameValue.trim()) return;
    const { error } = await supabase.from("tasks").update({ title: renameValue.trim() }).eq("id", taskId);
    if (error) {
      toast({ title: "שגיאה בשינוי שם", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setRenamingId(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">ניהול משימות</h1>
        <Button onClick={() => navigate("/admin/create")} className="gap-2">
          <Plus className="h-4 w-4" />
          משימה חדשה
        </Button>
      </div>

      {/* Merge Writing Task - Fixed card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              {editingMerge ? (
                <div className="space-y-2">
                  <Input
                    dir="rtl"
                    value={mergeTitleDraft}
                    onChange={(e) => setMergeTitleDraft(e.target.value)}
                    placeholder="שם המשימה"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Input
                    dir="rtl"
                    value={mergeDescDraft}
                    onChange={(e) => setMergeDescDraft(e.target.value)}
                    placeholder="תיאור קצר"
                    className="h-8 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                      setMergeTitle(mergeTitleDraft.trim() || mergeTitle);
                      setMergeDesc(mergeDescDraft.trim() || mergeDesc);
                      localStorage.setItem(MERGE_TASK_TITLE_KEY, mergeTitleDraft.trim() || mergeTitle);
                      localStorage.setItem(MERGE_TASK_DESC_KEY, mergeDescDraft.trim() || mergeDesc);
                      setEditingMerge(false);
                      toast({ title: "השינויים נשמרו" });
                    }}>
                      <Check className="h-3.5 w-3.5" />
                      שמור
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingMerge(false)}>
                      <X className="h-3.5 w-3.5" />
                      ביטול
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-foreground">📝 {mergeTitle}</h3>
                  <p className="text-xs text-muted-foreground">{mergeDesc}</p>
                </>
              )}
            </div>
            {!editingMerge && (
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("/merge-writing", "_blank")}>
                  <Eye className="h-3.5 w-3.5" />
                  תצוגה מקדימה
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                  navigator.clipboard.writeText("https://pen-pal-portal.lovable.app/merge-writing");
                  toast({ title: "הקישור הועתק ללוח" });
                }}>
                  <Share2 className="h-3.5 w-3.5" />
                  שיתוף
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/merge-writing/dashboard")}>
                  <BarChart3 className="h-3.5 w-3.5" />
                  דשבורד
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
                  setMergeTitleDraft(mergeTitle);
                  setMergeDescDraft(mergeDesc);
                  setEditingMerge(true);
                }}>
                  <Pencil className="h-3.5 w-3.5" />
                  עריכה
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">טוען...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-lg">אין משימות עדיין</p>
          <Button onClick={() => navigate("/admin/create")} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            יצירת משימה ראשונה
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-card">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Title / Rename */}
                  <div className="flex-1 min-w-0">
                    {renamingId === task.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          dir="rtl"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && handleRename(task.id)}
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(task.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRenamingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.created_at)} · {submissionCounts[task.id] || 0} הגשות
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {renamingId !== task.id && (
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(`/task/${task.id}`, "_blank")}>
                        <Eye className="h-3.5 w-3.5" />
                        תצוגה מקדימה
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleShare(task.id)}>
                        <Share2 className="h-3.5 w-3.5" />
                        שיתוף
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/task/${task.id}/dashboard`)}>
                        <BarChart3 className="h-3.5 w-3.5" />
                        דשבורד
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/admin/edit/${task.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                        עריכה
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setRenamingId(task.id);
                          setRenameValue(task.title);
                        }}
                      >
                        שינוי שם
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>מחיקת משימה</AlertDialogTitle>
                            <AlertDialogDescription>
                              האם למחוק את המשימה "{task.title}"? כל ההגשות המשויכות יימחקו גם כן. פעולה זו לא ניתנת לביטול.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex gap-2 sm:justify-start">
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              מחיקה
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
