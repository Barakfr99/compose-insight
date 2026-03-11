import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TaskPage from "./TaskPage";
import DisciplineTask from "./DisciplineTask";
import MergeWritingTask from "./MergeWritingTask";
import GrammarRootsTask from "./GrammarRootsTask";

const customRouteMap: Record<string, React.ComponentType<{ taskId: string; taskTitle: string }>> = {
  discipline: DisciplineTask,
  "merge-writing": MergeWritingTask,
  "grammar-roots": GrammarRootsTask,
};

const TaskRouter = () => {
  const { taskId } = useParams<{ taskId: string }>();

  const { data: task, isLoading, error } = useQuery({
    queryKey: ["task-route", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, task_page_type, route")
        .eq("id", taskId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">טוען משימה...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive font-medium">המשימה לא נמצאה</p>
      </div>
    );
  }

  if (task.task_page_type === "custom" && task.route && customRouteMap[task.route]) {
    const CustomComponent = customRouteMap[task.route];
    return <CustomComponent taskId={task.id} taskTitle={task.title} />;
  }

  return <TaskPage />;
};

export default TaskRouter;
