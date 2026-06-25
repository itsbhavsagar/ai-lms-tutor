export type RagIndexState = {
  indexed: boolean;
  chunksCreated: number;
  pages: number;
};

export const defaultRagIndexState: RagIndexState = {
  indexed: false,
  chunksCreated: 0,
  pages: 0,
};
