import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ArticlesPanel from "@/components/ArticlesPanel";

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

interface DisciplineTaskProps {
  taskId: string;
}

const DisciplineTask = ({ taskId }: DisciplineTaskProps) => {
  const [answerText, setAnswerText] = useState("");
  const [pasteCount, setPasteCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef(Date.now());

  const wordCount = countWords(answerText);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const pastedWordCount = countWords(pastedText);
    setPasteCount(prev => prev + 1);
    if (pastedWordCount > 20) {
      e.preventDefault();
      toast({
        title: "⚠️ לא ניתן להדביק טקסט שנכתב על ידי בינה מלאכותית",
        variant: "destructive",
      });
    }
  }, []);

  const handleSubmit = async () => {
    if (!studentName.trim()) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const { error } = await supabase.from("submissions").insert({
      student_name: studentName.trim(),
      answer_text: answerText,
      word_count: wordCount,
      time_spent_seconds: timeSpent,
      paste_count: pasteCount,
      task_id: taskId,
    });

    setIsSubmitting(false);
    setShowNameModal(false);

    if (error) {
      toast({ title: "שגיאה בהגשה, נסו שוב", variant: "destructive" });
      return;
    }

    setIsSubmitted(true);
    toast({ title: "התשובה הוגשה בהצלחה ✅" });
  };

  const wordCountColor =
    wordCount >= 100 && wordCount <= 200
      ? "text-green-600"
      : wordCount > 200
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <div className="min-h-screen flex flex-col pb-safe">
      <div className="p-4 border-b border-border bg-primary/5 text-center">
        <Button
          size="lg"
          className="gap-2 text-base px-8 py-3 h-auto"
          onClick={() => window.open("/task-instructions", "_blank")}
        >
          <FileText className="h-5 w-5" />
          📝 הנחיות למשימת הכתיבה
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="lg:w-[60%] lg:border-l border-border lg:h-screen lg:overflow-y-auto">
          <ArticlesPanel />
        </div>

        <div className="lg:w-[40%] p-6 flex flex-col gap-4 text-right lg:h-screen lg:overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground">כתיבת התשובה</h2>

          <Textarea
            dir="rtl"
            className="flex-1 min-h-[300px] lg:min-h-[500px] text-base leading-relaxed resize-none font-normal"
            placeholder="כתבו את התשובה שלכם כאן..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onPaste={handlePaste}
            disabled={isSubmitted}
          />

          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${wordCountColor}`}>
              {wordCount} מילים {wordCount >= 100 && wordCount <= 200 && "✓"}
            </span>
            <Button
              onClick={() => setShowNameModal(true)}
              disabled={isSubmitted || wordCount === 0}
              className="px-8"
            >
              {isSubmitted ? "הוגש ✅" : "הגשה"}
            </Button>
          </div>

          {isSubmitted && (
            <p className="text-sm text-green-600 font-medium text-center">
              התשובה הוגשה בהצלחה. לא ניתן לערוך או להגיש שוב.
            </p>
          )}
        </div>
      </div>

      <Dialog open={showNameModal} onOpenChange={setShowNameModal}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הזינו את שמכם המלא</DialogTitle>
          </DialogHeader>
          <Input
            dir="rtl"
            placeholder="שם מלא"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <DialogFooter className="flex gap-2 sm:justify-start">
            <Button onClick={handleSubmit} disabled={!studentName.trim() || isSubmitting}>
              {isSubmitting ? "שולח..." : "אישור והגשה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisciplineTask;
