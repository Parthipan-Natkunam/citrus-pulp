import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import showdown from 'showdown';
import config from '../citrus-pulp-config.js';
import { CitrusPulpConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '../../');

class CitrusPulp {
    private config: CitrusPulpConfig;
    private converter: showdown.Converter;
    private files: Set<string>;
    private filesConverted: number;
    private readonly HTMLPreamble: string = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Static Site</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>`;
    private readonly HTMLPostamble: string = `</body></html>`;

    constructor() {
        this.config = config;
        this.converter = new showdown.Converter({
            backslashEscapesHTMLTags: true,
            excludeTrailingPunctuationFromURLs: true,
            noHeaderId: true,
            parseImgDimensions: true,
            tables: true,
            tasklists: true,
            underline: true,
        });
        this.files = new Set<string>();
        this.filesConverted = 0;
    }

    getConfig(): CitrusPulpConfig {
        return this.config;
    }

    getFiles(): Set<string> {
        return this.files;
    }

    getFilesConverted(): number {
        return this.filesConverted;
    }

    setFilesConverted(value: number): void {
        this.filesConverted = value;
    }

    private addFileNamesToSet(fileNames: string[]): void {
        fileNames.forEach(fileName => this.files.add(fileName));
    }

    private getAllMarkdownFileNames(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.readdir(path.join(rootDir, this.config.markdownDir), (err, files) => {
                if (err) {
                    console.error('Error reading Markdown files:', err);
                    reject(err);
                    return;
                }

                const markdownFiles = files.filter(file => file.endsWith('.md'));
                this.addFileNamesToSet(markdownFiles);
                resolve();
            });
        });
    }

    private markdownIterator(fileNames: string[], mdDir: string, callback: (data: string, fileName: string) => void): void {
        fileNames.forEach(fileName => {
            fs.readFile(path.join(rootDir, mdDir, fileName), 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading Markdown file:', err);
                    throw err;
                }
                callback(data, fileName);
            });
        });
    }

    private writeHTMLFilesToDisk(htmlContent: string, file?: string): void {
        const outputDirPath = path.join(rootDir, this.config.outputDir);

        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
        }

        const htmlFileName = file ? file.replace('.md', '.html') : 'index.html';
        const fileContent = this.HTMLPreamble + htmlContent + this.HTMLPostamble;

        fs.writeFile(path.join(outputDirPath, htmlFileName), fileContent, (err) => {
            if (err) {
                console.error('Error writing HTML file:', err);
                throw err;
            }
        });
    }

    private async iterateOverMarkdownFiles(): Promise<void> {
        try {
            await new Promise<void>((resolve, reject) => {
                this.markdownIterator(Array.from(this.files), this.config.markdownDir, (markdown, fileName) => {
                    const html = this.converter.makeHtml(markdown);
                    this.writeHTMLFilesToDisk(html, fileName);
                    this.filesConverted++;
                    if (this.filesConverted === this.files.size) {
                        resolve();
                    }
                });
            });
        } catch (err) {
            console.error('Error reading Markdown files:', err);
        }
    }

    async init(): Promise<void> {
        await this.getAllMarkdownFileNames();
        await this.iterateOverMarkdownFiles();
    }
}

export default new CitrusPulp(); 