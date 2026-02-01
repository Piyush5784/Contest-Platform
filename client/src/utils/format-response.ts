export function formatErrorCode(errorCode: any) {
  return errorCode
    .split("_")
    .map(
      (word: string) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function getErrorMessage(errorCode: string): string {
  const customMessages: Record<string, string> = {
    "INVALID PROVIDER": "Please login with Google",
  };

  return customMessages[errorCode] || formatErrorCode(errorCode);
}

export function ReturnError(err: any) {
  return getErrorMessage(err.response.data.error);
}
