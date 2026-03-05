import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Clock, FileText } from "lucide-react";

type Submission = {
  id: string;
  student_name: string;
  answer_text: string;
  word_count: number;
  time_spent_seconds: number;
  paste_count: number;
  submitted_at: string;
};

type SortMode = "time" | "name";

const Dashboard = () => {
  const [sortMode, setSortMode] = useState<SortMode>("time");

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
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

  const formatMinutes = (seconds: number) => {
    const m = Math.round(seconds / 60);
    return `${m} דקות`;
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">דשבורד מורה – משימת כתיבה: משמעת</h1>

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
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4 border-t border-border mt-2">
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{s.answer_text}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default Dashboard;
