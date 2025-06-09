export type Block = {
    heading: string;
    timestamp: string;
    body: Array<{ name: string, role: string, text: string }>;
}

export type TranscribeResponse = {
    transcription: Block[];
}

export type SummarizeResponse = {
    summary: string;
}