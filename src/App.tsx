import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CreateTask from "./pages/CreateTask";
import TaskRouter from "./pages/TaskRouter";
import TaskDashboard from "./pages/TaskDashboard";
import TaskInstructions from "./pages/TaskInstructions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/admin/create" element={<CreateTask />} />
          <Route path="/admin/edit/:taskId" element={<CreateTask />} />
          <Route path="/task/:taskId" element={<TaskRouter />} />
          <Route path="/task/:taskId/dashboard" element={<TaskDashboard />} />
          <Route path="/task-instructions" element={<TaskInstructions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
