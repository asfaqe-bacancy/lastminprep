/**
 * Reads a newline-delimited JSON stream.
 *
 * Used by the coach and the quiz: the server sends one JSON object per line,
 * so sources can arrive before the answer text without waiting for the whole
 * response.
 */
export async function* readNdjson<T>(
  response: Response,
): AsyncGenerator<T> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as T;
      newline = buffer.indexOf("\n");
    }
  }

  const rest = buffer.trim();
  if (rest) yield JSON.parse(rest) as T;
}
