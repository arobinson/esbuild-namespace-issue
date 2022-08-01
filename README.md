# Issue with 3rd party dependencies with esbuild

We are having problems with esbuild resolving two functions. In the case of `messageformat`, we are currently using an older version that
is not in active development and have not switched off of it yet. 

We are seeing the problem when trying to build with Bazel using the Angular compiler and then esbuild to bundle. The bundling step also
brings in the Angular linker as a Babel plug-in to produce Angular Ivy code.

Using Angular CLI which uses Webpack, there are no issues. It seems that esbuild is having an issue resolving `MessageFormat` as both
a class an a namespace.

Here is the `index.d.ts` file from `MessageFormat`:
```
declare namespace MessageFormat {
  type Msg = { (params: {}): string; toString(global?: string): string };
  type Formatter = (val: any, lc: string, arg?: string) => string;
  type SrcMessage = string | SrcObject;

  interface SrcObject {
    [key: string]: SrcMessage;
  }

  interface Options {
    biDiSupport?: boolean;
    customFormatters?: { [name: string]: Formatter };
    pluralKeyChecks?: boolean;
    strictNumberSign?: boolean;
  }
}

declare class MessageFormat {
  constructor(
    locales?: { [locale: string]: Function } | string[] | string,
    options?: MessageFormat.Options
  );
  addFormatters: (format: { [name: string]: MessageFormat.Formatter }) => this;
  disablePluralKeyChecks: () => this;
  setBiDiSupport: (enable: boolean) => this;
  setStrictNumberSign: (enable: boolean) => this;
  compile: (
    messages: MessageFormat.SrcMessage,
    locale?: string
  ) => MessageFormat.Msg;
}

export = MessageFormat;
```

# To reproduce with Bazel

1. Clone this repository locally.
2. Have `pnpm` installed locally (if not you can use `npm i -g pnpm` to have it installed into `pnpm`)

To reproduce the issue using Bazel (what we are seeing):

```
pnpm run build
```

Build output:
```
> namespace-issue@1.0.0 clean.build /Users/andrew/development/esbuild/namespaceIssue
> bazelisk clean && bazelisk build //:bundle

(11:11:09) INFO: Starting clean.
(11:11:10) INFO: Current date is 2022-08-01
(11:11:11) INFO: Analyzed target //:bundle (158 packages loaded, 1184 targets configured).
(11:11:11) INFO: Found 1 target...
(11:11:22) INFO: From Splitting Javascript reproduce-issue.ts [esbuild]:
▲ [WARNING] Calling "dragula" will crash at run-time because it's an import namespace object, not a function

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/reproduce-issue.ts:16:2:
      16 │   dragula(options);
         ╵   ~~~~~~~

  Consider changing "dragula" to a default import instead:

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/reproduce-issue.ts:2:7:
      2 │ import * as dragula from "dragula";
        │        ~~~~~~~~~~~~
        ╵        dragula

  Make sure to enable TypeScript's "esModuleInterop" setting so that TypeScript's type checker generates an error when you try to do this. You can read more about this setting here: https://www.typescriptlang.org/tsconfig#esModuleInterop

▲ [WARNING] Constructing "MessageFormat" will crash at run-time because it's an import namespace object, not a constructor

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/reproduce-issue.ts:23:17:
      23 │   const mf = new MessageFormat("en-US");
         ╵                  ~~~~~~~~~~~~~

  Consider changing "MessageFormat" to a default import instead:

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/reproduce-issue.ts:3:7:
      3 │ import * as MessageFormat from "messageformat";
        │        ~~~~~~~~~~~~~~~~~~
        ╵        MessageFormat

  Make sure to enable TypeScript's "esModuleInterop" setting so that TypeScript's type checker generates an error when you try to do this. You can read more about this setting here: https://www.typescriptlang.org/tsconfig#esModuleInterop

▲ [WARNING] Top-level "this" will be replaced with undefined since this file is an ECMAScript module

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/example-decorator.js:1:18:
      1 │ var __decorate = (this && this.__decorate) || function (decorators,...
        │                   ~~~~
        ╵                   undefined

  This file is considered to be an ECMAScript module because of the "export" keyword here:

    ../../../../../../../../execroot/esbuild-namespace-issue/bazel-out/darwin-fastbuild/bin/example-decorator.js:30:0:
      30 │ export { ExampleClass };
         ╵ ~~~~~~

Target //:bundle up-to-date:
  bazel-bin/bundle
  bazel-bin/bundle_metadata.json
(11:11:22) INFO: Elapsed time: 12.001s, Critical Path: 9.83s
(11:11:22) INFO: 531 processes: 312 internal, 7 darwin-sandbox, 212 local.
(11:11:22) INFO: Build completed successfully, 531 total actions
```

To reproduce the issue again, you must clear the Bazel cache. You can do this by running
```
pnpm run clean.build
```

# To reproduce using only pnpm + tsc + esbuild

1. Clone this repository locally.
2. Have `pnpm` installed locally (if not you can use `npm i -g pnpm` to have it installed into `pnpm`)

Run 
```
pnpm run build.direct
```

Output:
```
> namespaceIssue@1.0.0 build.direct /Users/andrew/development/esbuild/namespaceIssue
> pnpm run tsc.direct && pnpm run esbuild.direct


> namespaceIssue@1.0.0 tsc.direct /Users/andrew/development/esbuild/namespaceIssue
> tsc --project tsconfig.json


> namespaceIssue@1.0.0 esbuild.direct /Users/andrew/development/esbuild/namespaceIssue
> esbuild --bundle dist/out-tsc/reproduce-issue.js --outdir=dist/esbuild --platform=node esbuild.config.mjs

▲ [WARNING] Calling "dragula" will crash at run-time because it's an import namespace object, not a function [call-import-namespace]

    dist/out-tsc/reproduce-issue.js:12:4:
      12 │     dragula(options);
         ╵     ~~~~~~~

  Consider changing "dragula" to a default import instead:

    dist/out-tsc/reproduce-issue.js:1:7:
      1 │ import * as dragula from "dragula";
        │        ~~~~~~~~~~~~
        ╵        dragula

▲ [WARNING] Constructing "MessageFormat" will crash at run-time because it's an import namespace object, not a constructor [call-import-namespace]

    dist/out-tsc/reproduce-issue.js:19:19:
      19 │     const mf = new MessageFormat("en-US");
         ╵                    ~~~~~~~~~~~~~

  Consider changing "MessageFormat" to a default import instead:

    dist/out-tsc/reproduce-issue.js:2:7:
      2 │ import * as MessageFormat from "messageformat";
        │        ~~~~~~~~~~~~~~~~~~
        ╵        MessageFormat

2 warnings

  dist/esbuild/esbuild.config.js                10.1mb ⚠️
  dist/esbuild/dist/out-tsc/reproduce-issue.js   1.1mb ⚠️

⚡ Done in 554ms
```