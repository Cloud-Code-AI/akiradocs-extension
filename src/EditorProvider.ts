// EditorProvider handles:

// Initial document rendering
// Core communication between VSCode and webview
// Document-level operations (save, initial load)

import * as vscode from "vscode";
import { EditorPanel } from "./webview/EditorPanel";
import { JsonParser } from "./utils/jsonParser";

export class EditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, "media"),
          vscode.Uri.joinPath(this.context.extensionUri, "out"),
          vscode.Uri.joinPath(this.context.extensionUri, "src", "webview"),
        ],
      };

      // Log the document URI for debugging
      console.log("[Extension Host] Document URI:", document.uri.toString());

      // Ensure document content is read safely
      const documentContent = document.getText();
      const parsedDocument = JsonParser.parseDocument(documentContent);

      // Create or show the editor panel
      EditorPanel.createOrShow(this.context.extensionUri, document.uri);
      // this.updateWebview(webviewPanel.webview, document);
      // Send initial document sync
      webviewPanel.webview.postMessage({
        type: "documentSync",
        content: JSON.stringify(parsedDocument),
      });

      webviewPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
          case "updateDocument":
            await this.saveDocument(document, message.content);
            break;
          case "save":
            await this.saveDocument(
              document,
              JSON.stringify(JSON.parse(message.content), null, 2)
            );
            break;
        }
      });

      // Handle document changes
      const changeDocumentSubscription =
        vscode.workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            this.updateWebview(webviewPanel.webview, document);
          }
        });

      webviewPanel.onDidDispose(() => {
        changeDocumentSubscription.dispose();
      });
    } catch (error) {
      console.error(
        "[Extension Host] Error in resolveCustomTextEditor:",
        error
      );
      vscode.window.showErrorMessage(
        `Failed to open document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  private async saveDocument(document: vscode.TextDocument, content: string) {
    try {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        content
      );
      await vscode.workspace.applyEdit(edit);
    } catch (error) {
      console.error("[Extension Host] Save document error:", error);
      vscode.window.showErrorMessage(
        `Failed to save document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private updateWebview(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ) {
    try {
      webview.postMessage({
        type: "documentSync",
        content: document.getText(),
      });
    } catch (error) {
      console.error("[Extension Host] Update webview error:", error);
    }
  }
}
