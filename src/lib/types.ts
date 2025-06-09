export type Block = {
    heading: string;
    timestamp: string;
    body: Array<{ name: string, role: string, text: string }>;
}