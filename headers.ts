// FILE-PATH: headers.ts

import { cancel, confirm, intro, isCancel, log, note, outro, select, spinner } from '@clack/prompts';
import path from 'path';
import pc from 'picocolors';
import { BunFile } from 'bun';

export interface Theme {
    primary(text: string): string;
    success(text: string): string;
    error(text: string): string;
    muted(text: string): string;
}

export const DarkTheme: Theme = {
    primary: (txt: string): string => pc.bgCyan(pc.black(` ${txt} `)),
    success: (txt: string): string => pc.green(txt),
    error: (txt: string): string => pc.red(txt),
    muted: (txt: string): string => pc.dim(txt),
};

export interface Config {
    theme: Theme;
    exclude: string[];
}

export interface HeaderUpdate {
    modified: boolean;
    reason?: string;
}

export interface ScanSummary {
    total: number;
    processed: number;
    skipped: number;
    failed: number;
}

type HeaderAction = 'inject' | 'strip' | 'exit';

export abstract class Command {
    abstract readonly key: string;
    abstract readonly label: string;
    abstract readonly hint: string;
    abstract execute(): Promise<void>;
}

export class HeaderComments extends Command {
    readonly key = 'headercomments';
    readonly label = 'HeaderComments Manager';
    readonly hint = 'Inject or strip contextual path comment descriptors';

    private config: Config;

    private readonly BASE_DIR = process.cwd();
    private readonly COMMENT = '//';
    private readonly HEADER_COMMENT = `${this.COMMENT} FILE-PATH:`;
    private readonly SHEBANG_REGEX = /^#!.*/;
    private readonly FILE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];

    private readonly BULLET = {
        arrow: '->',
        arrowHead: '➤',
        circle: {
            green: '🟢',
            white: '⚪',
            red: '🔴',
            purple: '🟣',
        },
        cancel: '✖️',
        complete: '✅',
        success: '☑️ ',
        error: '☠️',
        exit: '❌',
        comment: '💬',
    } as const;

    constructor(config: Config) {
        super();
        this.config = { ...config };
    }

    private toUnixPath(p: string): string {
        return p.replace(/\\/g, '/');
    }

    private isIgnorePath(filePath: string, compiledExcludes: Bun.Glob[]): boolean {
        const unixPath: string = this.toUnixPath(filePath);

        return (
            unixPath.startsWith('node_modules/') ||
            unixPath.startsWith('.git/') ||
            compiledExcludes.some((glob: Bun.Glob): boolean => glob.match(filePath))
        );
    }

    public async enforceHeaderComments(absolutePath: string): Promise<HeaderUpdate> {
        const file: BunFile = Bun.file(absolutePath);
        const contents: string = await file.text();

        if (contents.includes(this.HEADER_COMMENT)) {
            return { modified: false, reason: 'Header comment already present.' };
        }

        const relativePath: string = path.relative(this.BASE_DIR, absolutePath);
        const unixRelativePath: string = this.toUnixPath(relativePath);
        const targetHeader: string = `${this.HEADER_COMMENT} ${unixRelativePath}\n`;

        const firstNewlineIdx: number = contents.indexOf('\n');
        const firstLine: string =
            firstNewlineIdx === -1 ? contents : contents.slice(0, firstNewlineIdx).replace('\r', '');

        let updatedContent: string = '';
        if (this.SHEBANG_REGEX.test(firstLine)) {
            const remainingContent: string = firstNewlineIdx === -1 ? '' : contents.slice(firstNewlineIdx + 1);
            const separator: string = remainingContent.trim().length > 0 ? '\n' : '';
            updatedContent = `${firstLine}\n${targetHeader}${separator}${remainingContent}`;
        } else {
            const separator: string = contents.length > 0 ? '\n' : '';
            updatedContent = `${targetHeader}${separator}${contents}`;
        }

        await Bun.write(absolutePath, updatedContent);

        return { modified: true };
    }

    public async removeHeaderComments(absolutePath: string): Promise<HeaderUpdate> {
        const file: BunFile = Bun.file(absolutePath);
        const contents: string = await file.text();

        if (!contents.includes(this.HEADER_COMMENT)) {
            return { modified: false, reason: 'Header comment not present.' };
        }

        const firstNewlineIdx: number = contents.indexOf('\n');
        const firstLine: string =
            firstNewlineIdx === -1 ? contents : contents.slice(0, firstNewlineIdx).replace('\r', '');

        let updatedContent: string = '';

        if (this.SHEBANG_REGEX.test(firstLine)) {
            const remainingContent: string = firstNewlineIdx === -1 ? '' : contents.slice(firstNewlineIdx + 1);
            const nextNewlineIdx: number = remainingContent.indexOf('\n');
            const secondLine: string =
                nextNewlineIdx === -1 ? remainingContent : remainingContent.slice(0, nextNewlineIdx);

            if (secondLine.includes(this.HEADER_COMMENT)) {
                updatedContent = `${firstLine}\n${nextNewlineIdx === -1 ? '' : remainingContent.slice(nextNewlineIdx + 1)}`;
            } else {
                updatedContent = `${firstLine}\n${remainingContent.replace(this.HEADER_COMMENT, '')}`;
            }
        } else {
            if (firstLine.includes(this.HEADER_COMMENT)) {
                updatedContent = firstNewlineIdx === -1 ? '' : contents.slice(firstNewlineIdx + 1);
            } else {
                updatedContent = contents.replace(new RegExp(`.*${RegExp.escape(this.HEADER_COMMENT)}.*\\n?`, 'g'), '');
            }
        }

        await Bun.write(absolutePath, updatedContent.trimStart());

        return { modified: true };
    }

    private async processBatch(action: HeaderAction): Promise<ScanSummary> {
        const summary: ScanSummary = { total: 0, processed: 0, skipped: 0, failed: 0 };
        const extensionsList: string = this.FILE_EXTENSIONS.join(',');
        const glob: Bun.Glob = new Bun.Glob(`**/*.{${extensionsList}}`);

        const excludeGlobs: Bun.Glob[] = this.config.exclude.map((ex: string): Bun.Glob => new Bun.Glob(ex));
        const fileBuffer: string[] = [];

        for await (const relativePath of glob.scan({ cwd: this.BASE_DIR })) {
            fileBuffer.push(relativePath);
        }

        summary.total = fileBuffer.length;

        await Promise.all(
            fileBuffer.map(async (relativePath: string): Promise<void> => {
                if (this.isIgnorePath(relativePath, excludeGlobs)) {
                    summary.skipped++;
                    return;
                }

                const absolutePath: string = path.join(this.BASE_DIR, relativePath);
                try {
                    const res: HeaderUpdate =
                        action === 'inject'
                            ? await this.enforceHeaderComments(absolutePath)
                            : await this.removeHeaderComments(absolutePath);

                    if (res.modified) summary.processed++;
                    else summary.skipped++;
                } catch (error) {
                    summary.failed++;
                    log.error(
                        `${this.BULLET.error} Exception encountered for ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            }),
        );

        return summary;
    }

    async execute(): Promise<void> {
        console.clear();
        intro(`${pc.bgYellow(pc.black(' HEADERCOMMENTS '))} ${pc.yellow(pc.dim('Scans and Synchronizes Headers'))}`);

        const operation = await select<HeaderAction>({
            message: pc.cyan('Pick an option:'),
            options: [
                { value: 'inject', label: 'Inject HeaderComments', hint: 'Append contextual tags' },
                { value: 'strip', label: 'Strip HeaderComments', hint: 'Scrub existing comment tags' },
                { value: 'exit', label: 'Exit menu context' },
            ],
        });

        if (isCancel(operation) || operation === 'exit') {
            cancel(pc.yellow(`${this.BULLET.success} Operation aborted. Project files left unmodified.`));
            return;
        }

        const shouldProceed = await confirm({
            message: `Verify and run structural updates across project root directory?\n${this.BULLET.arrowHead} (${pc.cyan(this.BASE_DIR)})`,
            initialValue: operation === 'inject',
        });

        if (isCancel(shouldProceed) || !shouldProceed) {
            cancel(pc.yellow(`${this.BULLET.success} Operation aborted. Project files left unmodified.`));
            return;
        }

        const s = spinner();
        s.start(pc.cyan('Evaluating active project workspaces and indexing targets...'));

        try {
            const metrics = await this.processBatch(operation);
            s.stop(pc.green('Header resolution sweep finished processing successfully!!!\n'));

            const labelText: string =
                this.BULLET.circle.green + (operation === 'inject' ? ' Processed:' : ' Stripped:');
            const hintText: string =
                this.BULLET.arrowHead +
                (operation === 'inject' ? ' Appended or confirmed targets' : ' Erased comment headers');

            const reportBody: string = [
                `${pc.bold(labelText)} ${pc.green(metrics.processed.toString().padStart(6))}   ${pc.dim(hintText)}`,
                `${pc.bold(this.BULLET.circle.white + ' Skipped: ')} ${pc.dim(metrics.skipped.toString().padStart(8))}   ${pc.dim(this.BULLET.arrowHead + ' Excluded folders & skips')}`,
                `${pc.bold(this.BULLET.circle.red + ' Failed:  ')} ${pc.red(metrics.failed.toString().padStart(9))}   ${pc.dim(this.BULLET.arrowHead + ' Hard drive read/write blocks')}`,
                pc.dim('----------------------------------------------------'),
                `${pc.bold(this.BULLET.circle.purple + ' TOTAL:   ')} ${pc.magenta(metrics.total.toString().padStart(10))}   ${pc.dim(this.BULLET.arrowHead + ' Aggregated project file count')}`,
            ].join('\n');

            note(reportBody, pc.cyan(`Execution Metrics Summary Window`));
            outro(this.config.theme.success('Project workspace synchronization matches verified state parameters.'));
        } catch (error: unknown) {
            s.stop(this.config.theme.error('A critical fatal failure crashed processing workflows.'));
            log.error(error instanceof Error ? error.message : String(error));
        }
    }
}

/**
 * STANDALONE EXECUTION ENGINE ENTRY POINT
 */
if (import.meta.main) {
    const config: Config = {
        theme: DarkTheme,
        exclude: [
            '**/*.{toml, json, jsonc, md, lock, css, svg, jpg, png, gif}',
            '.vscode/**',
            'node_modules/**',
            'logs/**',
            'dist/**',
            'coverage/**',
            '.OLD/**',
            'ALL/**',
            'ALL_REBUILT/**',
        ],
    } as const;

    const APP = new HeaderComments(config);

    APP.execute().catch((e: unknown): never => {
        if (e instanceof Error) {
            log.error(`Fatal crash: ${e.message}`);
        } else {
            console.log('An unexpected error occurred:', e);
        }
        process.exit(1);
    });
}
