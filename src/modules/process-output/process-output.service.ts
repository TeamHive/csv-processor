import * as fs from 'fs';
import { Service } from 'typedi';
import { TransformOutput } from './transform-output.interface';

@Service()
export class ProcessOutput {
    private filePath: string;
    private fileDescriptor: number;
    private transform: TransformOutput;

    constructor() { }

    initialize(outputPath: string, transform: TransformOutput): Promise<void> {
        this.transform = transform;
        this.filePath = outputPath;
        return new Promise((resolve, reject) => {
            fs.open(this.filePath, 'w', (err, fd) => {
                if (err) {
                    reject(err);
                } else {
                    this.fileDescriptor = fd;
                    resolve();
                }
            });
        });
    }

    /**
     * Adds the line for the given columns and corresponding values to the output sql file.
     */
    addLine(columns: string[], vals: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.write(this.fileDescriptor, this.transform.transformOutput(columns, vals), (err) => {
                err ? reject(err) : resolve();
            });
        });
    }

    /**
     * Should be called when no more data will be added to the output file.
     */
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.close(this.fileDescriptor, (err) => {
                err ? reject(err) : resolve();
            });
        });
    }

}
