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
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
        vscode.Uri.joinPath(this.context.extensionUri, "out"),
        vscode.Uri.joinPath(this.context.extensionUri, "src", "webview"),
      ],
    };

    // Create or show the editor panel
    EditorPanel.createOrShow(this.context.extensionUri, document.uri);

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "updateDocument":
          await this.saveDocument(document, message.content);
          break;
        case "save":
          console.log("EditorProvider, case save: ");
          await this.saveDocument(
            document,
            JSON.stringify(JSON.parse(message.content), null, 2)
          );
          break;
      }
    });

    // Handle document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === document.uri.toString()) {
          this.updateWebview(webviewPanel.webview, document);
        }
      }
    );

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    this.updateWebview(webviewPanel.webview, document);
  }
  private async saveDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content
    );
    await vscode.workspace.applyEdit(edit);
  }

  // private updateWebview(
  //   webview: vscode.Webview,
  //   document: vscode.TextDocument
  // ) {
  //   webview.postMessage({
  //     type: "documentSync",
  //     content: document.getText(),
  //   });
  // }

  private updateWebview(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ) {
    try {
      const parsedDocument = JsonParser.parseDocument(document.getText());
      webview.postMessage({
        type: "update",
        document: parsedDocument,
      });
    } catch (error) {
      console.error("Failed to parse document in updateWebview:", error);
      vscode.window.showErrorMessage("Failed to load document");
    }
  }
}
