import * as fs from 'fs';
import { Service } from 'typedi';
import { NextStringResult } from './next-string-result.interface';
import { TransformInput } from './transform-input.interface';
import { ProcessOutput } from '../process-output';

@Service()
export class ProcessInput {
    private columns: string[];

    constructor(
        private readonly output: ProcessOutput,
    ) { }

    /**
     * Reads in the CSV file given to the constructor and calls addLine on
     * the given FileOutput for each processed line.
     * By default, new lines in double quotes are not considered a new line for processing.
     * If strings are wrapped in single quotes, use pass in true for the useSingleQuotes parameter.
     */
    processFile(inputPath: string, transform?: TransformInput, useSingleQuotes?: boolean): Promise<void> {
        this.columns = [];
        return new Promise((resolve, reject) => {
            fs.readFile(inputPath, 'UTF8', async (err, str) => {
                if (err) {
                    reject(err);
                } else {
                    let line = this.getNextString(str, 0, '\n', useSingleQuotes);
                    this.processHeaders(line.nextString);
                    let i = line.index + 1;
                    while (!line.done) {
                        line = this.getNextString(str, i, '\n', useSingleQuotes);
                        i = line.index + 1;
                        const vals: string[] = [];
                        this.processLine(vals, line.nextString, 0);
                        if (vals.length > 0) {
                            try {
                                const transformedInput = transform ?
                                    transform.transformInput(this.columns, vals) :
                                    {
                                        columns: this.columns,
                                        vals
                                    };
                                await this.output.addLine(transformedInput.columns, transformedInput.vals);
                            }
                            catch (error) {
                                reject(error);
                            }
                        }
                    }
                    resolve();
                }
            });
        });

    }

    /**
     * Processes the line containing the headers to populate this.columns
     * @param line The line containing the headers
     */
    private processHeaders(line: string, useSingleQuotes?: boolean) {
        let i = 0;
        while (i < line.length) {
            const header = this.getNextString(line, i, ',', useSingleQuotes);
            this.columns.push(header.nextString);
            i = header.index + 1;
        }
    }

    /**
     * Fills the vals array with the individual values on the line
     * @param vals String array that will be filled
     * @param line line to process
     * @param index index at which to start processing
     */
    private processLine(vals: string[], line: string, index: number, useSingleQuotes?: boolean) {
        let i = index;
        while (vals.length < this.columns.length && i >= 0) {
            const val = this.getNextString(line, i, ',', useSingleQuotes);
            vals.push(val.nextString);
            i = val.index;
            i++;
        }
    }

    /**
     * Gets the next string after the index stopping at the given delimeter.
     * Delimiters within double quotes will not be recognized as a delimiter.
     * Default quotes are double quotes.  Single quotes can be enabled with
     * useSingleQuotes parameter
     */
    getNextString(line: string, index: number, delimiter: string, useSingleQuotes?: boolean): NextStringResult {
        let i = index;
        let nextString = '';
        let matchedQuoted = true;
        while (i < line.length) {
            const c = line.charAt(i);
            let isQuote;
            if (useSingleQuotes) {
                isQuote = (c === '\'');
            }
            else {
                isQuote = (c === '"');
            }
            if (isQuote) {
                matchedQuoted = !matchedQuoted;
                nextString += c;
            } else if (c === delimiter) {
                if (matchedQuoted) {
                    return {
                        done: false,
                        index: i,
                        nextString,
                    };
                }
                else {
                    nextString += c;
                }
            } else {
                nextString += c;
            }
            i++;
        }
        return {
            done: true,
            index: i,
            nextString,
        };
    }
}
