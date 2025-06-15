from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.chat_models import ChatOpenAI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str
    context: str
    openai_key: str  # 👈 New field for dynamic key input

@app.post("/ask")
async def ask(req: AskRequest):
    if not req.openai_key:
        raise HTTPException(status_code=400, detail="OpenAI API key is required")

    prompt_template = """You are a helpful assistant. Use the following webpage content to answer the question.

Webpage content:
{context}

Question: {question}
Answer:"""

    prompt = PromptTemplate(
        input_variables=["context", "question"],
        template=prompt_template
    )

    # Inject API key dynamically
    llm = ChatOpenAI(model="gpt-3.5-turbo", openai_api_key=req.openai_key)
    chain = LLMChain(llm=llm, prompt=prompt)

    try:
        result = chain.run(context=req.context, question=req.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    return {"answer": result}
