import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMergeSettings = () => {
  return useQuery({
    queryKey: ["merge-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("app_settings" as any)
        .select("key, value") as any);
      if (error) throw error;
      const settings: Record<string, string> = {};
      (data as { key: string; value: string }[])?.forEach((row) => {
        settings[row.key] = row.value;
      });
      return {
        title: settings["merge_task_title"] || "משימת כתיבה ממזגת",
        desc: settings["merge_task_desc"] || "משימה קבועה עם 5 תרגילים",
      };
    },
  });
};

export const updateMergeSetting = async (key: string, value: string) => {
  const { error } = await (supabase
    .from("app_settings" as any) as any)
    .update({ value })
    .eq("key", key);
  return { error };
};
