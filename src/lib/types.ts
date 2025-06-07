export type Block = {
    heading: string;
    timestamp: number;
    body: Array<{ name: string, role: string, text: string }>;
}