### 1.2.5 (2017-08-02)

- Fix extension settings (qub-xml -> qub-xml-vscode)
- Format document will now add tabs and spaces instead of just spaces if tab is the selected indentation.

### 1.2.4 (2017-07-25)

- Add telemetry for when the extension gets activated. This will only be sent once a day if telemetry is enabled.

### 1.2.3 (2017-07-16)

- Fix bug where first xml document opened in a VS Code session won't be recognized as an XML document

### 1.2.2 (2017-07-15)

- Restructure code into separate NPM packages

### 1.2.1 (2017-06-13)

- Added link to a [GitHub repository](https://github.com/danschultequb/qub-xml-vscode/issues) where bugs can be logged.

### 1.2.0 (2017-05-25)

- Added qub-xml.formatOptions.alignAttributes configuration setting which controls whether attributes within a tag that appear on different lines will be aligned to the column index of the first attribute in the tag (alignAttributes: true) or will be aligned to one more indent than the tag itself (alignAttributes: false).

### 1.1.3 (2017-05-18)

- Fix formatting when empty elements were children of elements

### 1.1.2 (2017-05-12)

- Improve start tag formatting when attributes are on separate lines

### 1.1.1 (2017-04-25)

- Removed auto-indent feature because my implementation was just too hacky

### 1.1.0 (2017-04-22)

- Fix auto-add end tag when element is nested inside another element
- Fix auto-add comment closing sequence when comment comes before another comment
- Simplify telemetry

### 1.0.3 (2017-02-08)

- Fix icon for dark themes

### 1.0.2 (2017-02-08)

- Update icon to have transparent background

### 1.0.1 (2017-02-08)

- Update README for 1.0.0 release

### 1.0.0 (2017-02-08)

- Add extension icon
- XML document format now uses the spaces specified in the status bar

### 0.4.1 (2017-02-08)

- Automatically close XML CDATA when second left square bracket ('[') is typed
- Automatically close XML comments when second dash ('-') is typed

### 0.4.0 (2017-02-08)

- Fix XML document formatting where newlines would be added on each format operation
- Automatically close XML elements when start tag's closing right angle bracket '>' is typed

### 0.3.3 (2017-02-02)

- Fix bug where an XML document's issues wouldn't be cleared when the document was closed

### 0.3.2 (2017-02-02)

- Fix comment not closed bug when apostrophes and unclosed quoted strings appear in comment text

### 0.3.1 (2017-02-01)

- Improve XML document formatting
- Add auto-completion for declaration attribute values

### 0.3.0 (2016-10-25)

- Add telemetry

### 0.2.6 (2016-10-16)

- Tag names and attribute names can now contain underscores (_), periods (.), colons (:), and digits (0 - 9)

### 0.2.5 (2016-10-07)

- Fix declaration attribute name autocompletion when right question and/or right angle bracket don't exist

### 0.2.4 (2016-10-03)

- Remove case-sensitivity for declaration attribute values (encoding and standalone)

### 0.2.3 (2016-09-28)

- Improve declaration attribute name auto-completion

### 0.2.2 (2016-09-25)

- Add error messages for declaration attributes and attribute values

### 0.2.1

- Add error messages for declaration and DOCTYPE elements inside of a parent element

### 0.2.0

- Add XML document formatting (Alt+Shift+F)

### 0.1.0

- Initial release