import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { ArrowRight } from "lucide-react";

const CreateTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(taskId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (taskId) {
      setIsLoading(true);
      supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast({ title: "משימה לא נמצאה", variant: "destructive" });
            navigate("/admin");
          } else {
            setTitle(data.title);
            setContent(data.content);
          }
          setIsLoading(false);
        });
    }
  }, [taskId, navigate]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "יש להזין כותרת למשימה", variant: "destructive" });
      return;
    }
    if (!content.trim()) {
      toast({ title: "יש להזין תוכן למשימה", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    if (isEditing && taskId) {
      const { error } = await supabase
        .from("tasks")
        .update({ title: title.trim(), content })
        .eq("id", taskId);
      setIsSaving(false);
      if (error) {
        toast({ title: "שגיאה בשמירה", variant: "destructive" });
      } else {
        toast({ title: "המשימה עודכנה בהצלחה ✅" });
        navigate("/admin");
      }
    } else {
      const { error } = await supabase
        .from("tasks")
        .insert({ title: title.trim(), content });
      setIsSaving(false);
      if (error) {
        toast({ title: "שגיאה ביצירת המשימה", variant: "destructive" });
      } else {
        toast({ title: "המשימה נוצרה בהצלחה ✅" });
        navigate("/admin");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto text-right">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 text-right">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? "עריכת משימה" : "יצירת משימה חדשה"}
        </h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">כותרת המשימה</label>
          <Input
            dir="rtl"
            placeholder="לדוגמה: משימת כתיבה - משמעת"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">תוכן המשימה (מאמרים והנחיות)</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} disabled={isSaving} className="px-8">
            {isSaving ? "שומר..." : isEditing ? "שמירת שינויים" : "יצירת משימה"}
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            ביטול
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateTask;
