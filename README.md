# Task Journal

![Example Usage of Extension](/assets/extension_usage.gif)

This extension is for creating journal entries and handling tasks with multiple levels of in-progress state.  It is intended to be used on markdown files, but can work on any text file.  It was inspired by the fantastic vim-wiki plugin that I used on vim.

## Tasks

Using the `task-journal.toggle_task` command will take the current line and (with the default pattern) prepend a `- [ ]` if one is not found.  If the "task pattern" is found, it will toggle it as completed `- [✓]`.

You can have multiple states of in-progress, such as ◔, ◑, ◕, moving through them with the `task-journal.increase_task` and `task-journal.decrease_task` commands.

## Diary Entries

You can create a new markdown file for each day to keep track of tasks and notes.  Use the `task-journal.todays_entry` to open or create an entry for today, or `task-journal.tomorrows_entry` to create one for tomorrow.  You can cycle through the entries that are created in your `task-journal.data_directory`, with the commands `task-journal.previous_entry` and `task-journal.next_entry`.

## Tags

Task Journal supports having a list of tags that you can apply to a task line.  By default this is rendered as `(TAG1, TAG2)`, but you need to set up the list of tags you want to use in the `task-journal.tags` list first.  Then with the `task-journal.apply_tag_0` through `task-journal.apply_tag_9` commands, you can toggle each tag on the line independently.

This feature is intended to make it easy to search for groups of related tasks using some like ripgrep to quickly search the diary entries you've created.

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
* `task-journal.tag_pattern`: Similar to the `task_pattern` setting, it is the template used for tags, where the `$` is replaced with the set of tags for the task line.
* `task-journal.tag_separator`: By default, tags are separated by a `, `, but you can change this if you'd like.
* `task-journal.tags`: In order to use the tagging feature, you need to add a set of items to this setting in order to be able to apply them to tasks.  It defaults to an empty list.

## Release Notes

### 0.5.0

Added support for tags.  You need to add a set of tags to `task-journal.tags` and then you can toggle one or multiple on a task line.

The tags are by default rendered with `(TAG1,TAG2)`, but you can change the end/start strings and the separator if you want.

### 0.3.0

- Fixed a bug where next/previous navigation didn't work on Windows if the data directory was specified with an upper case drive letter.

### 0.2.1

- Added icon and CHANGELOG.md contents.

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

