import * as vscode from "vscode";
import { CompiledFolderView } from "./sidebar/CompiledFolderView";
import { EditorProvider } from "./EditorProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new EditorProvider(context);

  // Register our custom editor provider
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider("akiradocs.editor", provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
      supportsMultipleEditorsPerDocument: false,
    })
  );

  const compiledFolderView = new CompiledFolderView(
    vscode.workspace.workspaceFolders?.[0].uri.fsPath
  );

  vscode.window.registerTreeDataProvider("compiledFiles", compiledFolderView);

  let openEditor = vscode.commands.registerCommand(
    "akiradocs.openEditor",
    async (resource?: vscode.Uri) => {
      try {
        if (!resource) {
          const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
              "Akira Documents": [".json"],
            },
          });

          if (!uris || uris.length === 0) {
            return;
          }
          resource = uris[0];
        }

        // Open the document with our custom editor
        await vscode.commands.executeCommand(
          "vscode.openWith",
          resource,
          "akiradocs.editor"
        );
      } catch (error) {
        console.error("Error opening editor:", error);
        vscode.window.showErrorMessage(
          `Failed to open editor: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  );

  context.subscriptions.push(openEditor);
  console.log("Akira Docs extension activated");
}

export function deactivate() {}
