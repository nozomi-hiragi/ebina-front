import { Route, Router } from "@solidjs/router";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";
import Top from "./pages/Top";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Router base="/ebina-station">
      <Route component={PublicLayout}>
        <Route path="/" component={Top} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Route>
      <Route component={AppLayout}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
      </Route>
      <Route path="*" component={NotFound} />
    </Router>
  );
}
