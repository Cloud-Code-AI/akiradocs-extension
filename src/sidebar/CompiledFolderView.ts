import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class CompiledFolderView
  implements vscode.TreeDataProvider<CompiledItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    CompiledItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: CompiledItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CompiledItem): Promise<CompiledItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([]);
    }

    if (element) {
      return this.getCompiledItems(element.resourceUri.fsPath);
    } else {
      const compiledPath = path.join(this.workspaceRoot, "compiled");
      if (fs.existsSync(compiledPath)) {
        return this.getCompiledItems(compiledPath);
      }
      return [];
    }
  }

  private async getCompiledItems(folder: string): Promise<CompiledItem[]> {
    const items = await fs.promises.readdir(folder);
    return items.map((item) => {
      const fullPath = path.join(folder, item);
      const stat = fs.statSync(fullPath);

      return new CompiledItem(
        item,
        vscode.Uri.file(fullPath),
        stat.isDirectory()
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None
      );
    });
  }
}

class CompiledItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    if (label.endsWith(".json")) {
      this.command = {
        command: "akiradocs.openEditor",
        title: "Open Editor",
        arguments: [resourceUri],
      };
    } else {
      // Disable command for non-JSON files and folders
      this.command = undefined;
    }
  }
}
