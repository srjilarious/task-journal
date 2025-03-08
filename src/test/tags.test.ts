import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Task-journal task Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    // Setup before each test
    setup(async () => {
        // Set temporary tags configuration
        await vscode.workspace.getConfiguration().update(
            'task-journal.tags', 
            ['TEST', 'IMPORTANT', 'URGENT'], 
            vscode.ConfigurationTarget.Global
        );
    });

    // Cleanup after each test
    teardown(async () => {
        // Reset configuration
        await vscode.workspace.getConfiguration().update(
            'task-journal.tags', 
            undefined, 
            vscode.ConfigurationTarget.Global
        );
    });

    test('Test toggle first tag on line.', async () => {
            const editor = await vscode.window.showTextDocument(
                await vscode.workspace.openTextDocument({ content: 'Test line' })
            );
    
            // Applying the tag should make it a task if not already and apply the tag.
            {
                await vscode.commands.executeCommand('task-journal.apply_tag_0');
    
                const modifiedText = editor.document.getText();
                assert.strictEqual(modifiedText, '- [ ] (TEST) Test line');
            }
    
            // Apply again, nothing should change.
            {
                await vscode.commands.executeCommand('task-journal.apply_tag_0');
    
                const modifiedText = editor.document.getText();
                assert.strictEqual(modifiedText, '- [ ] (TEST) Test line');
            }
        });

    test('Test toggle multiple tags on line.', async () => {
            const editor = await vscode.window.showTextDocument(
                await vscode.workspace.openTextDocument({ content: '- [ ] Test line' })
            );
    
            // Applying the tag should make it a task if not already and apply the tag.
            {
                await vscode.commands.executeCommand('task-journal.apply_tag_0');
    
                const modifiedText = editor.document.getText();
                assert.strictEqual(modifiedText, '- [ ] (TEST) Test line');
            }
    
            // Apply again, nothing should change.
            {
                await vscode.commands.executeCommand('task-journal.apply_tag_1');
    
                const modifiedText = editor.document.getText();
                assert.strictEqual(modifiedText, '- [ ] (TEST, IMPORTANT) Test line');
            }
        });
});
