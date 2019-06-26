export interface TransformInput {
    transformInput(columns: string[], vals: string[]): { columns: string[], vals: string[] };
}
