import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { TranscribeResponse } from "@/lib/types";

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

    const response = await ai.models.generateContent({
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

    return NextResponse.json<TranscribeResponse>({
      transcription: JSON.parse(response.text as string) as TranscribeResponse["transcription"]
    });
  } catch (err) {
    console.error("Transcript fetch or AI generation failed:", err);
    return new Response("Failed to fetch transcript or analyze.", {
      status: 500,
    });
  }
}
