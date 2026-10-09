import { Route, Router } from "@solidjs/router";
import AppLayout from "./components/AppLayout";
import Top from "./pages/Top";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Router base="/ebina-station">
      <Route path="/" component={Top} />
      <Route path="/login" component={Login} />
      <Route component={AppLayout}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
      </Route>
      <Route path="*" component={NotFound} />
    </Router>
  );
}
