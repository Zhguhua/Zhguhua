"use client";

import { useMemo, useState } from "react";

type OutputFormat = "markdown" | "html";

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("markdown");
  const [result, setResult] = useState("");
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const outputFilename = useMemo(() => {
    if (!filename) return format === "markdown" ? "converted.md" : "converted.html";
    const base = filename.replace(/\.pdf$/i, "");
    return format === "markdown" ? `${base}.md` : `${base}.html`;
  }, [filename, format]);

  const handleUpload = async () => {
    if (!file) {
      setError("请先选择一个 PDF 文件。");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format);

    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("http://localhost:8000/convert", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "转换失败");
      }

      setResult(data.content);
      setFilename(data.filename || file.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "上传或转换失败";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadTextFile(
      outputFilename,
      result,
      format === "markdown" ? "text/markdown;charset=utf-8" : "text/html;charset=utf-8"
    );
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    alert("内容已复制到剪贴板");
  };

  return (
    <main className="page">
      <div className="container">
        <section className="hero">
          <div className="badge">PDF Upload · Markdown / HTML Export</div>
          <h1>PDF 文档转换工作台</h1>
          <p>
            上传 PDF，自动提取内容并导出为 Markdown 或 HTML。这个版本包含更正式的界面、结果预览、复制功能和文件下载功能，适合作为 MVP 演示与后续扩展基础。
          </p>
        </section>

        <section className="grid">
          <div className="card panel">
            <h2>上传与配置</h2>
            <div className="subtext">
              先选择一个 PDF 文件，然后选择你希望输出的格式。当前版本适合文本型 PDF，后续可继续升级 OCR 与复杂排版解析能力。
            </div>

            <div className="dropzone">
              <div><strong>选择 PDF 文件</strong></div>
              <div style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
                支持单文件上传，建议先用文本型 PDF 体验效果
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null;
                  setFile(selected);
                  setFilename(selected?.name || "");
                  setError("");
                }}
              />
            </div>

            {file && (
              <div className="fileMeta">
                文件：{file.name}
                <br />
                大小：{formatBytes(file.size)}
              </div>
            )}

            <div className="sectionTitle">输出格式</div>
            <div className="toggleRow">
              <button
                type="button"
                className={`toggle ${format === "markdown" ? "active" : ""}`}
                onClick={() => setFormat("markdown")}
              >
                <div className="toggleTitle">Markdown</div>
                <div className="toggleDesc">适合知识库、文档系统、二次编辑与 AI 输入。</div>
              </button>

              <button
                type="button"
                className={`toggle ${format === "html" ? "active" : ""}`}
                onClick={() => setFormat("html")}
              >
                <div className="toggleTitle">HTML</div>
                <div className="toggleDesc">适合网页展示、内容嵌入和浏览器直接预览。</div>
              </button>
            </div>

            <div className="actions">
              <button className="primaryBtn" onClick={handleUpload} disabled={loading}>
                {loading ? "转换中..." : "开始转换"}
              </button>
              <button
                className="secondaryBtn"
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult("");
                  setFilename("");
                  setError("");
                }}
              >
                重置
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 16, color: "#b91c1c", fontSize: 14 }}>
                {error}
              </div>
            )}

            <div className="tips">
              <strong>下一步可扩展：</strong>
              <br />
              1. 支持拖拽上传；2. 支持 OCR 扫描版 PDF；3. 支持服务端保存任务；4. 接入更强的 PDF 结构化引擎。
            </div>
          </div>

          <div className="card panel">
            <div className="resultHeader">
              <div>
                <h2 style={{ marginBottom: 8 }}>转换结果</h2>
                <div className={`status ${loading ? "loading" : ""}`}>
                  {loading ? "正在处理 PDF" : result ? "转换完成" : "等待上传文件"}
                </div>
              </div>

              {result && (
                <div className="resultActions">
                  <button className="secondaryBtn" type="button" onClick={handleCopy}>
                    复制内容
                  </button>
                  <button className="primaryBtn" type="button" onClick={handleDownload}>
                    下载 {format === "markdown" ? ".md" : ".html"}
                  </button>
                </div>
              )}
            </div>

            <div className="preview">
              <div className="previewTabs">
                <div className="previewTab">预览</div>
                <div className="previewTab">原始输出</div>
              </div>

              {!result ? (
                <div className="emptyState">
                  上传 PDF 后，这里会显示转换后的预览内容与原始文本结果。
                </div>
              ) : format === "html" ? (
                <>
                  <div
                    className="previewBody"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                  <textarea className="previewRaw" value={result} readOnly />
                </>
              ) : (
                <>
                  <div className="previewBody markdownView">{result}</div>
                  <textarea className="previewRaw" value={result} readOnly />
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
