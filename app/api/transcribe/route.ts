import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File;
    const originalName = audio?.name?.toLowerCase?.() || "";
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
    if (audio.size === 0) {
      return Response.json(
        { error: "Empty audio file. Please record a bit longer." },
        { status: 400 },
      );
    }

    const mimeToExt: Record<string, string> = {
      "audio/webm": "webm",
      "audio/webm;codecs=opus": "webm",
      "audio/mp4": "mp4",
      "audio/x-m4a": "m4a",
      "audio/m4a": "m4a",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/ogg": "ogg",
      "audio/ogg;codecs=opus": "ogg",
    };

    const isWebm =
      audio.type === "audio/webm" || audio.type === "audio/webm;codecs=opus";

    const extFromName = originalName.includes(".")
      ? originalName.split(".").pop()
      : "";
    const ext = isWebm ? "webm" : mimeToExt[audio.type] || extFromName || "webm";
    const filename = `recording.${ext}`;
    const normalizedType =
      isWebm || ext === "webm"
        ? "audio/webm"
        : ext === "mp4" || ext === "m4a"
          ? "audio/mp4"
          : ext === "wav"
            ? "audio/wav"
            : ext === "ogg"
              ? "audio/ogg"
              : audio.type || "audio/webm";

    // Recreate file with normalized content type — Groq is picky about this
    const correctedFile = new File([await audio.arrayBuffer()], filename, {
      type: normalizedType,
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
