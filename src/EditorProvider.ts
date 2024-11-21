// import * as vscode from "vscode";

// export class EditorProvider implements vscode.CustomTextEditorProvider {
//   constructor(private readonly context: vscode.ExtensionContext) {}

//   async resolveCustomTextEditor(
//     document: vscode.TextDocument,
//     webviewPanel: vscode.WebviewPanel,
//     _token: vscode.CancellationToken
//   ): Promise<void> {
//     webviewPanel.webview.options = {
//       enableScripts: true,
//     };

//     // Simple HTML for testing
//     webviewPanel.webview.html = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <meta charset="UTF-8">
//                 <style>
//                     body { padding: 20px; }
//                     .content { color: var(--vscode-editor-foreground); }
//                 </style>
//             </head>
//             <body>
//                 <div class="content">
//                     <h1>Hello from Akira Docs!</h1>
//                     <p>File: ${document.uri.fsPath}</p>
//                     <pre>${document.getText()}</pre>
//                 </div>
//                 <script>
//                     const vscode = acquireVsCodeApi();
//                     // We'll add more functionality here later
//                 </script>
//             </body>
//             </html>
//         `;
//   }
// }

// EditorProvider handles:

// Initial document rendering
// Core communication between VSCode and webview
// Document-level operations (save, initial load)

import * as vscode from "vscode";
import { EditorPanel } from "./webview/EditorPanel";

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

  private updateWebview(
    webview: vscode.Webview,
    document: vscode.TextDocument
  ) {
    webview.postMessage({
      type: "documentSync",
      content: document.getText(),
    });
  }
}
