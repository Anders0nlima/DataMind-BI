export type SSEEvent = 
  | { status: 'processing'; message: string }
  | { status: 'completed'; response: any }
  | { status: 'error'; message: string };

export async function sendChatQuerySSE(
  datasetPath: string,
  datasetSchema: any,
  question: string,
  onEvent: (event: SSEEvent) => void
) {
  // Using Fetch API to read the SSE stream instead of EventSource 
  // because we need to send a POST request with a JSON body.
  const response = await fetch("http://127.0.0.1:8000/api/analytics/chat/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset_path: datasetPath,
      dataset_schema: datasetSchema,
      question: question
    })
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to start AI conversation stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  
  let buffer = "";
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Split by newlines. The last element is either empty or a partial line.
    const lines = buffer.split('\n');
    buffer = lines.pop() || "";
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr) {
            const data = JSON.parse(dataStr) as SSEEvent;
            onEvent(data);
          }
        } catch (e) {
          console.error("Failed to parse SSE JSON line:", line, e);
        }
      }
    }
  }
}
