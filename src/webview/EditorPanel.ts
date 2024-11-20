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
  public static currentPanel: EditorPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _document!: Document;
  private _documentUri: vscode.Uri;
  private _extensionUri: vscode.Uri;

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
      this._document = JsonParser.parseDocument(content.toString());
      this._updateWebview();
    });

    // Set up message handling
    // this._panel.webview.onDidReceiveMessage(
    //   async (message) => {
    //     switch (message.type) {
    //       case "save":
    //         await this._saveDocument();
    //         break;
    //       case "addBlock":
    //         this._addBlock(message.blockType);
    //         break;
    //       case "updateBlock":
    //         this._updateBlock(message.id, message.content);
    //         break;
    //       case "deleteBlock":
    //         this._deleteBlock(message.id);
    //         break;
    //       case "moveBlock":
    //         this._moveBlock(message.id, message.direction);
    //         break;
    //     }
    //   },
    //   null,
    //   this._disposables
    // );
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
      const updatedDocument = JSON.parse(content);
      this._document = updatedDocument;
      this._updateWebview();
    } catch (error) {
      vscode.window.showErrorMessage("Failed to update document");
    }
  }

  private _updateWebview() {
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

  public static createOrShow(
    extensionUri: vscode.Uri,
    documentUri: vscode.Uri
  ) {
    console.log("Document URI:", documentUri.toString());
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (EditorPanel.currentPanel) {
      EditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "akiraEditor",
      "AkiraDocs Editor",
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

    EditorPanel.currentPanel = new EditorPanel(
      panel,
      extensionUri,
      documentUri
    );
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

    try {
      const htmlContent = fs.readFileSync(htmlPath.fsPath, "utf8");
      return htmlContent;
    } catch (error) {
      console.error("Failed to read HTML template:", error);
      return `<html><body>Error loading editor</body></html>`;
    }
  }

  public dispose() {
    EditorPanel.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
