export type Block = {
    heading: string;
    offset: number;
    body: Array<{ role: string, text: string }>;
}