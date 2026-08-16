export type HermesArtifact = {
  id: number;
  kind: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  tags: string[];
  metadata: Record<string, unknown>;
  generatedAt: string;
};

export type HermesEvent = {
  id: number;
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  source: string;
  occurredAt: string;
};

export type HermesReport = {
  id: number;
  type: string;
  title: string;
  generatedAt: string;
  source: string;
  tags: string[];
  summary: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  sourceLinks: string[];
};
