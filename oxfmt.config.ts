// FILE-PATH: oxfmt.config.ts

import { defineConfig } from 'oxfmt';

export default defineConfig({
    printWidth: 120,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    jsxSingleQuote: true,
    quoteProps: 'as-needed',
    trailingComma: 'all',
    bracketSpacing: true,
    bracketSameLine: true,
    arrowParens: 'always',
    endOfLine: 'lf',
    insertFinalNewline: true,
    htmlWhitespaceSensitivity: 'strict',
    singleAttributePerLine: false,
    objectWrap: 'preserve',
    ignorePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/public/**',
        '**/*.txt',
        '**/*.pdf',
        '**/ALL/**',
        '**/ALL_REBUILT/**',
        '**/logs/**',
    ],
    overrides: [
        {
            files: ['*.json', '*.jsonc', '*.md', '*.toml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
});
