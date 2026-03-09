import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    console.log(
      "Audio type:",
      audio.type,
      "Size:",
      audio.size,
      "Name:",
      audio.name,
    );

    if (!audio) {
      return Response.json({ error: "No audio file" }, { status: 400 });
    }

    // Normalize mime type / extension for Groq Whisper
    const mimeToExt: Record<string, string> = {
      "audio/webm": "webm",
      "audio/webm;codecs=opus": "webm",
      "audio/mp4": "mp4",
      "audio/wav": "wav",
      "audio/ogg": "ogg",
    };

    const isWebm =
      audio.type === "audio/webm" || audio.type === "audio/webm;codecs=opus";

    const ext = isWebm ? "webm" : mimeToExt[audio.type] || "webm";
    const filename = `recording.${ext}`;

    // Recreate file with normalized content type — Groq is picky about this
    const correctedFile = new File([await audio.arrayBuffer()], filename, {
      type: isWebm ? "audio/webm" : audio.type || "audio/webm",
    });

    const transcription = await groq.audio.transcriptions.create({
      file: correctedFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: "en",
    });

    return Response.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
