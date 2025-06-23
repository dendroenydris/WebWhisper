from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_community.chat_models import ChatOpenAI
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document

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
    openai_key: str


@app.post("/ask")
async def ask(req: AskRequest):
    if not req.openai_key:
        raise HTTPException(
            status_code=400, detail="OpenAI API key is required")

    try:
        # Step 1: Split context into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500, chunk_overlap=100)
        docs = [Document(page_content=chunk)
                for chunk in splitter.split_text(req.context)]

        # Step 2: Embed and store in FAISS
        embeddings = OpenAIEmbeddings(openai_api_key=req.openai_key)
        vectorstore = FAISS.from_documents(docs, embedding=embeddings)

        # Step 3: Retrieve top relevant chunks
        retrieved_docs = vectorstore.similarity_search(req.question, k=4)
        retrieved_context = "\n\n".join(
            [doc.page_content for doc in retrieved_docs])

        # Step 4: Prompt + LLMChain
        prompt_template = """You are a helpful assistant. Use the following retrieved webpage chunks to answer the question accurately and concisely.

Retrieved Context:
{context}

Question: {question}
Answer:"""

        prompt = PromptTemplate(
            input_variables=["context", "question"], template=prompt_template)
        llm = ChatOpenAI(model="gpt-3.5-turbo", openai_api_key=req.openai_key)
        chain = LLMChain(llm=llm, prompt=prompt)

        answer = chain.run(context=retrieved_context, question=req.question)
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {e}")
