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
    indentation: string = "";
}

class TagResult {
    taskStateText: string = "";
    taskText: string = "";
    tagStart: string = "";
    tagEnd: string = "";
    indentation: string = "";
}

function getIndentation(input: string) {
    const match = input.match(/^\s+/);
    const ws = match ? match[0] : "";
    const rest = input.substring(ws.length);
    return [ws, rest];
}

// Applies a tag to the current task line.
function applyTag(context: vscode.ExtensionContext, line: string, tag: string) {
    const config = vscode.workspace.getConfiguration('task-journal');
    const configuredPattern = config.get<string>('task_pattern') ?? "- [$]"; 
    const patternParts = configuredPattern.split("$");
    const patternStart = patternParts[0];
    const patternEnd = patternParts[1];

    const configuredTagPattern = config.get<string>('tag_pattern') ?? "($)"; 
    const configuredTagSep = config.get<string>('tag_separator') ?? ',';
    const tagParts = configuredTagPattern.split("$");
    const tagStart = tagParts[0];
    const tagEnd = tagParts[1];

    // TODO: Clean up code to just use indices within one string.
    const [ws, rest] = getIndentation(line);
    if (rest.startsWith(patternStart)) {
        
        const afterStart = rest.substring(patternStart.length);
        const taskTextStart = afterStart.indexOf(patternEnd);

        // If we don't see our end pattern, bail.
        if(taskTextStart < 0) {
            return;
        }

        const restText = afterStart.substring(taskTextStart+patternEnd.length);
        
        
        const patternEndIdx = rest.indexOf(patternEnd);

        if(restText.startsWith(tagStart)) {
            console.log("Found a tag section:", rest);
            const actualTaskTextStart = restText.indexOf(tagEnd);
            if(actualTaskTextStart < 0) {
                console.log("Only found beginning of tag section");
                return;
            }

            const actualTaskText = restText.substring(actualTaskTextStart+tagEnd.length);
            const tagText = restText.substring(tagStart.length, actualTaskTextStart);
            const tagList = tagText.split(configuredTagSep).map(tag => tag.trim());;
            if(tagList.includes(tag)) {
                console.log(`tag list already includes ${tag}, removing.`);
                const updatedTagList = tagList.filter(t => t !== tag);
                if(updatedTagList.length > 0) {
                    // Print the line with just the remaining tags.
                    const tagListStr = updatedTagList.join(configuredTagSep);
                    const taggedLine = `${ws}${rest.substring(0, patternEndIdx+patternEnd.length)}${tagStart}${tagListStr}${tagEnd}${actualTaskText}`;
                    return taggedLine;
                }
                else {
                    // Remove the tag list all together if it was the last tag.
                    const taggedLine = `${ws}${rest.substring(0, patternEndIdx+patternEnd.length)}${actualTaskText}`;
                    return taggedLine;
                }
            }
            else {
                tagList.push(tag);
                const tagListStr = tagList.join(configuredTagSep);
                const taggedLine = `${ws}${rest.substring(0, patternEndIdx+patternEnd.length)}${tagStart}${tagListStr}${tagEnd}${actualTaskText}`;
                return taggedLine;
            }
        }
        else {
            const taggedLine = `${ws}${rest.substring(0, patternEndIdx+patternEnd.length)}${tagStart}${tag}${tagEnd}${restText}`;
            return taggedLine;
        }
    }
    else {
        // Create a task line with the tag applied.
        const taggedLine = `${ws}${patternStart} ${patternEnd}${tagStart}${tag}${tagEnd}${rest}`;
        return taggedLine;
    }
}

// Gets the config values needed, determines if the line is a task line, and info like the current state.
function processLine(context: vscode.ExtensionContext, line: string): TaskLineResult {
    const config = vscode.workspace.getConfiguration('task-journal');
    const configuredPattern = config.get<string>('task_pattern'); 
    const patternParts = configuredPattern?.split("$") ?? "- [$]";
    const patternStart = patternParts[0];
    const patternEnd = patternParts[1];

    const taskStates = config.get<string[]>('progress_states', [" ", "/", "*"]);
    const [ws, rest] = getIndentation(line);
    if (rest.startsWith(patternStart)) {
        
        const afterStart = rest.substring(patternStart.length);
        const taskTextStart = afterStart.indexOf(patternEnd);

        // If we don't see our end pattern, bail.
        if(taskTextStart < 0) {
            return {
                valid: false,
                patternStart: patternStart,
                patternEnd: patternEnd,
                taskStates: taskStates,
                taskText: rest,
                currentState: -1,
                indentation: ws,
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
            indentation: ws,
        };
    }

    return {
        valid: false,
        patternStart: patternStart,
        patternEnd: patternEnd,
        taskStates: taskStates,
        taskText: rest,
        currentState: -1,
        indentation: ws,
    };
}

function getDiaryFiles(dataDirectory: string): string[] {
    if (!fs.existsSync(dataDirectory)) {
        return [];
    }

    return fs
        .readdirSync(dataDirectory)
        .filter(file => file.endsWith('.md')) // Only include .md files
        .sort(); // Sort alphabetically (default)
}

async function openFile(editor: vscode.TextEditor, filePath: string) {
    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc);
}

function navigateDiaryEntry(direction: 'next' | 'previous') {
    const config = vscode.workspace.getConfiguration('task-journal');
    const dataDirectory = config.get<string>('data_directory') || path.join(require('os').homedir(), '.task-journal');

    const files = getDiaryFiles(dataDirectory);

    if (files.length === 0) {
        vscode.window.showErrorMessage('No diary entries found.');
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor.');
        return;
    }

    const currentFile = path.normalize(editor.document.fileName);
    if(!path.dirname(currentFile).toLowerCase().includes(dataDirectory.toLowerCase())) {
        vscode.window.showErrorMessage('Current file is not a file in the data directory.');
        return;

    }
    const currentIndex = files.findIndex(file => path.join(dataDirectory, file).toLowerCase() === currentFile.toLowerCase());

    if (currentIndex === -1) {
        vscode.window.showErrorMessage('Current find the current file under the data directory.');
        return;
    }

    let targetIndex = currentIndex;
    if (direction === 'next') {
        targetIndex = (currentIndex + 1) % files.length; // Wrap around to the first file
    } else if (direction === 'previous') {
        targetIndex = (currentIndex - 1 + files.length) % files.length; // Wrap around to the last file
    }

    const targetFile = path.join(dataDirectory, files[targetIndex]);
    openFile(editor, targetFile);
}

function prepDiaryDirectory(): string {
    // Get the configured directory or default to ~/.task-journal
    const config = vscode.workspace.getConfiguration('task-journal');
    const configuredDirectory = config.get<string>('data_directory');
    const defaultDirectory = path.join(os.homedir(), '.task-journal');
    const dataDirectory = configuredDirectory || defaultDirectory;

    // Ensure the directory exists
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    return dataDirectory;
}

function headerContents(date: Date): string {
    const config = vscode.workspace.getConfiguration('task-journal');
    let entryTemplate = config.get<string>('entry_template') || "# $date\n";
    
    const pad = (n: number) => String(n).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are 0-based
    const day = pad(date.getDate());

    entryTemplate = entryTemplate.replaceAll("$dd", day);
    entryTemplate = entryTemplate.replaceAll("$mm", month);
    entryTemplate = entryTemplate.replaceAll("$yyyy", String(year));
    entryTemplate = entryTemplate.replaceAll("$date", `${year}/${month}/${day}`);
    return entryTemplate;
}

async function openDiaryEntry(dataDirectory: string, date: Date) {
    const dateStr = toLocalISOString(date);
    const fileName = `${dateStr}.md`;
    const filePath = path.join(dataDirectory, fileName);

    // Create the file if it doesn't exist and open it in the editor
    if (!fs.existsSync(filePath)) {

        fs.writeFileSync(filePath, headerContents(date), { encoding: 'utf8' });
    }

    const doc = await vscode.workspace.openTextDocument(filePath);
    vscode.window.showTextDocument(doc);
}

function toLocalISOString(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // Months are 0-based
    const day = pad(date.getDate());

    return `${year}-${month}-${day}`;
}

async function applyTagNum(context: vscode.ExtensionContext, which: number) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    
    const line = editor.document.lineAt(editor.selection.active.line);

    const config = vscode.workspace.getConfiguration('task-journal');
    const configuredTags = config.get<string>('tags') ?? []; 
    if(configuredTags.length === 0) {
        vscode.window.showErrorMessage('No configured tags in task-journal.tags.');
        return;
    }

    if(which < 0 || which > configuredTags.length-1) {
        vscode.window.showErrorMessage(`task-journal.tags only length ${configuredTags.length}, trying to access ${which}`);
        return;
    }

    const newText = applyTag(context, line.text, configuredTags[which]);
    if(newText) {
        await editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('"task-journal" is now active!');

    const todaysEntryCommand = vscode.commands.registerCommand('task-journal.todays_entry', async () => {
        const data_directory = prepDiaryDirectory();

        // Generate the file based on the current date
        const date = new Date();
        await openDiaryEntry(data_directory, date);
    });

    const tomorrowsEntryCommand = vscode.commands.registerCommand('task-journal.tomorrows_entry', async () => {
        const data_directory = prepDiaryDirectory();

        // Generate the file  based on tomorrow's date
        const date = new Date();
        date.setDate(date.getDate() + 1);
        await openDiaryEntry(data_directory, date);
    });

    context.subscriptions.push(todaysEntryCommand, tomorrowsEntryCommand);
    
    const decreaseTaskCommand = vscode.commands.registerCommand('task-journal.decrease_task', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        // const currentText = line.text.trim();
        const res = processLine(context, line.text);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            let nextState = res.currentState - 1;
            if(nextState < 0) {
                nextState = res.taskStates.length - 1;
            }
            
            newText = `${res.indentation}${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.indentation}${res.patternStart}${res.taskStates[0]}${res.patternEnd}${res.taskText}`;
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(decreaseTaskCommand);

    const increaseTaskCommand = vscode.commands.registerCommand('task-journal.increase_task', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        // const currentText = line.text.trim();
        const res = processLine(context, line.text);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            const nextState = (res.currentState + 1) % res.taskStates.length;
            newText = `${res.indentation}${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.indentation}${res.patternStart}${res.taskStates[0]}${res.patternEnd}${res.taskText}`;
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(increaseTaskCommand);

    const toggleTaskCommand = vscode.commands.registerCommand('task-journal.toggle_task', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);
        // const currentText = line.text.trim();
        const res = processLine(context, line.text);

        let newText = '';

        // Check if the line is already a valid task line
        if (res.valid) {
            let nextState = res.taskStates.length-1;
            // If already complete, toggle it back to the starting state.
            if(res.currentState === res.taskStates.length-1) {
                nextState = 0;
            }

            newText = `${res.indentation}${res.patternStart}${res.taskStates[nextState]}${res.patternEnd}${res.taskText}`;
        } else {
            newText = `${res.indentation}${res.patternStart}${res.taskStates[0]}${res.patternEnd}${res.taskText}`;
        }

        await editor.edit(editBuilder => {
            editBuilder.replace(line.range, newText);
        });
    });

    context.subscriptions.push(toggleTaskCommand);

    const nextEntryCommand = vscode.commands.registerCommand('task-journal.next_entry', () => {
        navigateDiaryEntry('next');
    });

    const previousEntryCommand = vscode.commands.registerCommand('task-journal.previous_entry', () => {
        navigateDiaryEntry('previous');
    });

    context.subscriptions.push(nextEntryCommand, previousEntryCommand);
    
    // Tag handling
    const applyTagCommand = vscode.commands.registerCommand('task-journal.apply_tag', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        
        const line = editor.document.lineAt(editor.selection.active.line);

        const newText = applyTag(context, line.text, "MGMT");
        if(newText) {
            await editor.edit(editBuilder => {
                editBuilder.replace(line.range, newText);
            });
        }
    });

    for(let i = 0; i < 10; i++) {
        const applyTagCommand = vscode.commands.registerCommand(`task-journal.apply_tag_${i}`, async () => {
            await applyTagNum(context, i);
        });

        context.subscriptions.push(applyTagCommand);
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
