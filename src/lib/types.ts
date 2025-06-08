export type Block = {
    heading: string;
    timestamp: number;
    body: Array<{ name: string, role: string, text: string }>;
}

export type TranscribeResponse = {
    transcription: Block[];
    cost: number;
}