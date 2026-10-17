import { Navigate, Route, Router, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";
import Top from "./pages/Top";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StationView from "./shell/StationView";
import { session } from "./auth/session";

// ログイン後はどのパスも Station の画面。未ログインならトップ以外はログイン画面へ
function StationRoute() {
  const location = useLocation();
  return <Show when={session()} fallback={
    <Show when={location.pathname === "/" || location.pathname === "/ebina-station/" || location.pathname === "/ebina-station"} fallback={<Navigate href="/login" />}>
      <PublicLayout><Top /></PublicLayout>
    </Show>
  }><AppLayout><StationView /></AppLayout></Show>;
}

export default function App() {
  return (
    <Router base="/ebina-station">
      <Route component={PublicLayout}>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
      </Route>
      <Route path="/" component={StationRoute} />
      <Route path="*" component={StationRoute} />
    </Router>
  );
}
