import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}