import React, { useState } from "react";
import { ArticleHeaders } from "./components/blocks/ArticleHeaders";
import { SortableBlock } from "./components/blocks/SortableBlock";
import { Button } from "./components/ui/button";
import { BlockType } from "../types/Block";

type Block = {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, any>;
};

export function ArticleEditorWebview() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [activeChangeTypeId, setActiveChangeTypeId] = useState<string | null>(
    null
  );

  // Implement similar methods from the original component

  const addBlock = (afterId: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: "paragraph",
      content: "",
      metadata: {},
    };

    if (newBlock.type === "list") {
      newBlock.content = "[]";
    }

    if (afterId === "new") {
      setBlocks([newBlock]);
    } else {
      const index = blocks.findIndex((block) => block.id === afterId);
      setBlocks([
        ...blocks.slice(0, index + 1),
        newBlock,
        ...blocks.slice(index + 1),
      ]);
    }
    setActiveChangeTypeId(newBlock.id);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(
      blocks.map((block) => {
        if (block.id === id) {
          if (block.type === "list") {
            try {
              const parsed = JSON.parse(content);
              return {
                ...block,
                content: JSON.stringify(
                  Array.isArray(parsed) ? parsed : [parsed]
                ),
              };
            } catch {
              return { ...block, content: JSON.stringify([content]) };
            }
          }
          return { ...block, content };
        }
        return block;
      })
    );
  };

  const changeBlockType = (id: string, newType: BlockType) => {
    setBlocks(
      blocks.map((block) =>
        block.id === id ? { ...block, type: newType } : block
      )
    );
    setActiveChangeTypeId(null);
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((block) => block.id !== id));
  };

  return (
    <div>
      <ArticleHeaders
        title={title}
        setTitle={setTitle}
        subtitle={subtitle}
        setSubtitle={setSubtitle}
        showPreview={showPreview}
      />
      {/* Rest of the editor implementation */}
    </div>
  );
}
