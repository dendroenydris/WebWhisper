let bubble: HTMLDivElement | null = null;
let chatBox: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout>;

// Initialize chat bubble
function createChatBubble(): void {
  bubble = document.createElement("div");
  bubble.id = "chat-bubble";
  bubble.innerText = "💬";
  document.body.appendChild(bubble);
  bubble.addEventListener("click", expandChat);
}

// Retrieve or prompt for OpenAI key
let openaiKey: string | null = localStorage.getItem("openai_key");
if (!openaiKey) {
  openaiKey = prompt("Enter your OpenAI API Key:");
  if (openaiKey) localStorage.setItem("openai_key", openaiKey);
}

// Expand the chat interface
function expandChat(): void {
  if (chatBox) return;

  chatBox = document.createElement("div");
  chatBox.id = "chat-box";
  chatBox.innerHTML = `
    <div id="rag-ui">
      <textarea id="user-input" placeholder="Ask something..." style="width:100%; height:60px;"></textarea>
      <button id="ask-btn">Ask</button>
      <div id="response">Hi, how can I help?</div>
    </div>
  `;
  document.body.appendChild(chatBox);

  // Wait for DOM insertion
  setTimeout(() => {
    const askBtn = chatBox!.querySelector<HTMLButtonElement>("#ask-btn");
    const input = chatBox!.querySelector<HTMLTextAreaElement>("#user-input");
    const responseDiv = chatBox!.querySelector<HTMLDivElement>("#response");

    if (!askBtn || !input || !responseDiv) return;

    askBtn.addEventListener("click", async () => {
      const question = input.value.trim();
      if (!question || !openaiKey) return;

      responseDiv.innerText = "Thinking...";

      try {
        const pageText = document.body.innerText.slice(0, 5000);

        const res = await fetch("http://localhost:8000/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            context: pageText,
            openai_key: openaiKey
          })
        });

        const data = await res.json();
        const answer = (data?.answer?.trim() as string) || "Sorry, no answer returned.";
        console.log("[RAG Answer]", answer);
        responseDiv.innerText = answer;
      } catch (err: any) {
        responseDiv.innerText = "Error: " + err.message;
        console.error("Fetch failed", err);
      }
    });
  }, 100);

  if (bubble) bubble.style.display = "none";
  resetTimer();
}

// Collapse chat after idle or close
function collapseChat(): void {
  if (chatBox) {
    chatBox.remove();
    chatBox = null;
    if (bubble) bubble.style.display = "block";
  }
}

// Idle timer logic
function resetTimer(): void {
  clearTimeout(timer);
  timer = setTimeout(collapseChat, 30000); // 30s idle timeout
}

// Initialize
createChatBubble();
