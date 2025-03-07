import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Task-journal task Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Test toggle task on line.', async () => {
        const editor = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({ content: 'Test line' })
        );

        {
            await vscode.commands.executeCommand('task-journal.toggle_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [ ] Test line');
        }

        // Now untoggle
        {
            await vscode.commands.executeCommand('task-journal.toggle_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [ ] Test line');
        }
    });

    test('Test increasing task line.', async () => {
        const editor = await vscode.window.showTextDocument(
            await vscode.workspace.openTextDocument({ content: 'Test line' })
        );

        {
            await vscode.commands.executeCommand('task-journal.toggle_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [ ] Test line');
        }

        // Increase
        {
            await vscode.commands.executeCommand('task-journal.increase_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [◔] Test line');
        }

        // Increase
        {
            await vscode.commands.executeCommand('task-journal.increase_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [◑] Test line');
        }

        // Increase
        {
            await vscode.commands.executeCommand('task-journal.increase_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [◕] Test line');
        }

        // Increase
        {
            await vscode.commands.executeCommand('task-journal.increase_task');

            const modifiedText = editor.document.getText();
            assert.strictEqual(modifiedText, '- [✓] Test line');
        }
    });
});
