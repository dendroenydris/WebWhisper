document.getElementById("ask-btn")?.addEventListener("click", async () => {
  const inputEl = document.getElementById(
    "user-input"
  ) as HTMLTextAreaElement | null;
  const responseDiv = document.getElementById(
    "response"
  ) as HTMLDivElement | null;

  if (!inputEl || !responseDiv) return;

  const question = inputEl.value.trim();
  if (!question) return;

  responseDiv.innerText = "Loading...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.id) throw new Error("Tab ID not found.");
    async function executeAndGet<T>(tabId: number, func: () => T): Promise<T> {
      const [res] = (await chrome.scripting.executeScript({
        target: { tabId },
        func,
      })) as { result: T }[];
      return res.result;
    }

    const pageContent = await executeAndGet(tab.id!, () =>
      document.body.innerText.slice(0, 5000)
    );

    const res = await fetch("http://localhost:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context: pageContent,
        openai_key: localStorage.getItem("openai_key"),
      }),
    });

    const data = await res.json();
    responseDiv.innerText = data.answer?.trim() || "No answer.";
  } catch (error: any) {
    responseDiv.innerText = `Error: ${error.message}`;
    console.error("Fetch or tab query failed", error);
  }
});
