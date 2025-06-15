let bubble, chatBox;
let timer;

function createChatBubble() {
  bubble = document.createElement("div");
  bubble.id = "chat-bubble";
  bubble.innerText = "💬";
  document.body.appendChild(bubble);
  bubble.addEventListener("click", expandChat);
}

let openaiKey = localStorage.getItem("openai_key");
if (!openaiKey) {
  openaiKey = prompt("Enter your OpenAI API Key:");
  if (openaiKey) localStorage.setItem("openai_key", openaiKey);
}

function expandChat() {
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

  // Delay attaching the event to make sure DOM is ready
  setTimeout(() => {
    const askBtn = chatBox.querySelector("#ask-btn");
    const input = chatBox.querySelector("#user-input");
    const responseDiv = chatBox.querySelector("#response");

    askBtn.addEventListener("click", async () => {
      const question = input.value.trim();
      if (!question) return;

      responseDiv.innerText = "Thinking...";

      try {
        const pageText = document.body.innerText.slice(0, 5000);

        const res = await fetch("http://localhost:8000/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, context: pageText, openai_key: openaiKey })
        });

        const data = await res.json();
        const answer = data?.answer?.trim() || "Sorry, no answer returned.";
        console.log("[RAG Answer]", answer);
        responseDiv.innerText = answer;
      } catch (err) {
        responseDiv.innerText = "Error: " + err.message;
        console.error("Fetch failed", err);
      }
    });
  }, 100);

  bubble.style.display = "none";
  resetTimer();
}

function collapseChat() {
  if (chatBox) {
    chatBox.remove();
    chatBox = null;
    bubble.style.display = "block";
  }
}

function resetTimer() {
  clearTimeout(timer);
  timer = setTimeout(collapseChat, 30000); // 30s idle
}

createChatBubble();
