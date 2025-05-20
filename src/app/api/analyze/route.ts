import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import fs from "fs/promises";
import path from "path";
import Mustache from "mustache";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) {
    return new Response("YouTube URL is required", { status: 400 });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url, {
      lang: "ar",
    });

    const instructions = await fs.readFile(
      path.join(process.cwd(), "prompts", "instructions.md"),
      "utf8"
    );

    const model = "gemini-2.5-flash-preview-04-17";
    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["heading", "offset", "body"],
          properties: {
            heading: { type: Type.STRING },
            offset: { type: Type.STRING },
            body: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["role", "text"],
                properties: {
                  role: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
              },
            },
          },
          propertyOrdering: ["heading", "offset", "body"],
        },
      },
      systemInstruction: [
        {
          text: instructions,
        },
      ],
    };
    const contents = [
      {
        role: "user",
        parts: [{ text: transcript.map((t) => `[${t.offset}] ${t.text}`).join("\n") }],
      },
    ];

    const stream = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    const encoder = new TextEncoder();
    const streamBody = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk.text));
        }
        controller.close();
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Transcript fetch or AI generation failed:", err);
    return new Response("Failed to fetch transcript or analyze.", {
      status: 500,
    });
  }
}
