# Change Log

## 0.5.0

- Added support for tags.  Specify your tags in the `task-journal.tags` list, and you can use the commands `task-journal.apply_tag_0`-`task-journal.apply_tag_9` to toggle any or them on/off individually.  By default the tag pattern is `($)` where the $ is the comma separated list of tags applied.

## 0.3.0

- Fixed a bug where next/previous navigation didn't work on Windows if the data directory was specified with an upper case drive letter.

## 0.2.1

- Updated CHANELOG.md file from default extension template version.
- Added icon for extension.

## 0.2.0

- Added in entry template configuration option and changed default to `# $date\n`
- Changed `toggle_task` default binding to `ctrl+meta+\`
- Changed today and tomorrow diary entry to trigger regardless of an editor having focus, e.g. it now works on the Welcome page or with no editor open.

## 0.0.1

Initial feature set
- Can toggle lines in markdown into tasks
- Can increase/decrease through progress states
- Can create a journal entry for today or tomorrow
- Can cycle through journal entries.