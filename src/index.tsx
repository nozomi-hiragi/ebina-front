import { render } from "solid-js/web";
import "./index.css";
import "./shell/theme";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

render(() => <App />, root);
