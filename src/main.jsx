import React from "react";
import ReactDOM from "react-dom/client";
import DataPath from "./DataPath.jsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";

// Native-only: match the status bar to the dark theme.
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar")
    .then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#070b14" }).catch(() => {});
    })
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataPath />
  </React.StrictMode>
);
