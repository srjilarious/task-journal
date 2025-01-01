// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class TaskLineResult {
    valid: boolean = false;
    patternStart: string = "";
    patternEnd: string = "";
    taskStates: string[] = [];
    taskText: string = "";
    currentState: number = 0;
}

// Gets the config values needed, determines if the line is a task line, and info like the current state.
function processLine(context: vscode.ExtensionContext, line: string): TaskLineResult {
    const config = vscode.workspace.getConfiguration('code-wiki');
    const configuredPattern = config.get<string>('task_pattern');
    const patternParts = configuredPattern?.split("$") ?? "- [$]";
    const patternStart = patternParts[0];
    const patternEnd = patternParts[1];

    const taskStates = config.get<string[]>('progress_states', [" ", "/", "*"]);
    if (line.startsWith(patternStart)) {
        
        const afterStart = line.substring(patternStart.length);
        const taskTextStart = afterStart.indexOf(patternEnd);

        // If we don't see our end pattern, bail.
        if(taskTextStart < 0) {
            return {
                valid: false,
                patternStart: patternStart,
                patternEnd: patternEnd,
                taskStates: taskStates,
                taskText: "",
                currentState: -1,
            };
        }

        const restText = afterStart.substring(taskTextStart+patternEnd.length);
        const currentState = taskStates.findIndex(state => afterStart.startsWith(state));
        return {
            valid: true,
            patternStart: patternStart,
            patternEnd: patternEnd,
            taskStates: taskStates,
            taskText: restText,
            currentState: currentState,
        };
    }

    return {
        valid: false,
        patternStart: patternStart,
        patternEnd: patternEnd,
        taskStates: taskStates,
        taskText: "",
        currentState: -1,
    };
}

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
    
    //let taskStates = ['- [ ]', '- [.]', '- [/]', '- [x]'];

    const decreaseTaskCommand = vscode.commands.registerCommand('code-wiki.decrease_task', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        const currentText = line.text.trim();
        const res = processLine(context, currentText);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            let nextState = res.currentState - 1;
            if(nextState < 0) {
                nextState = res.taskStates.length - 1;
            }
            
            newText = `${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.patternStart}${res.taskStates[0]}${res.patternEnd}${currentText}`;
        }

        editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(decreaseTaskCommand);

    const increaseTaskCommand = vscode.commands.registerCommand('code-wiki.increase_task', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        const currentText = line.text.trim();
        const res = processLine(context, currentText);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            const nextState = (res.currentState + 1) % res.taskStates.length;
            newText = `${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.patternStart}${res.taskStates[0]}${res.patternEnd}${currentText}`;
        }

        editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(increaseTaskCommand);

    const toggleTaskCommand = vscode.commands.registerCommand('code-wiki.toggle_task', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        const currentText = line.text.trim();
        const res = processLine(context, currentText);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            let nextState = res.taskStates.length-1;
            // If already complete, toggle it back to the starting state.
            if(res.currentState === res.taskStates.length-1) {
                nextState = 0;
            }

            newText = `${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.patternStart}${res.taskStates[0]}${res.patternEnd}${currentText}`;
        }

        editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(toggleTaskCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
