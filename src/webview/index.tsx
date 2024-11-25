import React from "react";
import { createRoot } from "react-dom/client";
import { ArticleHeaders } from "./components/blocks/ArticleHeaders";

function WebviewApp() {
  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <div>
      <ArticleHeaders
        title={title}
        setTitle={setTitle}
        subtitle={subtitle}
        setSubtitle={setSubtitle}
        showPreview={showPreview}
      />
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<WebviewApp />);
