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
    };

    // Create or show the editor panel
    EditorPanel.createOrShow(this.context.extensionUri, document.uri);

    // webviewPanel.webview.html = this.getHtmlForWebview(
    //   webviewPanel.webview,
    //   document
    // );

    // Handle messages from webview
    // webviewPanel.webview.onDidReceiveMessage(async (message) => {
    //   switch (message.type) {
    //     case "update":
    //       this.updateTextDocument(document, message.content);
    //       break;
    //   }
    // });

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "documentSave":
          await this.saveDocument(document, message.content);
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
//   private getHtmlForWebview(
//     webview: vscode.Webview,
//     document: vscode.TextDocument
//   ): string {
//     try {
//       const documentData = JSON.parse(document.getText());

//       return `
//                 <!DOCTYPE html>
//                 <html>
//                 <head>
//                     <meta charset="UTF-8">
//                     <style>
//                         body {
//                             padding: 20px;
//                             color: var(--vscode-editor-foreground);
//                             background: var(--vscode-editor-background);
//                         }
//                         .editor-container {
//                             display: flex;
//                             flex-direction: column;
//                             gap: 1rem;
//                         }
//                         .title-input {
//                             font-size: 24px;
//                             background: var(--vscode-input-background);
//                             color: var(--vscode-input-foreground);
//                             border: 1px solid var(--vscode-input-border);
//                             padding: 8px;
//                             width: 100%;
//                         }
//                         .block {
//                             padding: 8px;
//                             margin: 4px 0;
//                             background: var(--vscode-input-background);
//                             border: 1px solid var(--vscode-input-border);
//                         }
//                         button {
//                             background: var(--vscode-button-background);
//                             color: var(--vscode-button-foreground);
//                             border: none;
//                             padding: 4px 8px;
//                             cursor: pointer;
//                         }
//                         .toolbar {
//                             margin-bottom: 1rem;
//                         }
//                     </style>
//                 </head>
//                 <body>
//                     <div class="editor-container">
//                         <div class="toolbar">
//                             <button onclick="addBlock()">Add Block</button>
//                             <button onclick="saveDocument()">Save</button>
//                         </div>

//                         <input
//                             class="title-input"
//                             type="text"
//                             value="${documentData.title || ""}"
//                             placeholder="Document Title"
//                             onchange="updateTitle(this.value)"
//                         />

//                         <div id="blocks-container">
//                             ${this.renderBlocks(documentData.blocks || [])}
//                         </div>
//                     </div>

//                     <script>
//                         const vscode = acquireVsCodeApi();
//                         let documentData = ${JSON.stringify(documentData)};

//                         function updateDocument() {
//                             vscode.postMessage({
//                                 type: 'update',
//                                 content: JSON.stringify(documentData, null, 2)
//                             });
//                         }

//                         function updateTitle(value) {
//                             documentData.title = value;
//                             updateDocument();
//                         }

//                         function updateBlockContent(id, content) {
//                             const block = documentData.blocks.find(b => b.id === id);
//                             if (block) {
//                                 block.content = content;
//                                 updateDocument();
//                             }
//                         }

//                         function addBlock() {
//                             documentData.blocks = documentData.blocks || [];
//                             documentData.blocks.push({
//                                 id: Date.now().toString(),
//                                 type: 'text',
//                                 content: ''
//                             });
//                             updateDocument();
//                         }

//                         function saveDocument() {
//                             const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
//                             const dataToSave = JSON.stringify(documentData, null, 2);
//                             vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(dataToSave))
//                                 .then(() => {
//                                     vscode.window.showInformationMessage('Document saved successfully!');
//                                 })
//                                 .catch(err => {
//                                     vscode.window.showErrorMessage('Failed to save document: ' + err.message);
//                                 });
//                         }

//                         function deleteBlock(id) {
//                             documentData.blocks = documentData.blocks.filter(b => b.id !== id);
//                             updateDocument();
//                         }
//                     </script>
//                 </body>
//                 </html>
//             `;
//     } catch (error) {
//       return `<body>Error parsing document: ${error}</body>`;
//     }
//   }

//   private renderBlocks(blocks: any[]): string {
//     return blocks
//       .map(
//         (block) => `
//             <div class="block" data-block-id="${block.id}">
//                 <textarea
//                     onchange="updateBlockContent('${block.id}', this.value)"
//                     style="width: 100%; min-height: 100px;"
//                 >${block.content || ""}</textarea>
//                 <button onclick="deleteBlock('${block.id}')">Delete</button>
//             </div>
//         `
//       )
//       .join("");
//   }

//   private updateWebview(
//     webview: vscode.Webview,
//     document: vscode.TextDocument
//   ) {
//     webview.postMessage({
//       type: "reload",
//       content: document.getText(),
//     });
//   }

//   private updateTextDocument(document: vscode.TextDocument, content: string) {
//     const edit = new vscode.WorkspaceEdit();
//     edit.replace(
//       document.uri,
//       new vscode.Range(0, 0, document.lineCount, 0),
//       content
//     );
//     vscode.workspace.applyEdit(edit);
//   }
// }
