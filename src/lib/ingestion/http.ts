import { NextResponse } from "next/server";

export function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status },
  );
}

export function getRequiredHeader(request: Request, headerName: string) {
  const value = request.headers.get(headerName)?.trim();

  if (!value) {
    throw new Error(`Missing required header: ${headerName}`);
  }

  return value;
}
