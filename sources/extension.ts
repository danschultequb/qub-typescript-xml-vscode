'use strict';

import * as applicationInsights from "qub-telemetry-applicationinsights";
import * as qub from "qub";
import * as xml from "qub-xml";
import * as interfaces from "qub-vscode/interfaces";
import * as telemetry from "qub-telemetry";

function getPathToSegment(index: number, xmlDocument: xml.Document): qub.Iterable<xml.Segment> {
    const result = new qub.ArrayList<xml.Segment>();
    let segmentsToSearch: qub.Iterable<xml.Segment> = xmlDocument.segments;
    let keepSearching: boolean = true;
    while (keepSearching) {
        keepSearching = false;
        for (const segment of segmentsToSearch) {
            if (segment.containsIndex(index)) {
                result.add(segment);
                if (segment instanceof xml.Element) {
                    keepSearching = true;
                    segmentsToSearch = segment.segments;
                    break;
                }
            }
        }
    }
    return result;
}

export class Hovers {
    public static declaration(span: qub.Span): interfaces.Hover {
        return new interfaces.Hover(
            [
                "The declaration tag of this XML document.",
                `[XML Specification](http://www.w3.org/TR/2008/REC-xml-20081126/#sec-prolog-dtd)`
            ],
            span);
    }

    public static declarationVersion(span: qub.Span): interfaces.Hover {
        return new interfaces.Hover(
            [
                `The version of XML to use to parse this document. The version number should be "1.0".`,
                `[XML Specification](http://www.w3.org/TR/2008/REC-xml-20081126/#NT-VersionInfo)`
            ],
            span);
    }

    public static declarationEncoding(span: qub.Span): interfaces.Hover {
        return new interfaces.Hover(
            [
                `The encoding that this XML file is encoded with.`,
                `[XML Specification](http://www.w3.org/TR/2008/REC-xml-20081126/#NT-EncodingDecl)`
            ],
            span);
    }

    public static declarationStandalone(span: qub.Span): interfaces.Hover {
        return new interfaces.Hover(
            [
                `Whether or not this XML document is allowed to reference external resources.`,
                `[XML Specification](http://www.w3.org/TR/2008/REC-xml-20081126/#NT-SDDecl)`
            ],
            span);
    }

    public static doctype(span: qub.Span): interfaces.Hover {
        return new interfaces.Hover(
            [
                "A document type definition (DTD) that defines the expected structure of this document.",
                `[XML Specification](https://www.w3.org/TR/2008/REC-xml-20081126/#dt-doctype)`
            ],
            span);
    }
}

let packageJson: any;
function getPackageJson(): any {
    if (!packageJson) {
        packageJson = qub.getPackageJson(__dirname);
    }
    return packageJson;
}

export class Extension extends interfaces.LanguageExtension<xml.Document> {
    private _telemetry: applicationInsights.Telemetry;

    constructor(platform: interfaces.Platform) {
        super(getPackageJson().name, getPackageJson().version, "xml", platform);

        this.setOnParsedDocumentChanged(Extension.provideTextCompletion);

        this.setOnProvideCompletions(["/", "?", "!"], Extension.provideCompletions);

        this.setOnProvideHover(Extension.provideHover);

        this.setOnProvideIssues((document: xml.Document) => {
            return document.issues;
        });

        this.setOnProvideFormattedDocument((document: xml.Document) => {
            const activeTextEditor: interfaces.TextEditor = this.getActiveTextEditor();
            return document.format({
                singleIndent: activeTextEditor.getIndent(),
                newLine: activeTextEditor.getNewLine(),
                alignAttributes: this.getConfigurationValue<boolean>("formatOptions.alignAttributes", false)
            });
        });

        this.updateActiveDocumentParse();

        this._telemetry = new applicationInsights.Telemetry({ instrumentationKey: "b0639062-9169-4fb7-b682-6edb50bacb39" });
        this._telemetry.write(new telemetry.Event("Activated"));
    }

    public dispose(): void {
        this._telemetry.close();
    }

    public static provideCompletions(xmlDocument: xml.Document, index: number): qub.Iterable<interfaces.Completion> {
        const pathToSegment: qub.Iterable<xml.Segment> = getPathToSegment(index, xmlDocument);
        let result = new qub.ArrayList<interfaces.Completion>();

        const cursorSegment: xml.Segment = pathToSegment.last();
        if (cursorSegment) {
            if (cursorSegment instanceof xml.UnrecognizedTag) {
                const secondSegment: xml.Segment = cursorSegment.segments.get(1);
                if (secondSegment) {
                    if (secondSegment.toString() === "?") {
                        if (cursorSegment.startIndex + 2 === index) {
                            result.add(new interfaces.Completion("xml", new qub.Span(cursorSegment.startIndex + 2, 0)));
                        }
                    }
                }
            }
            else if (cursorSegment instanceof xml.ProcessingInstruction) {
                const name: xml.Name = cursorSegment.name;
                if (name && name.containsIndex(index)) {
                    result.add(new interfaces.Completion("xml", name.span));
                }
            }
            else if (cursorSegment instanceof xml.Declaration) {
                if (cursorSegment.getName().containsIndex(index)) {
                    result.add(new interfaces.Completion("xml", cursorSegment.getName().span));
                }
                else if (cursorSegment.getName().afterEndIndex < index && (!cursorSegment.rightQuestionMark || index <= cursorSegment.rightQuestionMark.startIndex)) {
                    const declarationAttributes: qub.Iterable<xml.Attribute> = cursorSegment.attributes.take(3);
                    if (!declarationAttributes.any() || index < declarationAttributes.first().startIndex) {
                        result.add(new interfaces.Completion("version", new qub.Span(index, 0)));
                    }
                    else {
                        const declarationAttributeNames: string[] = ["version", "encoding", "standalone"];

                        const declarationAttributeValues = new qub.Map<string, string[]>();
                        declarationAttributeValues.add("version", [`"1.0"`]);
                        declarationAttributeValues.add("encoding", [`"utf-8"`]);
                        declarationAttributeValues.add("standalone", [`"no"`, `"yes"`]);

                        let attributeIndex: number = 0;
                        for (const attribute of declarationAttributes) {
                            if (index < attribute.startIndex) {
                                break;
                            }
                            else {
                                if (attribute.name.containsIndex(index)) {
                                    result.add(new interfaces.Completion(declarationAttributeNames[attributeIndex], attribute.name.span));
                                    break;
                                }
                                else if (attribute.equals && attribute.equals.afterEndIndex <= index) {
                                    const possibleValues: string[] = declarationAttributeValues.get(attribute.name.toString());
                                    if (possibleValues) {
                                        if (!attribute.value && (index === attribute.equals.afterEndIndex || index < attribute.afterEndIndex || index === cursorSegment.afterEndIndex)) {
                                            for (const value of possibleValues) {
                                                result.add(new interfaces.Completion(value, new qub.Span(index, 0)));
                                            }
                                            break;
                                        }
                                        else if (attribute.value && (attribute.value.startIndex === index || attribute.value.containsIndex(index))) {
                                            for (const value of possibleValues) {
                                                result.add(new interfaces.Completion(value, attribute.value.span));
                                            }
                                            break;
                                        }
                                    }
                                    else {
                                        break;
                                    }
                                }
                                ++attributeIndex;
                            }
                        }

                        if (!result.any()) {
                            if (declarationAttributes.last().afterEndIndex < index && declarationAttributes.getCount() < 3) {
                                result.add(new interfaces.Completion(declarationAttributeNames[declarationAttributes.getCount()], new qub.Span(index, 0)));
                            }
                        }
                    }
                }
            }
            else if (cursorSegment instanceof xml.EndTag) {
                if (index == cursorSegment.forwardSlash.afterEndIndex || (cursorSegment.name && cursorSegment.name.containsIndex(index))) {
                    const secondToLastSegment: xml.Segment = pathToSegment.skipLast(1).last();
                    if (secondToLastSegment && secondToLastSegment instanceof xml.Element && secondToLastSegment.startTag && secondToLastSegment.startTag.getName()) {
                        const completionSpan = cursorSegment.name ? cursorSegment.name.span : new qub.Span(cursorSegment.forwardSlash.afterEndIndex, 0);
                        result.add(new interfaces.Completion(secondToLastSegment.startTag.getName().toString(), completionSpan));
                    }
                }
            }
        }

        return result;
    }

    public static provideHover(xmlDocument: xml.Document, index: number): interfaces.Hover {
        const pathToSegment: qub.Iterable<xml.Segment> = getPathToSegment(index, xmlDocument);
        const cursorSegment: xml.Segment = pathToSegment.last();
        let result: interfaces.Hover;

        if (cursorSegment) {
            if (cursorSegment instanceof xml.Declaration) {
                if (cursorSegment.version && cursorSegment.version.containsIndex(index)) {
                    result = Hovers.declarationVersion(cursorSegment.version.span);
                }
                else if (cursorSegment.encoding && cursorSegment.encoding.containsIndex(index)) {
                    result = Hovers.declarationEncoding(cursorSegment.encoding.span);
                }
                else if (cursorSegment.standalone && cursorSegment.standalone.containsIndex(index)) {
                    result = Hovers.declarationStandalone(cursorSegment.standalone.span);
                }
                else {
                    result = Hovers.declaration(cursorSegment.span);
                }
            }
            else if (cursorSegment instanceof xml.DOCTYPE) {
                if (cursorSegment.name && cursorSegment.name.containsIndex(index)) {
                    result = Hovers.doctype(cursorSegment.name.span);
                }
            }
        }

        return result;
    }

    public static provideTextCompletion(parsedDocumentChange: interfaces.ParsedDocumentChange<xml.Document>): void {
        const pathToSegment: qub.Iterable<xml.Segment> = getPathToSegment(parsedDocumentChange.startIndex, parsedDocumentChange.parsedDocument);
        const cursorSegment: xml.Segment = pathToSegment.last();

        const addedText: string = parsedDocumentChange.text;

        if (addedText === ">") {
            if (cursorSegment instanceof xml.StartTag && parsedDocumentChange.startIndex === cursorSegment.getRightAngleBracket().startIndex) {
                const cursorElement: xml.Element = pathToSegment.skipLast(1).last() as xml.Element;
                const endTag: xml.EndTag = cursorElement.endTag;
                if (!endTag || (endTag.name && cursorElement.startTag.getName().toString() !== endTag.name.toString())) {
                    parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, `</${cursorSegment.getName().toString()}>`);
                    parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
                }
            }
        }
        else if (addedText === "[") {
            if (cursorSegment instanceof xml.CDATA && parsedDocumentChange.startIndex === cursorSegment.startIndex + "<![CDATA".length && !cursorSegment.isClosed()) {
                const dataSegmentsString: string = qub.getCombinedText(cursorSegment.dataSegments);

                let insertText: string;
                if (dataSegmentsString === "") {
                    insertText = "]]>";
                }
                else if (dataSegmentsString[0] === ">") {
                    insertText = "]]";
                }
                else if (dataSegmentsString.substr(0, 2) === "]>") {
                    insertText = "]";
                }
                else {
                    insertText = "]]>";
                }

                parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, insertText);
                parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
            }
        }
        else if (addedText === "-") {
            if (cursorSegment instanceof xml.Comment && parsedDocumentChange.startIndex === cursorSegment.startIndex + "<!-".length) {
                const contentText: string = cursorSegment.contentText;
                const isClosed: boolean = cursorSegment.isClosed();

                let insertText: string = "";
                if (!isClosed || qub.contains(contentText, "<")) {
                    insertText = " ";
                    if (contentText === "") {
                        insertText += "-->";
                    }
                    else if (contentText[0] === ">") {
                        insertText += "--";
                    }
                    else if (contentText.substr(0, 2) === "->") {
                        insertText += "-";
                    }
                    else {
                        insertText += "-->";
                    }
                }
                else if (isClosed && contentText === "") {
                    insertText = " ";
                }

                if (insertText) {
                    parsedDocumentChange.editor.insert(parsedDocumentChange.afterChangeAfterEndIndex, insertText);
                    parsedDocumentChange.editor.setCursorIndex(parsedDocumentChange.afterChangeAfterEndIndex);
                }
            }
        }
    }

    protected isParsable(textDocument: interfaces.TextDocument): boolean {
        return textDocument && textDocument.getLanguageId().toLowerCase() === "xml";
    }

    protected parseDocument(documentText: string): xml.Document {
        return xml.parse(documentText);
    }
}