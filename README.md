# PDF Converter App

一个可运行的 PDF 转换 MVP，支持：

- 上传 PDF
- 输出 Markdown
- 输出 HTML
- 复制结果
- 下载 `.md` / `.html`
- 前端预览转换结果

## 项目结构

```text
frontend/   Next.js 前端
backend/    FastAPI 后端
```

## 技术栈

- Frontend: Next.js 14
- Backend: FastAPI
- PDF Parsing: PyMuPDF

## 本地运行

### 1) 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Windows:

```bash
.venv\Scripts\activate
```

### 2) 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 3) 打开应用

```text
http://localhost:3000
```

## API

### `POST /convert`

FormData 参数：

- `file`: PDF 文件
- `format`: `markdown` 或 `html`

返回：

```json
{
  "filename": "example.pdf",
  "format": "markdown",
  "content": "..."
}
```

### `GET /health`

返回服务健康状态：

```json
{
  "status": "ok"
}
```

## 当前版本说明

当前使用 `PyMuPDF` 进行基础文本提取，适合先做 MVP。对于更复杂的场景，后续可以升级：

- 接入 Marker 提高 Markdown 输出质量
- 支持 OCR 扫描 PDF
- 支持拖拽上传
- 支持批量转换
- 支持服务端任务队列
- 支持对象存储和数据库

## 下一步建议

如果你要继续做产品化，建议按这个顺序迭代：

1. 接入 Marker / MinerU 做高质量结构化解析
2. 增加拖拽上传与进度条
3. 增加用户系统与历史记录
4. 增加 Docker / 云部署配置
