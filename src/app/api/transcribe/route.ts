import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) {
    return new Response("YouTube URL is required", { status: 400 });
  }

  try {
    const instructions = await fs.readFile(
      path.join(process.cwd(), "prompts", "transcripting.md"),
      "utf8"
    );

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-05-20",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["heading", "timestamp", "body"],
            properties: {
              heading: {
                type: Type.STRING,
              },
              timestamp: {
                type: Type.STRING,
              },
              body: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["name", "role", "text"],
                  properties: {
                    name: {
                      type: Type.STRING,
                    },
                    role: {
                      type: Type.STRING,
                    },
                    text: {
                      type: Type.STRING,
                    },
                  },
                },
              },
            },
            propertyOrdering: ["heading", "timestamp", "body"],
          },
        },
        systemInstruction: [
          {
            text: instructions,
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: url,
                mimeType: "video/*",
              },
            },
          ],
        },
      ]
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked"
      },
    });
  } catch (err) {
    console.error("Transcript fetch or AI generation failed:", err);
    return new Response("Failed to fetch transcript or analyze.", {
      status: 500,
    });
  }
}
