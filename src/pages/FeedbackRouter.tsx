import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lazy, Suspense } from "react";
const SubjectPredicateFeedback = lazy(() => import("./SubjectPredicateFeedback"));
const GrammarRootsFeedback = lazy(() => import("./GrammarRootsFeedback"));
const IdiomsMatchFeedback = lazy(() => import("./IdiomsMatchFeedback"));

const FeedbackRouter = () => {
  const { taskId, submissionId } = useParams<{ taskId: string; submissionId: string }>();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-feedback-route", taskId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("route").eq("id", taskId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const loading = <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">טוען...</p></div>;

  if (isLoading) return loading;

  return (
    <Suspense fallback={loading}>
      {task?.route === "grammar-roots" ? <GrammarRootsFeedback /> : <SubjectPredicateFeedback />}
    </Suspense>
  );
};

export default FeedbackRouter;
