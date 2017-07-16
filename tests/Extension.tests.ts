import * as assert from "assert";
import * as interfaces from "qub-vscode/interfaces";
import * as mocks from "qub-vscode/mocks";
import * as qub from "qub";
import * as xml from "qub-xml";

import * as e from "../sources/Extension";

suite("Extension", () => {
    test("constructor()", () => {
        const platform = new mocks.Platform();
        const extension = new e.Extension(platform);
        assert.deepStrictEqual(extension.name, "qub-xml-vscode");

        extension.dispose();
    });

    suite("on document opened", () => {
        test("with non-xml document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            const openedDocument = new mocks.TextDocument("html", "mock-uri", "I'm not XML!");
            platform.openTextDocument(openedDocument);

            assert(qub.isDefined(platform.getActiveTextEditor()));
            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), openedDocument);
        });

        test("with xml document without declaration or DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            const openedDocument = new mocks.TextDocument("xml", "mock-uri", "");
            platform.openTextDocument(openedDocument);

            assert(qub.isDefined(platform.getActiveTextEditor()));
            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), openedDocument);
        });

        test("with xml document with declaration but not DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            const openedDocument = new mocks.TextDocument("xml", "mock-uri", `<?xml version="1.0" ?>`);
            platform.openTextDocument(openedDocument);

            assert(qub.isDefined(platform.getActiveTextEditor()));
            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), openedDocument);
        });

        test("with xml document with DOCTYPE but not declaration", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            const openedDocument = new mocks.TextDocument("xml", "mock-uri", `<!DOCTYPE root>`);
            platform.openTextDocument(openedDocument);

            assert(qub.isDefined(platform.getActiveTextEditor()));
            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), openedDocument);
        });

        test("with xml document with declaration and DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            const openedDocument = new mocks.TextDocument("xml", "mock-uri", `<?xml version="1.0"?><!DOCTYPE root>`);
            platform.openTextDocument(openedDocument);

            assert(qub.isDefined(platform.getActiveTextEditor()));
            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), openedDocument);
        });
    });

    suite("on document saved", () => {
        test("with non-xml document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.saveTextDocument(new mocks.TextDocument("html", "mock-uri", "I'm not XML!"));
        });

        test("with xml document without declaration or DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.saveTextDocument(new mocks.TextDocument("xml", "mock-uri", ""));
        });

        test("with xml document with declaration but not DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.saveTextDocument(new mocks.TextDocument("xml", "mock-uri", `<?xml version="1.0" ?>`));
        });

        test("with xml document with DOCTYPE but not declaration", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.saveTextDocument(new mocks.TextDocument("xml", "mock-uri", `<!DOCTYPE root>`));
        });

        test("with xml document with declaration and DOCTYPE", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.saveTextDocument(new mocks.TextDocument("xml", "mock-uri", `<?xml version="1.0"?><!DOCTYPE root>`));
        });
    });

    suite("on document changed", () => {
        test("with non-xml document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("html", "mock-uri", "I'm not XML!")));
            assert.deepStrictEqual(platform.getCursorIndex(), 0);
            platform.insertText(0, "Oh wait... ");

            assert.deepStrictEqual(platform.getActiveTextEditor().getDocument().getText(), "Oh wait... I'm not XML!");
            assert.deepStrictEqual(platform.getCursorIndex(), 11);
        });

        function documentChangedTest(documentText: string, insertIndex: number, insertText: string, expectedDocumentText: string, expectedCursorIndex: number): void {
            test(`with ${qub.escapeAndQuote(documentText)} and inserting ${qub.escapeAndQuote(insertText)} at index ${insertIndex}`, () => {
                const platform = new mocks.Platform();
                const extension = new e.Extension(platform);

                platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "mock-uri", documentText)));
                assert.deepStrictEqual(platform.getCursorIndex(), 0);
                platform.insertText(insertIndex, insertText);

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument().getText(), expectedDocumentText);
                assert.deepStrictEqual(platform.getCursorIndex(), expectedCursorIndex);
            });
        }

        documentChangedTest("I'm XML!", 0, "Oh wait... ", "Oh wait... I'm XML!", 11);
        documentChangedTest("I'm XML!", 4, "[", "I'm [XML!", 5);
        documentChangedTest("</abc", 5, "d", "</abcd", 6);
        documentChangedTest("</abc", 5, ">", "</abc>", 6);
        documentChangedTest("<abc", 4, "d", "<abcd", 5);
        documentChangedTest("<abc", 4, ">", "<abc></abc>", 5);
        documentChangedTest("<abc</abc>", 4, ">", "<abc></abc>", 5);
        documentChangedTest("<a><b</a>", 5, ">", "<a><b></b></a>", 6);
        documentChangedTest("<a><b</b></a>", 5, ">", "<a><b></b></a>", 6);

        documentChangedTest("<![CDATA", 8, "[", "<![CDATA[]]>", 9);
        documentChangedTest("<![CDATA]]>", 8, "[", "<![CDATA[]]>", 9);
        documentChangedTest("<![CDATA]>", 8, "[", "<![CDATA[]]>", 9);
        documentChangedTest("<![CDATA]]>", 8, "[", "<![CDATA[]]>", 9);
        documentChangedTest("<a><![CDATA</a>", 11, "[", "<a><![CDATA[]]></a>", 12);
        documentChangedTest("<a><![CDATA></a>", 11, "[", "<a><![CDATA[]]></a>", 12);
        documentChangedTest("<a><![CDATA]></a>", 11, "[", "<a><![CDATA[]]></a>", 12);
        documentChangedTest("<a><![CDATA]]></a>", 11, "[", "<a><![CDATA[]]></a>", 12);

        documentChangedTest("<!-", 3, "-", "<!-- -->", 4);
        documentChangedTest("<!-->", 3, "-", "<!-- -->", 4);
        documentChangedTest("<!--->", 3, "-", "<!-- -->", 4);
        documentChangedTest("<!- -->", 3, "-", "<!-- -->", 4);
        documentChangedTest("<a><!-</a>", 6, "-", "<a><!-- --></a>", 7);
        documentChangedTest("<a><!-></a>", 6, "-", "<a><!-- --></a>", 7);
        documentChangedTest("<a><!--></a>", 6, "-", "<a><!-- --></a>", 7);
        documentChangedTest("<a><!---></a>", 6, "-", "<a><!-- --></a>", 7);
        documentChangedTest("<!-   <!-- -->", 3, "-", "<!-- -->   <!-- -->", 4);
        documentChangedTest("<!-   <!-- -->", 4, "-", "<!- -  <!-- -->", 5);
    });

    suite("on hover", () => {
        test("with no active document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            assert.deepStrictEqual(platform.getHoverAt(10), undefined);
        });

        test("with active non-xml document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("html", "mock-uri", "I'm not XML!")));

            assert.deepStrictEqual(platform.getHoverAt(10), undefined);
        });

        const declarationText: string = `<?xml version="1.0" encoding="utf-8" standalone="yes" ?>`;
        for (let i = -1; i < declarationText.length + 1; ++i) {
            test(`with ${qub.escapeAndQuote(declarationText)} at index ${i}`, () => {
                const platform = new mocks.Platform();
                const extension = new e.Extension(platform);

                platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "C:/Mock/Folders/temp.xml", declarationText)));

                assert.deepStrictEqual(platform.getHoverAt(i),
                    (1 <= i && i <= 5) || (i === 19) || (i === 36) || (53 <= i && i <= 55) ? e.Hovers.declaration(new qub.Span(0, 56)) :
                        (6 <= i && i <= 18) ? e.Hovers.declarationVersion(new qub.Span(6, 13)) :
                            (20 <= i && i <= 35) ? e.Hovers.declarationEncoding(new qub.Span(20, 16)) :
                                (37 <= i && i <= 52) ? e.Hovers.declarationStandalone(new qub.Span(37, 16)) :
                                    undefined);
            });
        }

        const doctypeText: string = `<!DOCTYPE root SYSTEM "systemIdentifier" []>`;
        for (let i = -1; i < doctypeText.length + 1; ++i) {
            test(`with ${qub.escapeAndQuote(doctypeText)} at index ${i}`, () => {
                const platform = new mocks.Platform();
                const extension = new e.Extension(platform);

                platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "C:/Mock/Folders/temp.xml", doctypeText)));

                assert.deepStrictEqual(platform.getHoverAt(i),
                    (2 <= i && i <= 9) ? e.Hovers.doctype(new qub.Span(2, 7)) :
                        undefined);
            });
        }

        const rootElementText: string = `<rootElement><childElement/></rootElement>`;
        for (let i = -1; i < rootElementText.length + 1; ++i) {
            test(`with ${qub.escapeAndQuote(rootElementText)} at index ${i}`, () => {
                const platform = new mocks.Platform();
                const extension = new e.Extension(platform);

                platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "C:/Mock/Folders/temp.xml", rootElementText)));

                assert.deepStrictEqual(platform.getHoverAt(i), undefined);
            });
        }
    });

    suite("on completions", () => {
        test("with no active document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            assert.deepStrictEqual(platform.getCompletionsAt(3).toArray(), []);
        });

        test("with active non-xml document", () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("html", "mock-uri", "I'm not XML!")));

            assert.deepStrictEqual(platform.getCompletionsAt(4).toArray(), []);
        });

        function completionTest(documentText: string, expectedCompletions: (index: number) => interfaces.Completion[]): void {
            for (let i = -1; i < documentText.length + 1; ++i) {
                test(`with ${qub.escapeAndQuote(documentText)} at index ${i}`, () => {
                    const platform = new mocks.Platform();
                    const extension = new e.Extension(platform);

                    platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "C:/Mock/Folders/temp.xml", documentText)));

                    assert.deepStrictEqual(platform.getCompletionsAt(i).toArray(), expectedCompletions(i));
                });
            }
        }

        completionTest("<", (index: number) => []);
        completionTest(`<?`, (index: number) =>
            (2 === index) ? [new interfaces.Completion("xml", new qub.Span(2, 0))] :
                []);
        completionTest(`<?x`, (index: number) =>
            (2 <= index && index <= 3) ? [new interfaces.Completion("xml", new qub.Span(2, 1))] :
                []);
        completionTest("<a", (index: number) => []);
        completionTest("<!", (index: number) => []);
        completionTest("<@", (index: number) => []);
        completionTest("<?xml   ", (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 <= index) ? [new interfaces.Completion("version", new qub.Span(index, 0))] :
                    []);
        completionTest("<?xml  version  ", (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 === index) ? [new interfaces.Completion("version", new qub.Span(index, 0))] :
                    (7 <= index && index <= 14) ? [new interfaces.Completion("version", new qub.Span(7, 7))] :
                        []);
        completionTest(`<?xml version="1.0" encoding  `, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 <= index && index <= 13) ? [new interfaces.Completion("version", new qub.Span(6, 7))] :
                    (14 <= index && index <= 18) ? [new interfaces.Completion(`"1.0"`, new qub.Span(14, 5))] :
                        (20 <= index && index <= 28) ? [new interfaces.Completion("encoding", new qub.Span(20, 8))] :
                            []);
        completionTest(`<?xml version="1.0" encoding =  `, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 <= index && index <= 13) ? [new interfaces.Completion("version", new qub.Span(6, 7))] :
                    (14 <= index && index <= 18) ? [new interfaces.Completion(`"1.0"`, new qub.Span(14, 5))] :
                        (20 <= index && index <= 28) ? [new interfaces.Completion("encoding", new qub.Span(20, 8))] :
                            (30 <= index) ? [new interfaces.Completion(`"utf-8"`, new qub.Span(index, 0))] :
                                []);
        completionTest(`<?xml version="1.0" encoding=>`, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 <= index && index <= 13) ? [new interfaces.Completion("version", new qub.Span(6, 7))] :
                    (14 <= index && index <= 18) ? [new interfaces.Completion(`"1.0"`, new qub.Span(14, 5))] :
                        (20 <= index && index <= 28) ? [new interfaces.Completion("encoding", new qub.Span(20, 8))] :
                            (29 === index) ? [new interfaces.Completion(`"utf-8"`, new qub.Span(index, 0))] :
                                []);
        completionTest(`<?xml version="1.0" encoding="utf-8" standalone="yes" ?>`, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 <= index && index <= 13) ? [new interfaces.Completion("version", new qub.Span(6, 7))] :
                    (14 <= index && index <= 18) ? [new interfaces.Completion(`"1.0"`, new qub.Span(14, 5))] :
                        (20 <= index && index <= 28) ? [new interfaces.Completion("encoding", new qub.Span(20, 8))] :
                            (29 <= index && index <= 35) ? [new interfaces.Completion(`"utf-8"`, new qub.Span(29, 7))] :
                                (37 <= index && index <= 47) ? [new interfaces.Completion("standalone", new qub.Span(37, 10))] :
                                    (48 <= index && index <= 52) ? [new interfaces.Completion(`"no"`, new qub.Span(48, 5)), new interfaces.Completion(`"yes"`, new qub.Span(48, 5))] :
                                        []);
        completionTest(`<?xml  version=  encoding=  standalone=  ?>`, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 === index) ? [new interfaces.Completion("version", new qub.Span(6, 0))] :
                    (7 <= index && index <= 14) ? [new interfaces.Completion("version", new qub.Span(7, 7))] :
                        (15 <= index && index <= 16) ? [new interfaces.Completion(`"1.0"`, new qub.Span(index, 0))] :
                            (17 <= index && index <= 25) ? [new interfaces.Completion("encoding", new qub.Span(17, 8))] :
                                (26 <= index && index <= 27) ? [new interfaces.Completion(`"utf-8"`, new qub.Span(index, 0))] :
                                    (28 <= index && index <= 38) ? [new interfaces.Completion("standalone", new qub.Span(28, 10))] :
                                        (39 <= index && index <= 40) ? [new interfaces.Completion(`"no"`, new qub.Span(index, 0)), new interfaces.Completion(`"yes"`, new qub.Span(index, 0))] :
                                            []);
        completionTest(`<?xml  spam =  "test"  ?   >`, (index: number) =>
            (2 <= index && index <= 5) ? [new interfaces.Completion("xml", new qub.Span(2, 3))] :
                (6 === index) ? [new interfaces.Completion("version", new qub.Span(6, 0))] :
                    (7 <= index && index <= 11) ? [new interfaces.Completion("version", new qub.Span(7, 4))] :
                        (22 <= index && index <= 23) ? [new interfaces.Completion("encoding", new qub.Span(index, 0))] :
                            []);
        completionTest(`<!DOCTYPE root SYSTEM "systemIdentifier" []>`, (index: number) => []);
        completionTest(`<rootElement><childElement/></rootElement>`, (index: number) =>
            (30 <= index && index <= 41) ? [new interfaces.Completion("rootElement", new qub.Span(30, 11))] :
                []);
        completionTest(`<rootElement><childElement/></>`, (index: number) =>
            (30 === index) ? [new interfaces.Completion("rootElement", new qub.Span(30, 0))] :
                []);
        completionTest(`</rootElement>`, (index: number) => []);
    });

    suite("on format document", () => {
        test(`with no active editor`, () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);
            assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
        });

        test(`with non-xml active editor`, () => {
            const platform = new mocks.Platform();
            const extension = new e.Extension(platform);

            platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("html", "mock-uri", "I'm not XML!")));

            assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
        });

        function formatTest(documentText: string, expectedFormattedText: string = documentText): void {
            test(`with "${qub.escapeAndQuote(documentText)}"`, () => {
                const platform = new mocks.Platform();
                const extension = new e.Extension(platform);

                platform.setActiveTextEditor(new mocks.TextEditor(new mocks.TextDocument("xml", "mock-uri", documentText)));

                assert.deepStrictEqual(platform.getFormattedDocument(), expectedFormattedText);
            });
        }

        formatTest("", "");
        formatTest("<a/>");
        formatTest("<a></a>", "<a/>");
        formatTest("<a><b><c></c></b></a>", "<a>\n  <b>\n    <c/>\n  </b>\n</a>");
        formatTest(`<a b="c">`);
        formatTest(`<a    b = "c" >`, `<a b="c">`);
        formatTest(`<a\nb="c">`, `<a\n  b="c">`);
        formatTest(`<a\n  b="c">`);
        formatTest(`<a\nb="c"><d\ne="f"></d></a>`, `<a\n  b="c">\n  <d\n    e="f"/>\n</a>`);
        formatTest(`<a><b><c><d\ne="f"></d></c></b></a>`, `<a>\n  <b>\n    <c>\n      <d\n        e="f"/>\n    </c>\n  </b>\n</a>`)
        formatTest(`<a><b><c\nd="e"/><f\ng="h"/></b></a>`, `<a>\n  <b>\n    <c\n      d="e"/>\n    <f\n      g="h"/>\n  </b>\n</a>`);
        formatTest(`<b><c\nd="e"/><f\ng="h"/></b>`, `<b>\n  <c\n    d="e"/>\n  <f\n    g="h"/>\n</b>`);
        formatTest(`<b><c\nd="e"/></b>`, `<b>\n  <c\n    d="e"/>\n</b>`);
        formatTest(`<c\nd="e"/><f\ng="h"/>`, `<c\n  d="e"/>\n<f\n  g="h"/>`);
    });
});