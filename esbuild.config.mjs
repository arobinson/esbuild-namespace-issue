// Forked ESBuild rules with changes applied from https://github.com/aspect-build/rules_esbuild/pull/32/files
import { ConsoleLogger, LogLevel, NodeJSFileSystem } from '@angular/compiler-cli';
import { createEs2015LinkerPlugin } from '@angular/compiler-cli/linker/babel';
import { transformFileAsync } from '@babel/core';
import * as path from 'path';

const linkerBabelPlugin = createEs2015LinkerPlugin({
  fileSystem: new NodeJSFileSystem(),
  logger: new ConsoleLogger(LogLevel.warn),
  unknownDeclarationVersionHandling: 'error',
  linkerJitMode: false,
  // Workaround for https://github.com/angular/angular/issues/42769 and https://github.com/angular/angular-cli/issues/22647.
  sourceMapping: false
});

const ngLinkerPlugin = {
  name: 'ng-linker-esbuild',
  setup(build) {
    build.onLoad({ filter: /node_modules/ }, async (args) => {
      const filePath = args.path;
      const transformResult = await transformFileAsync(filePath, {
        filename: filePath,
        filenameRelative: filePath,
        plugins: [linkerBabelPlugin],
        sourceMaps: 'inline',
        compact: false
      });

      if (!transformResult) {
        throw new Error('Babel NG Linker error');
      }

      return { contents: transformResult.code };
    });
  }
};

const bazelSandboxAwareOnResolvePlugin = {
  name: 'Bazel Sandbox Guard',
  setup(build) {
    const BAZEL_BINDIR = process.env.BAZEL_BINDIR;

    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.resolveDir.indexOf(BAZEL_BINDIR) === -1) {
        return {
          errors: [
            {
              text: `Failed to resolve import '${args.path}'. Ensure that it is a dependency of an upstream target`,
              location: null
            }
          ]
        };
      }
    });
  }
};

export default {
  resolveExtensions: ['.mjs', '.js'],
  plugins: [
    bazelSandboxAwareOnResolvePlugin,
    ngLinkerPlugin
  ]
};
