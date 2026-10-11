import { Glob, write } from 'bun';
import { join } from 'path';

const TARGET_DIR = './ALL';
const OUTPUT_FILE = 'output.json';

interface OutputStructure {
    files: Record<string, string[]>;
    categories: Record<string, string>;
    emptyDirectories: string[];
}

const result: OutputStructure = {
    files: {
        '1_SOURCE_FILES.txt': [],
        '2_WEB_FILES.txt': [],
        '3_STYLE_FILES.txt': [],
        '5_CONFIG_FILES.txt': [],
        '8_CSPELL_FILES.txt': [],
        '9_MISC_FILES.txt': [],
    },
    categories: {
        '1_SOURCE_FILES.txt': 'source',
        '2_WEB_FILES.txt': 'web',
        '3_STYLE_FILES.txt': 'style',
        '5_CONFIG_FILES.txt': 'configuration',
        '8_CSPELL_FILES.txt': 'cspell',
        '9_MISC_FILES.txt': 'misc',
    },
    emptyDirectories: ['src/assets'],
};

function getCategoryKey(path: string): string {
    const lowerPath = path.toLowerCase();
    if (lowerPath.includes('cspell')) return '8_CSPELL_FILES.txt';
    if (lowerPath.endsWith('.html') || lowerPath.endsWith('.htm')) return '2_WEB_FILES.txt';
    if (lowerPath.endsWith('.css')) return '3_STYLE_FILES.txt';
    if (lowerPath.endsWith('json') || lowerPath.endsWith('.editorconfig') || lowerPath.endsWith('.gitignore')) {
        return '5_CONFIG_FILES.txt';
    }
    if (lowerPath.includes('config.ts') || lowerPath.includes('constants/')) {
        return '9_MISC_FILES.txt';
    }
    if (lowerPath.endsWith('.ts') || lowerPath.endsWith('.js')) {
        return '1_SOURCE_FILES.txt';
    }
    return '9_MISC_FILES.txt';
}

async function parse() {
    try {
        // Instantiate Bun's Glob match parser to locate *.txt files
        const glob = new Glob('*.txt');
        let fileCount = 0;

        // Scan inside the target folder synchronously or asynchronously
        for await (const filename of glob.scan({ cwd: TARGET_DIR })) {
            fileCount++;
            const fullPath = join(TARGET_DIR, filename);
            const text = await Bun.file(fullPath).text();

            const blockRegex = /\/\/■+.*-<  ?START  ?>-■+[\s(\S)]*?\/\/■+.*-<  ?START  ?>-■+/g;
            const pathRegex = /\/\/\s*PATH\s*:\s*(.*)/;
            const blocks = text.match(blockRegex) ?? [];

            for (const block of blocks) {
                const pathMatch = block.match(pathRegex);
                if (pathMatch?.[1]) {
                    const filePath = pathMatch[1].trim();
                    const category = getCategoryKey(filePath);

                    if (!result.files[category].includes(filePath)) {
                        result.files[category].push(filePath);
                    }
                }
            }
        }

        if (fileCount === 0) {
            console.warn(` ⚠️ No text files were found matching *.txt inside '${TARGET_DIR}'`);
        }

        // Sort arrays alphabetically for neat output structures
        for (const key in result.files) {
            result.files[key].sort();
        }

        await write(OUTPUT_FILE, JSON.stringify(result, null, 2));
        console.log(` ✅ Successfully compiled path logs from ${fileCount} files into: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error(' ❌ Error evaluating project directory assets:', error);
    }
}

await parse();
