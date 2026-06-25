import { useMutation } from "@tanstack/react-query";
import { transcribeRecording } from "@/lib/api/chat";

export function useTranscribeMutation() {
  return useMutation({
    mutationFn: (blob: Blob) => transcribeRecording(blob),
    meta: { errorMessage: "Transcription failed" },
  });
}
