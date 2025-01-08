# Task Journal

This extension is a subset of the functionality of vim-wiki for creating journal entries and handling tasks with multiple levels of in-progress state.  It is intended to be used on markdown files, but can work on any text file.

## Features

- Toggle lines into tasks with `task-journal.toggle_task`, 
    
    default binding: `ctrl+meta+\`

- Decrease/Increase task progress with `task-journal.decrease_task`/`task-journal.increase_task, 
    
    default bindings: `ctrl+meta+[`, `ctrl+meta+]`

- Create a journal entry for today with `task-journal.todays_entry`. 
    
    default binding: `ctrl+meta+t`

- Create a journal entry for tomorrow with `task-journal.tomorrows_entry`. 
    
    default binding: `ctrl+meta+m`

- Cycle through journal entryies with `task-journal.previous_entry`/`task-journal.next_entry`, 
    
    default bindings: `ctrl+meta+p`, `ctrl+meta+n`


## Extension Settings

This extension contributes the following settings:

* `task-journal.data_directory`: The directory where journal entries live, defaults to `$HOME/.task-journal`
* `task-journal.task_pattern`: The pattern for task lines, defaults to `- [$] `, where the `$` is where the progress states are placed.
* `task-journal.progress_states`: The set of progress states, going from not started, through however many in-progress states, and finally to a compelted state.  This defaults to `[" ", "◔", "◑", "◕", "✓"]`
* `task-journal.entry_template`: The template for each new diary entry, variables available are: 
    
    `$date`: (Date as a yyyy/mm/dd format)
    
    `$yyyy`: The year
    
    `$mm`: The month
    
    `$dd`: The day
    
    The default is `# $date\n`

## Release Notes

### 0.2.0

- Added in entry template configuration option and changed default to `# $date\n`
- Changed `toggle_task` default binding to `ctrl+meta+\`
- Changed today and tomorrow diary entry to trigger regardless of an editor having focus, e.g. it now works on the Welcome page or with no editor open.

### 0.0.1

Initial feature set
- Can toggle lines in markdown into tasks
- Can increase/decrease through progress states
- Can create a journal entry for today or tomorrow
- Can cycle through journal entries.

---

