// src/utils/jsonParser.ts

export interface Block {
  id: string;
  type: "text" | "heading" | "list"; // Supported block types
  content: string;
  metadata?: {
    level?: number;
  };
}

export interface Document {
  title: string;
  description: string;
  blocks: Block[];
}

export class JsonParser {
  static parseDocument(jsonString: string): Document {
    try {
      console.log("try block of Json parser");
      const doc = JSON.parse(jsonString);
      return {
        title: doc.title || "Untitled",
        description: doc.description || "",
        blocks: Array.isArray(doc.blocks) ? doc.blocks : [],
      };
    } catch (error) {
      console.error("Failed to parse document:", error);
      return {
        title: "Error Document",
        description: "",
        blocks: [],
      };
    }
  }

  static stringify(document: Document): string {
    return JSON.stringify(document, null, 2);
  }
}
