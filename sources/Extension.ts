// 'use strict';

// import * as qubVSCode from "qub-vscode";

// export class Extension extends qub.LanguageExtension<Document> {
//     constructor(platform: qub.Platform) {
//         super(qub.getPackageJson().name, qub.getPackageJson().version, "xml", platform);

//         this.setOnParsedDocumentChanged(Extension.provideTextCompletion);

//         this.setOnProvideCompletions(["/", "?", "!"], Extension.provideCompletions);

//         this.setOnProvideHover(Extension.provideHover);

//         this.setOnProvideIssues((document: Document) => {
//             return document.issues;
//         });

//         this.setOnProvideFormattedDocument((document: Document) => {
//             const activeTextEditor: qub.TextEditor = this.platform.getActiveTextEditor();
//             return document.format({
//                 singleIndent: activeTextEditor.getIndent(),
//                 newLine: activeTextEditor.getNewLine(),
//                 alignAttributes: this.getConfigurationValue<boolean>("formatOptions.alignAttributes", false)
//             });
//         });

//         this.activate();
//     }

//     public static provideCompletions(xmlDocument: Document, index: number): qub.Iterable<qub.Completion> {
//         const pathToSegment: qub.Iterable<Segment> = getPathToSegment(index, xmlDocument);
//         let result = new qub.ArrayList<qub.Completion>();

//         const cursorSegment: Segment = pathToSegment.last();
//         if (cursorSegment) {
//             if (cursorSegment instanceof UnrecognizedTag) {
//                 const secondSegment: Segment = cursorSegment.segments.get(1);
//                 if (secondSegment) {
//                     if (secondSegment.toString() === "?") {
//                         if (cursorSegment.startIndex + 2 === index) {
//                             result.add(new qub.Completion("xml", new qub.Span(cursorSegment.startIndex + 2, 0)));
//                         }
//                     }
//                 }
//             }
//             else if (cursorSegment instanceof ProcessingInstruction) {
//                 const name: Name = cursorSegment.name;
//                 if (name && name.containsIndex(index)) {
//                     result.add(new qub.Completion("xml", name.span));
//                 }
//             }
//             else if (cursorSegment instanceof Declaration) {
//                 if (cursorSegment.getName().containsIndex(index)) {
//                     result.add(new qub.Completion("xml", cursorSegment.getName().span));
//                 }
//                 else if (cursorSegment.getName().afterEndIndex < index && (!cursorSegment.rightQuestionMark || index <= cursorSegment.rightQuestionMark.startIndex)) {
//                     const declarationAttributes: qub.Iterable<Attribute> = cursorSegment.attributes.take(3);
//                     if (!declarationAttributes.any() || index < declarationAttributes.first().startIndex) {
//                         result.add(new qub.Completion("version", new qub.Span(index, 0)));
//                     }
//                     else {
//                         const declarationAttributeNames: string[] = ["version", "encoding", "standalone"];

//                         const declarationAttributeValues = new qub.Map<string, string[]>();
//                         declarationAttributeValues.add("version", [`"1.0"`]);
//                         declarationAttributeValues.add("encoding", [`"utf-8"`]);
//                         declarationAttributeValues.add("standalone", [`"no"`, `"yes"`]);

//                         let attributeIndex: number = 0;
//                         for (const attribute of declarationAttributes) {
//                             if (index < attribute.startIndex) {
//                                 break;
//                             }
//                             else {
//                                 if (attribute.name.containsIndex(index)) {
//                                     result.add(new qub.Completion(declarationAttributeNames[attributeIndex], attribute.name.span));
//                                     break;
//                                 }
//                                 else if (attribute.equals && attribute.equals.afterEndIndex <= index) {
//                                     const possibleValues: string[] = declarationAttributeValues.get(attribute.name.toString());
//                                     if (possibleValues) {
//                                         if (!attribute.value && (index === attribute.equals.afterEndIndex || index < attribute.afterEndIndex || index === cursorSegment.afterEndIndex)) {
//                                             for (const value of possibleValues) {
//                                                 result.add(new qub.Completion(value, new qub.Span(index, 0)));
//                                             }
//                                             break;
//                                         }
//                                         else if (attribute.value && (attribute.value.startIndex === index || attribute.value.containsIndex(index))) {
//                                             for (const value of possibleValues) {
//                                                 result.add(new qub.Completion(value, attribute.value.span));
//                                             }
//                                             break;
//                                         }
//                                     }
//                                     else {
//                                         break;
//                                     }
//                                 }
//                                 ++attributeIndex;
//                             }
//                         }

//                         if (!result.any()) {
//                             if (declarationAttributes.last().afterEndIndex < index && declarationAttributes.getCount() < 3) {
//                                 result.add(new qub.Completion(declarationAttributeNames[declarationAttributes.getCount()], new qub.Span(index, 0)));
//                             }
//                         }
//                     }
//                 }
//             }
//             else if (cursorSegment instanceof EndTag) {
//                 if (index == cursorSegment.forwardSlash.afterEndIndex || (cursorSegment.name && cursorSegment.name.containsIndex(index))) {
//                     const secondToLastSegment: Segment = pathToSegment.iterateReverse().skip(1).first();
//                     if (secondToLastSegment && secondToLastSegment instanceof Element && secondToLastSegment.startTag && secondToLastSegment.startTag.getName()) {
//                         const completionSpan = cursorSegment.name ? cursorSegment.name.span : new qub.Span(cursorSegment.forwardSlash.afterEndIndex, 0);
//                         result.add(new qub.Completion(secondToLastSegment.startTag.getName().toString(), completionSpan));
//                     }
//                 }
//             }
//         }

//         return result;
//     }

//     public static provideHover(xmlDocument: Document, index: number): qub.Hover {
//         const pathToSegment: qub.Iterable<Segment> = getPathToSegment(index, xmlDocument);
//         const cursorSegment: Segment = pathToSegment.last();
//         let result: qub.Hover;

//         if (cursorSegment) {
//             if (cursorSegment instanceof Declaration) {
//                 if (cursorSegment.version && cursorSegment.version.containsIndex(index)) {
//                     result = Hovers.declarationVersion(cursorSegment.version.span);
//                 }
//                 else if (cursorSegment.encoding && cursorSegment.encoding.containsIndex(index)) {
//                     result = Hovers.declarationEncoding(cursorSegment.encoding.span);
//                 }
//                 else if (cursorSegment.standalone && cursorSegment.standalone.containsIndex(index)) {
//                     result = Hovers.declarationStandalone(cursorSegment.standalone.span);
//                 }
//                 else {
//                     result = Hovers.declaration(cursorSegment.span);
//                 }
//             }
//             else if (cursorSegment instanceof DOCTYPE) {
//                 if (cursorSegment.name && cursorSegment.name.containsIndex(index)) {
//                     result = Hovers.doctype(cursorSegment.name.span);
//                 }
//             }
//         }

//         return result;
//     }

//     public static provideTextCompletion(parsedDocumentChange: qub.ParsedDocumentChange<Document>): void {
//         const pathToSegment: qub.Iterable<Segment> = getPathToSegment(parsedDocumentChange.startIndex, parsedDocumentChange.parsedDocument);
//         const cursorSegment: Segment = pathToSegment.last();

//         const addedText: string = parsedDocumentChange.text;

//         if (addedText === ">") {
//             if (cursorSegment instanceof StartTag && parsedDocumentChange.startIndex === cursorSegment.getRightAngleBracket().startIndex) {
//                 const cursorElement: Element = pathToSegment.getLast(1) as Element;
//                 const endTag: EndTag = cursorElement.endTag;
//                 if (!endTag || (endTag.name && cursorElement.startTag.getName().toString() !== endTag.name.toString())) {
//                     parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, `</${cursorSegment.getName().toString()}>`);
//                     parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
//                 }
//             }
//         }
//         else if (addedText === "[") {
//             if (cursorSegment instanceof CDATA && parsedDocumentChange.startIndex === cursorSegment.startIndex + "<![CDATA".length && !cursorSegment.isClosed()) {
//                 const dataSegmentsString: string = qub.getCombinedText(cursorSegment.dataSegments);

//                 let insertText: string;
//                 if (dataSegmentsString === "") {
//                     insertText = "]]>";
//                 }
//                 else if (dataSegmentsString[0] === ">") {
//                     insertText = "]]";
//                 }
//                 else if (dataSegmentsString.substr(0, 2) === "]>") {
//                     insertText = "]";
//                 }
//                 else {
//                     insertText = "]]>";
//                 }

//                 parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, insertText);
//                 parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
//             }
//         }
//         else if (addedText === "-") {
//             if (cursorSegment instanceof Comment && parsedDocumentChange.startIndex === cursorSegment.startIndex + "<!-".length) {
//                 const contentText: string = cursorSegment.contentText;
//                 const isClosed: boolean = cursorSegment.isClosed();

//                 let insertText: string = "";
//                 if (!isClosed || qub.contains(contentText, "<")) {
//                     insertText = " ";
//                     if (contentText === "") {
//                         insertText += "-->";
//                     }
//                     else if (contentText[0] === ">") {
//                         insertText += "--";
//                     }
//                     else if (contentText.substr(0, 2) === "->") {
//                         insertText += "-";
//                     }
//                     else {
//                         insertText += "-->";
//                     }
//                 }
//                 else if (isClosed && contentText === "") {
//                     insertText = " ";
//                 }

//                 if (insertText) {
//                     parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, insertText);
//                     parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
//                 }
//             }
//         }
//     }

//     protected isParsable(textDocument: qub.TextDocument): boolean {
//         return textDocument && textDocument.getLanguageId().toLowerCase() === "xml";
//     }

//     protected parseDocument(documentText: string): Document {
//         return parse(documentText);
//     }
// }