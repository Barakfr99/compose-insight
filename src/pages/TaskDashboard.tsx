import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MergeWritingDashboard from "./MergeWritingDashboard";
import GrammarRootsDashboard from "./GrammarRootsDashboard";
import SubjectPredicateDashboard from "./SubjectPredicateDashboard";
import IdiomsMatchDashboard from "./IdiomsMatchDashboard";
import HalachmimDashboard from "./HalachmimDashboard";
import GenericTaskDashboard from "@/components/GenericTaskDashboard";

const TaskDashboard = () => {
  const { taskId } = useParams<{ taskId: string }>();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">טוען...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive font-medium">המשימה לא נמצאה</p>
      </div>
    );
  }

  if ((task as any).route === "merge-writing") {
    return <MergeWritingDashboard taskId={taskId!} taskTitle={task.title} />;
  }

  if ((task as any).route === "grammar-roots") {
    return <GrammarRootsDashboard taskId={taskId!} taskTitle={task.title} />;
  }

  if ((task as any).route === "subject-predicate") {
    return <SubjectPredicateDashboard taskId={taskId!} taskTitle={task.title} />;
  }

  if ((task as any).route === "idioms-match") {
    return <IdiomsMatchDashboard taskId={taskId!} taskTitle={task.title} />;
  }

  return <GenericTaskDashboard taskId={taskId!} taskTitle={task.title} />;
};

export default TaskDashboard;
