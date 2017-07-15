// 'use strict';

// import * as vscode from "vscode";

// import * as msbuild from "qub-msbuild";

// import { Application, ApplicationInsightsTelemetry } from "../../Common/sources/VSCode";

// // this method is called when your extension is activated
// // your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {
//     const application = new Application();
//     application.setRemoteTelemetryCreator(() => new ApplicationInsightsTelemetry({
//         instrumentationKey: "6d6e08cd-67e6-47d8-88b8-700f000a1215"
//     }));
//     context.subscriptions.push(new msbuild.Extension(application));
// }