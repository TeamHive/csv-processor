# @teamhive/csv-processor
[![npm version](https://badge.fury.io/js/%40teamhive%2Fcsv-processor.svg)](https://badge.fury.io/js/%40teamhive%2Fcsv-processor)

`csv-processor` is a package that simplifies reading and transforming CSV data into other formats through TypeDI services.
The typical usecase for the package would be converting a CSV file into individual SQL insert statements.
This package handles all of the file I/O as well as recognizing line breaks within single or double quote 

### Usage
To install the package, run:
```sh
npm i @teamhive/csv-processor
```

The package itself defines two main export `ProcessInput` and `ProcessOutput`.  Both classes are 
typedi services and should be constructed as typedi dependencies.

#### ProcessOuput
This service opens up a file to write to and line-by-line writes the input provided by the `addLine(columns: string[], values: string[])` function.  To open up the output file, call 

```Typescript
processOutput.initialize(filePath: string, transform: TransformInput)
```

This will open the file and wait for calls to `addLine()`.

Once all lines have been written to the output, `close()` should be called.

#### TransformOutput
`TransformOuput` is an interface for creating a transform that converts the input of `addLine` into a string that will be printed to the output file.
```Typescript
export interface TransformOutput {
    transformOutput(columns: string[], vals: string[]): string;
}
```

When using `ProcessOutput`, an implementation of `TransformOutput` must be passed to the initialize function. A transform is required for output since the arrays must be formatted as a string.

#### ProcessInput
`ProcessInput` is a TypeDi service that reads in a csv file and passses the read input to a `ProcessOutput` instance.  TypeDi handles the injection of contructed `ProcessOuput` instance.

To use `ProcessInput`, simply call the `processFile(filePath: string, transform?: TransformInput, useSingleQuotes: boolean)` function on an instance of ProcessInput. For input, the transform is not necessary.  If `useSingleQuotes` is true, new lines and commas within matched single quotes will not be used as delimeters.  Otherwise, it uses double quotes as a delimeter.

#### TransformInput
`TransformInput` is an interface for creating a transform that converts the read input from the csv file before it is passed to `addLine`.
```Typescript
export interface TransformOutput {
    transformOutput(columns: string[], vals: string[]): string;
}
```

#### Example

```Typescript
export class AppService {

    constructor(
        private readonly errorHandler: ErrorHandler,
        private readonly processOutput: ProcessOutput,
        private readonly processInput: ProcessInput,
        private readonly transformInput: TransformAddDescriptionHtml,
        private readonly transformOuput: TransformWrapLink
    ) { }

    async run() {
        try {
            const startTime = Date.now();
            this.errorHandler.captureBreadcrumb({ message: 'Running TypeDi Seed...' });

            const inputPath = path.join(__dirname, '../../', config.get<string>('path.input'));
            const outputPath = path.join(__dirname, '../../', config.get<string>('path.output'));
            await this.processOutput.initialize(outputPath, this.transformOuput);
            await this.processInput.processFile(inputPath, this.transformInput);
            await this.processOutput.close();

            this.errorHandler.captureBreadcrumb({ message: `Finished TypeDi seeds in ${Date.now() - startTime} ms` });
            this.exit();
        }
        catch (error) {
            // await to guarantee the error gets captured before the process exits
            await this.errorHandler.captureException(error);
            this.exit();
        }
    }

    private exit(): void {
        // any preexit tasks

        process.exit();
    }
}
```

### Distribution
```
npm pack
npm version (major|minor|patch)
npm publish
```

_Note: This will also automatically push changes and tags post-publish_
