import { TRPCReactProvider } from "@/utils/react";
import Options from "@pages/options/Options";
import { createRoot } from "react-dom/client";

import "@acme/ui/styles.css";

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Options root element");
  const root = createRoot(rootContainer);
  root.render(
    <TRPCReactProvider>
      <Options />
    </TRPCReactProvider>,
  );
}

init();
