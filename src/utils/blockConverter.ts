// src/webview/blocks/BlockManager.ts
import { Block } from "./jsonParser";
export class BlockManager {
  private blocks: Block[] = [];

  addBlock(type: string, content: string) {
    // Add block implementation
  }

  removeBlock(id: string) {
    // Remove block implementation
  }

  moveBlock(id: string, direction: "up" | "down") {
    // Move block implementation
  }

  toJSON() {
    // Convert blocks to JSON
  }

  fromJSON(json: any) {
    // Convert JSON to blocks
  }
}
export class BlockConverter {
  static blockToHtml(block: Block): string {
    switch (block.type) {
      case "heading":
        const level = block.metadata?.level || 1;
        return `<h${level} class="block-heading" data-block-id="${block.id}">${block.content}</h${level}>`;

      case "text":
        return `<p class="block-text" data-block-id="${block.id}">${block.content}</p>`;

      case "list":
        return `<ul class="block-list" data-block-id="${block.id}">
                    ${block.content
                      .split("\n")
                      .map((item) => `<li>${item}</li>`)
                      .join("")}
                </ul>`;

      default:
        return `<div class="block-unknown">${block.content}</div>`;
    }
  }
}
