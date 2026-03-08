// File Manager - error.ts

export function getApiError(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    
    if (response?.data?.detail) {
      return String(response.data.detail);
    }
  }
  if (err instanceof Error) return err.message;

  return "Something went wrong";
}
