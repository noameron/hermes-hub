export class HermesAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HermesAuthError";
  }
}

export function requireHermesToken(request: Request) {
  const expected = process.env.HERMES_INGEST_TOKEN;

  if (!expected) {
    throw new HermesAuthError("Server misconfigured: HERMES_INGEST_TOKEN is missing.");
  }

  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new HermesAuthError("Missing Bearer token.");
  }

  const supplied = header.slice("Bearer ".length).trim();

  if (supplied !== expected) {
    throw new HermesAuthError("Invalid Bearer token.");
  }
}
