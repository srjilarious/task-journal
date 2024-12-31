// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "code-wiki" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const disposable = vscode.commands.registerCommand('code-wiki.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hallo Welt from code-wiki!');
    });

    context.subscriptions.push(disposable);

    const newEntryCommand = vscode.commands.registerCommand('code-wiki.new_entry', async () => {
        // Get the configured directory or default to ~/.code-wiki
        const config = vscode.workspace.getConfiguration('code-wiki');
        const configuredDirectory = config.get<string>('data_directory');
        const defaultDirectory = path.join(os.homedir(), '.code-wiki');
        const dataDirectory = configuredDirectory || defaultDirectory;

        // Ensure the directory exists
        if (!fs.existsSync(dataDirectory)) {
            fs.mkdirSync(dataDirectory, { recursive: true });
        }

        // Generate the file name based on the current date
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const fileName = `${date}.md`;
        const filePath = path.join(dataDirectory, fileName);

        // Create the file if it doesn't exist and open it in the editor
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, `# [${date}] Entry\n\n`, { encoding: 'utf8' });
        }

        const doc = await vscode.workspace.openTextDocument(filePath);
        vscode.window.showTextDocument(doc);
    });

    context.subscriptions.push(newEntryCommand);
    
    let taskStates = ['- [ ]', '- [.]', '- [/]', '- [x]'];

    const toggleTaskCommand = vscode.commands.registerCommand('code-wiki.toggle_task', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const line = editor.document.lineAt(editor.selection.active.line);
        const currentText = line.text.trim();
        let newText = '';

        if (currentText.startsWith('- [')) {
            const currentState = taskStates.findIndex(state => currentText.startsWith(state));
            const nextState = (currentState + 1) % taskStates.length;
            newText = currentText.replace(taskStates[currentState], taskStates[nextState]);
        } else {
            newText = `- [ ] ${currentText}`;
        }

        editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(toggleTaskCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
