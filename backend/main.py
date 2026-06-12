import os
import uuid
import html
import fitz

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI(title="PDF Converter API")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def pdf_to_markdown(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    parts = ["# PDF Converted Content\n"]

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        parts.append(f"\n## Page {page_num}\n")
        if text:
            lines = normalize_lines(text)
            parts.extend(lines)
        else:
            parts.append("_No text found on this page._")

    doc.close()
    return "\n\n".join(parts)


def pdf_to_html(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    html_parts = [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        '<meta charset="UTF-8" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        "<title>Converted PDF</title>",
        "<style>",
        "body { font-family: Arial, Helvetica, sans-serif; max-width: 960px; margin: 0 auto; padding: 32px 20px; line-height: 1.7; color: #1f2937; }",
        "h1, h2 { color: #111827; }",
        "section { margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }",
        "p { margin: 0 0 12px; }",
        "</style>",
        "</head>",
        "<body>",
        "<h1>PDF Converted Content</h1>",
    ]

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        html_parts.append("<section>")
        html_parts.append(f"<h2>Page {page_num}</h2>")
        if text:
            paragraphs = normalize_lines(text)
            for p in paragraphs:
                html_parts.append(f"<p>{html.escape(p)}</p>")
        else:
            html_parts.append("<p><em>No text found on this page.</em></p>")
        html_parts.append("</section>")

    html_parts.append("</body>")
    html_parts.append("</html>")

    doc.close()
    return "\n".join(html_parts)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/convert")
async def convert_pdf(file: UploadFile = File(...), format: str = Form(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    if format not in {"markdown", "html"}:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'markdown' or 'html'.")

    unique_name = f"{uuid.uuid4()}.pdf"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    try:
        content = pdf_to_markdown(file_path) if format == "markdown" else pdf_to_html(file_path)
        return JSONResponse(
            {
                "filename": file.filename,
                "format": format,
                "content": content,
            }
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)
