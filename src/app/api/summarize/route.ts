import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SummarizeResponse } from "@/lib/types";

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
      path.join(process.cwd(), "prompts", "summarize.md"),
      "utf8"
    );

    const model = "gemini-2.5-flash-preview-05-20";

    const response = await ai.models.generateContent({
      model,
      config: {
        responseMimeType: "text/plain",
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

    if ( response.text === undefined ) {
      return new Response("Failed to generate summary", {
        status: 500,
      });
    }

    return NextResponse.json<SummarizeResponse>({
      summary: response.text
    });
  } catch (err) {
    console.error("Transcript fetch or AI generation failed:", err);
    return new Response("Failed to fetch transcript or analyze.", {
      status: 500,
    });
  }
}
