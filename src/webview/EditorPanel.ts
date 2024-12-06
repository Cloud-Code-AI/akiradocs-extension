//src/webview/EditorPanel.ts
// EditorPanel handle:

// Specific UI interactions
// Block-level manipulations
// Detailed document editing

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Document, JsonParser } from "../utils/jsonParser";

export class EditorPanel {
  // public static currentPanel: EditorPanel | undefined;
  // private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _document!: Document;
  private _documentUri: vscode.Uri;
  private _extensionUri: vscode.Uri;
  private static panels: Map<string, EditorPanel> = new Map(); // Store panels by document URI
  private readonly _panel: vscode.WebviewPanel;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    documentUri: vscode.Uri
  ) {
    this._panel = panel;
    this._documentUri = documentUri;
    this._extensionUri = extensionUri;

    // Set up webview content
    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri
    );

    // Load initial document
    vscode.workspace.fs.readFile(documentUri).then((content) => {
      console.log("Initial document content:", content.toString());
      this._document = JsonParser.parseDocument(content.toString());
      this._updateWebview();
    });

    // Set up message handling
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "documentSync":
            this._document =
              message.document || JsonParser.parseDocument(message.content);
            this._updateWebview();
            break;
          case "save":
            await this._saveDocument();
            break;
          case "addBlock":
            this._addBlock(message.blockType);
            break;
          case "updateBlock":
            this._updateBlock(message.id, message.content);
            break;
          case "deleteBlock":
            this._deleteBlock(message.id);
            break;
          case "moveBlock":
            this._moveBlock(message.id, message.direction);
            break;
        }
      },
      null,
      this._disposables
    );
    // TODO: Evaluate the necessity of this code block.
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "updateDocument":
            this._updateDocument(message.content);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private _updateDocument(content: string) {
    try {
      console.log("Received content:", content);
      const updatedDocument = JsonParser.parseDocument(content);
      console.log("Parsed document:", updatedDocument);
      this._document = updatedDocument;
      this._updateWebview();
    } catch (error) {
      console.error("Failed to update document:", error);
      vscode.window.showErrorMessage("Failed to update document");
    }
  }

  private _updateWebview() {
    console.log("Updating webview with document:", this._document);
    this._panel.webview.postMessage({
      type: "update",
      document: this._document,
    });
  }

  private async _saveDocument() {
    const content = JsonParser.stringify(this._document);
    await vscode.workspace.fs.writeFile(
      this._documentUri,
      Buffer.from(content, "utf8")
    );
    vscode.window.showInformationMessage("Document saved");
  }

  private _addBlock(type: string) {
    this._document.blocks.push({
      id: Date.now().toString(),
      type: type as any,
      content: "",
    });
    this._updateWebview();
  }

  private _updateBlock(id: string, content: string) {
    const block = this._document.blocks.find((b) => b.id === id);
    if (block) {
      block.content = content;
      this._updateWebview();
    } else {
      vscode.window.showWarningMessage(`Block with id ${id} not found.`);
    }
  }

  private _deleteBlock(id: string) {
    const index = this._document.blocks.findIndex((b) => b.id === id);
    if (index !== -1) {
      this._document.blocks.splice(index, 1);
      this._updateWebview();
    } else {
      vscode.window.showWarningMessage(`Block with id ${id} not found.`);
    }
  }

  private _moveBlock(id: string, direction: "up" | "down") {
    const index = this._document.blocks.findIndex((b) => b.id === id);

    if (index !== -1) {
      if (direction === "up" && index > 0) {
        [this._document.blocks[index], this._document.blocks[index - 1]] = [
          this._document.blocks[index - 1],
          this._document.blocks[index],
        ];
        this._updateWebview();
      } else if (
        direction === "down" &&
        index < this._document.blocks.length - 1
      ) {
        [this._document.blocks[index], this._document.blocks[index + 1]] = [
          this._document.blocks[index + 1],
          this._document.blocks[index],
        ];
        this._updateWebview();
      } else {
        vscode.window.showWarningMessage(
          `Cannot move block ${id} ${direction}.`
        );
      }
    } else {
      vscode.window.showWarningMessage(`Block with id ${id} not found.`);
    }
  }

  // public static createOrShow(
  //   extensionUri: vscode.Uri,
  //   documentUri: vscode.Uri
  // ) {
  //   console.log("Document URI:", documentUri.toString());
  //   const column = vscode.window.activeTextEditor
  //     ? vscode.window.activeTextEditor.viewColumn
  //     : undefined;

  //   if (EditorPanel.currentPanel) {
  //     EditorPanel.currentPanel._panel.reveal(column);
  //     return;
  //   }

  //   const panel = vscode.window.createWebviewPanel(
  //     "akiraEditor",
  //     "AkiraDocs Editor",
  //     column || vscode.ViewColumn.One,
  //     {
  //       enableScripts: true,
  //       localResourceRoots: [
  //         vscode.Uri.joinPath(extensionUri, "media"),
  //         vscode.Uri.joinPath(extensionUri, "out"),
  //         vscode.Uri.joinPath(extensionUri, "src", "webview"),
  //       ],
  //     }
  //   );
  //   const iconPathLight = vscode.Uri.file(
  //     path.join(extensionUri.fsPath, "media", "akira_icon.png")
  //   );
  //   const iconPathDark = vscode.Uri.file(
  //     path.join(extensionUri.fsPath, "media", "akira_icon.png")
  //   );

  //   panel.iconPath = { light: iconPathLight, dark: iconPathDark };
  //   EditorPanel.currentPanel = new EditorPanel(
  //     panel,
  //     extensionUri,
  //     documentUri
  //   );

  //   vscode.workspace.fs.readFile(documentUri).then((content) => {
  //     try {
  //       const parsedDocument = JsonParser.parseDocument(content.toString());
  //       EditorPanel.currentPanel?._panel.webview.postMessage({
  //         type: "documentSync",
  //         document: parsedDocument,
  //       });
  //     } catch (error) {
  //       vscode.window.showErrorMessage("Failed to parse document");
  //     }
  //   });
  // }
  public static createOrShow(
    extensionUri: vscode.Uri,
    documentUri: vscode.Uri
  ) {
    console.log("Document URI:", documentUri.toString());
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    const existingPanel = EditorPanel.panels.get(documentUri.toString());
    if (existingPanel) {
      existingPanel._panel.reveal(column); // Reveal existing panel
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "akiraEditor",
      `${path.parse(documentUri.fsPath).name}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
          vscode.Uri.joinPath(extensionUri, "src", "webview"),
        ],
      }
    );

    const iconPathLight = vscode.Uri.file(
      path.join(extensionUri.fsPath, "media", "akira_icon.png")
    );
    const iconPathDark = vscode.Uri.file(
      path.join(extensionUri.fsPath, "media", "akira_icon.png")
    );

    panel.iconPath = { light: iconPathLight, dark: iconPathDark };

    // Create a new instance of EditorPanel and store it in the map
    const newPanel = new EditorPanel(panel, extensionUri, documentUri);
    EditorPanel.panels.set(documentUri.toString(), newPanel);

    // Read the document content and send it to the webview
    vscode.workspace.fs.readFile(documentUri).then((content) => {
      try {
        const parsedDocument = JsonParser.parseDocument(content.toString());
        newPanel._panel.webview.postMessage({
          type: "documentSync",
          document: parsedDocument,
        });
      } catch (error) {
        vscode.window.showErrorMessage("Failed to parse document");
      }
    });
  }

  private _getWebviewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    const htmlPath = vscode.Uri.joinPath(
      extensionUri,
      "src",
      "webview",
      "template.html"
    );
    console.log(htmlPath);

    try {
      const htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");
      return htmlContent;
    } catch (error) {
      console.error("Failed to read HTML template:", error);
      return `<html><body>Error loading editor</body></html>`;
    }
  }

  // public dispose() {
  //   EditorPanel.currentPanel = undefined;
  //   this._panel.dispose();

  //   while (this._disposables.length) {
  //     const disposable = this._disposables.pop();
  //     if (disposable) {
  //       disposable.dispose();
  //     }
  //   }
  // }
}
