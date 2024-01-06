import fs from 'fs';
import { fileURLToPath } from 'url';
import path,  { dirname } from 'path';
import showdown from 'showdown';
import config from '../citrus-pulp-config.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '../');



class CitrusPulp {
    #config;
    #converter;
    #files = new Set();
    #filesConverted = 0;
    #HTMLPreamble = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Static Site</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>`;
    #HTMLPostamble = `</body></html>`;

    constructor() {
        this.#config = config;
        this.#converter = new showdown.Converter({
            backslashEscapesHTMLTags: true,
            excludeTrailingPunctuationFromURLs: true,
            noHeaderId: true,
            // metadata: true,
            parseImgDimensions: true,
            tables: true,
            tasklists: true,
            underline: true,
        });
    }

    get config() {
        return this.#config;
    }

    get files() {
        return this.#files;
    }

    get filesConverted() {
        return this.#filesConverted;
    }
    set filesConverted(value) {
        this.#filesConverted = value;
    }

    #addFileNamesToSet(fileNames) {
        this.files.add(...fileNames);
    }

    #getAllMarkdownFileNames() {
        return new Promise((resolve, reject) => {
            // Read the directory
            fs.readdir(this.config.markdownDir, (err, files) => {
                if (err) {
                    console.error('Error reading Markdown files:', err);
                    reject(err);
                }

                // Filter out non-markdown files
                const markdownFiles = files.filter(file => file.endsWith('.md'));
                
                this.#addFileNamesToSet(markdownFiles);
                resolve();
            });
        });
    }

    #markdownIterator(fileNames, mdDir, callback) {
        fileNames.forEach(fileName => {
            fs.readFile(path.join(rootDir,mdDir,fileName), 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading Markdown file:', err);
                    throw err;
                }
                callback(data, fileName);
            });
        });
    }

    #WriteHTMLFilesToDisk(htmlContent, file) {
        const outputDirPath = path.join(rootDir, this.config.outputDir);

        // Create the output directory if it doesn't exist
        if (!fs.existsSync(outputDirPath)) {
            fs.mkdirSync(outputDirPath, { recursive: true });
        }

        const htmlFileName = file ? file.replace('.md','.html') : 'index.html';

        const fileContent = this.#HTMLPreamble + htmlContent + this.#HTMLPostamble;

        fs.writeFile(path.join(outputDirPath, htmlFileName), fileContent, (err) => {
            if (err) {
                console.error('Error writing HTML file:', err);
                throw err;
            }
        });
    }

    #iterateOverMarkdownFiles = async () => {
        try {
            await new Promise((resolve, reject) => {
                this.#markdownIterator(Array.from(this.files), this.config.markdownDir, (markdown, fileName) => {
                    const html = this.#converter.makeHtml(markdown);
                    this.#WriteHTMLFilesToDisk(html, fileName);
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

    

    async init() {
        await this.#getAllMarkdownFileNames();
        await this.#iterateOverMarkdownFiles();
    }
}


export default new CitrusPulp();