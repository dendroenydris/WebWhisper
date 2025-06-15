
document.getElementById("ask-btn").addEventListener("click", async () => {
  const input = document.getElementById("user-input").value;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result: pageContent }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText.slice(0, 5000)  // sample extract
  });

  const responseDiv = document.getElementById("response");
  responseDiv.innerText = "Loading...";

  const res = await fetch("http://localhost:8000/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: input,
      context: pageContent
    })
  });

  const data = await res.json();
  responseDiv.innerText = data.answer || "No answer.";
});
