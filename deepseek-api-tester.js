const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);

const page = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DeepSeek API 测试工具</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f1ec;
      --card: #ffffff;
      --ink: #1a1a1a;
      --ink-soft: #4a4a4a;
      --ink-light: #8a8a8a;
      --line: #d8d2c8;
      --line-soft: #e8e2d8;
      --accent: #c8442a;
      --accent-dark: #a8351f;
      --accent-soft: #f2e4dd;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
      background-image:
        radial-gradient(circle at 20% 10%, rgba(200, 68, 42, 0.04) 0%, transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(200, 154, 42, 0.04) 0%, transparent 40%);
    }
    main { width: 100vw; height: 100vh; padding: 10px; }
    h2 { margin: 0; font-size: 17px; }
    h3 { margin: 12px 0 7px; font-size: 14px; }
    .layout { display: grid; grid-template-columns: minmax(360px, 34vw) 1fr; gap: 10px; height: 100%; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 0; padding: 14px; overflow: auto; }
    .result-card { display: flex; flex-direction: column; min-width: 0; }
    label { display: block; font-weight: 700; margin: 10px 0 5px; color: var(--ink-soft); font-size: 13px; }
    .note { margin: 4px 0 0; color: var(--ink-light); font-size: 12px; line-height: 1.5; }
    input, textarea, select { width: 100%; border: 1px solid var(--line); border-radius: 0; padding: 10px 12px; font-size: 14px; line-height: 1.5; background: #fff; color: var(--ink); }
    input:focus, textarea:focus, select:focus { outline: 1px solid var(--accent); border-color: var(--accent); }
    textarea { min-height: 96px; resize: vertical; }
    #systemPrompt { min-height: 80px; }
    #userPrompt { min-height: 190px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    button { font-family: "Consolas", "Courier New", monospace; border: 1px solid var(--ink); border-radius: 0; background: transparent; color: var(--ink); padding: 9px 12px; cursor: pointer; font-weight: 700; font-size: 12px; letter-spacing: .04em; transition: all .16s ease; }
    button:disabled { opacity: .65; cursor: not-allowed; }
    button:hover { background: var(--ink); color: var(--bg); }
    .primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    .primary:hover { background: var(--accent-dark); border-color: var(--accent-dark); }
    .secondary { background: transparent; color: var(--ink); }
    .toolbar { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 8px; }
    .badges { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 8px 0; }
    .badge { background: #fbfaf8; border: 1px solid var(--line-soft); border-radius: 0; padding: 8px; }
    .badge strong { display: block; font-size: 11px; color: var(--ink-light); margin-bottom: 4px; font-family: "Consolas", "Courier New", monospace; letter-spacing: .08em; text-transform: uppercase; }
    .badge span { font-weight: 700; }
    .status-ready { color: #0369a1; }
    .status-ok { color: #047857; }
    .status-error { color: #b91c1c; }
    .answer { white-space: pre-wrap; word-break: break-word; background: #fffdf8; border: 1px solid var(--line); border-radius: 0; padding: 14px; min-height: 260px; max-height: 40vh; overflow: auto; line-height: 1.7; font-size: 15px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .details-grid details { display: flex; flex-direction: column; min-width: 0; }
    .summary-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
    .summary-row summary { flex: 1; }
    .icon-btn { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 16px; line-height: 1; }
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(26, 26, 26, .28); opacity: 0; pointer-events: none; transition: opacity .18s ease; z-index: 20; }
    .drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    .history-drawer { position: fixed; top: 0; right: 0; width: min(420px, 92vw); height: 100vh; background: var(--card); border-left: 1px solid var(--line); box-shadow: -8px 0 24px rgba(0,0,0,.16); transform: translateX(100%); transition: transform .18s ease; z-index: 21; padding: 14px; display: flex; flex-direction: column; }
    .history-drawer.open { transform: translateX(0); }
    .drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
    .history-list { display: grid; gap: 8px; overflow: auto; flex: 1; }
    .history-item { border: 1px solid var(--line-soft); border-radius: 0; padding: 10px; background: #fbfaf8; cursor: pointer; }
    .history-item:hover { background: var(--accent-soft); }
    .history-item strong { display: block; margin-bottom: 4px; }
    .history-meta { color: var(--ink-light); font-size: 12px; }
    .file-list { margin-top: 8px; color: var(--ink-light); font-size: 12px; line-height: 1.6; }
    .native-file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .upload-card { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; border: 1px dashed var(--line); background: #fffdf8; padding: 12px; cursor: pointer; transition: border-color .16s ease, background .16s ease; }
    .upload-card:hover { border-color: var(--accent); background: var(--accent-soft); }
    .upload-icon { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--ink); color: var(--accent); font-family: "Consolas", "Courier New", monospace; font-weight: 700; }
    .upload-title { font-weight: 700; color: var(--ink); }
    .upload-desc { color: var(--ink-light); font-size: 12px; margin-top: 2px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #111827; color: #e5e7eb; padding: 12px; border-radius: 9px; height: 230px; min-height: 230px; overflow: auto; margin: 0; }
    details { margin-top: 0; border: 1px solid var(--line); border-radius: 0; padding: 10px; background: #fff; }
    summary { cursor: pointer; font-weight: 700; color: var(--ink-soft); }
    .error { color: var(--accent); font-weight: 700; }
    @media (max-width: 980px) {
      main { height: auto; }
      .layout, .details-grid { grid-template-columns: 1fr; }
      .badges { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .row, .badges { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <div class="layout">
      <section class="card">
        <h2>请求配置</h2>
        <div class="actions">
          <button class="primary" id="sendBtn">调用 API</button>
          <button class="secondary" id="sampleBtn">填入示例</button>
          <button class="secondary" id="clearBtn">清空输出</button>
        </div>

        <div class="row">
          <div>
            <label for="apiKey">API Key</label>
            <input id="apiKey" type="password" placeholder="sk-..." autocomplete="off" />
          </div>
          <div>
            <label for="baseUrl">Base URL</label>
            <input id="baseUrl" value="https://api.deepseek.com" />
          </div>
        </div>

        <label for="model">Model</label>
        <input id="model" value="deepseek-chat" />
        <p class="note">当前按 OpenAI 兼容的 Chat Completions 格式发送：/chat/completions</p>

        <label for="apiType">API 类型</label>
        <select id="apiType">
          <option value="openai-text">OpenAI 兼容文本</option>
          <option value="openai-multimodal">OpenAI 兼容多模态（预留）</option>
        </select>

        <label for="systemPrompt">System Prompt</label>
        <textarea id="systemPrompt">你是一个简洁清楚的助手，请用中文回答。</textarea>

        <label for="userPrompt">用户输入</label>
        <textarea id="userPrompt" placeholder="请输入你想测试的问题">请用一句话介绍你自己。</textarea>

        <label for="imageInput">图片上传（预留）</label>
        <input id="imageInput" class="native-file" type="file" accept="image/*" multiple />
        <label class="upload-card" for="imageInput">
          <span class="upload-icon">IMG</span>
          <span>
            <span id="imageUploadTitle" class="upload-title">选择图片文件</span>
            <span class="upload-desc">支持 PNG / JPG / WEBP，可多选，当前仅预留入口</span>
          </span>
        </label>
        <div id="imageList" class="file-list">暂不发送图片，只用于预留多模态测试入口。</div>

        <label for="pdfInput">PDF 上传（预留）</label>
        <input id="pdfInput" class="native-file" type="file" accept="application/pdf,.pdf" />
        <label class="upload-card" for="pdfInput">
          <span class="upload-icon">PDF</span>
          <span>
            <span id="pdfUploadTitle" class="upload-title">选择 PDF 文件</span>
            <span class="upload-desc">当前仅预留入口，后续可接 PDF 文本解析</span>
          </span>
        </label>
        <div id="pdfList" class="file-list">暂不解析 PDF，只用于预留文件测试入口。</div>
      </section>

      <section class="card result-card">
        <div class="toolbar">
          <h2>观察结果</h2>
          <div class="actions" style="margin-top:0">
            <button class="secondary" id="historyBtn">历史记录</button>
            <button class="secondary" id="copyAnswerBtn">复制回复</button>
          </div>
        </div>

        <div class="badges">
          <div class="badge"><strong>状态</strong><span id="status" class="status-ready">未请求</span></div>
          <div class="badge"><strong>耗时</strong><span id="elapsed">-</span></div>
          <div class="badge"><strong>Token</strong><span id="tokens">-</span></div>
          <div class="badge"><strong>结束原因</strong><span id="finishReason">-</span></div>
        </div>

        <h3>模型回复</h3>
        <div id="answer" class="answer">等待调用...</div>

        <div class="details-grid">
          <details open>
            <div class="summary-row">
              <summary>请求预览（已隐藏 API Key）</summary>
              <button class="secondary icon-btn" id="copyRequestBtn" title="复制完整请求 JSON" aria-label="复制完整请求 JSON">⧉</button>
            </div>
            <pre id="requestPreview">等待调用...</pre>
          </details>

          <details open>
            <div class="summary-row">
              <summary>原始 JSON</summary>
            </div>
            <pre id="raw">等待调用...</pre>
          </details>
        </div>
      </section>
    </div>

    <div id="drawerBackdrop" class="drawer-backdrop"></div>
    <aside id="historyDrawer" class="history-drawer" aria-hidden="true">
      <div class="drawer-head">
        <h2>历史记录</h2>
        <button class="secondary icon-btn" id="closeHistoryBtn" title="关闭历史记录" aria-label="关闭历史记录">×</button>
      </div>
      <div class="actions">
        <button class="secondary" id="clearHistoryBtn">清空历史</button>
      </div>
      <div id="historyList" class="history-list">暂无历史记录。</div>
    </aside>
  </main>

  <script>
    const $ = (id) => document.getElementById(id);
    const historyKey = "deepseekApiTesterHistory";
    let lastRequestJson = "";

    function collectPayload() {
      return {
        apiKey: $("apiKey").value.trim(),
        baseUrl: $("baseUrl").value.trim(),
        model: $("model").value.trim(),
        apiType: $("apiType").value,
        systemPrompt: $("systemPrompt").value.trim(),
        userPrompt: $("userPrompt").value.trim()
      };
    }

    function buildPreview(payload) {
      const messages = [];
      if (payload.systemPrompt) messages.push({ role: "system", content: payload.systemPrompt });
      messages.push({ role: "user", content: payload.userPrompt });
      return {
        apiType: payload.apiType,
        url: payload.baseUrl.replace(/\/+$/, "") + "/chat/completions",
        method: "POST",
        headers: { Authorization: "Bearer ***", "Content-Type": "application/json" },
        body: { model: payload.model, messages, temperature: 0.7 }
      };
    }

    function setStatus(text, className) {
      $("status").textContent = text;
      $("status").className = className;
    }

    function resetResult() {
      setStatus("未请求", "status-ready");
      $("elapsed").textContent = "-";
      $("tokens").textContent = "-";
      $("finishReason").textContent = "-";
      $("answer").className = "answer";
      $("answer").textContent = "等待调用...";
      $("raw").textContent = "等待调用...";
      $("requestPreview").textContent = "等待调用...";
    }

    function explainError(message) {
      const text = String(message || "");
      if (/401|unauthorized|authentication|api key|invalid key/i.test(text)) return "API Key 可能不正确、为空，或没有权限。请检查 key 是否复制完整。";
      if (/insufficient|quota|balance|billing|payment|429/i.test(text)) return "可能是额度不足、余额不足，或请求太频繁。请检查账户余额和调用频率。";
      if (/model|not found|does not exist|404/i.test(text)) return "模型名称可能写错，或当前 API Key 无权调用这个模型。";
      if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout|network|Base URL/i.test(text)) return "Base URL 或网络可能有问题。请检查地址是否类似 https://api.deepseek.com。";
      if (/400|invalid|messages|parameter/i.test(text)) return "请求参数可能不符合接口要求。请检查模型名、System Prompt 和用户输入。";
      return "暂未识别具体原因，请看下面的原始 JSON 或复制请求 JSON 给开发排查。";
    }

    function getHistory() {
      try { return JSON.parse(localStorage.getItem(historyKey) || "[]"); } catch { return []; }
    }

    function saveHistory(item) {
      const next = [item, ...getHistory()].slice(0, 20);
      localStorage.setItem(historyKey, JSON.stringify(next));
      renderHistory();
    }

    function renderHistory() {
      const list = getHistory();
      if (!list.length) {
        $("historyList").textContent = "暂无历史记录。";
        return;
      }
      $("historyList").innerHTML = list.map((item, index) => [
        '<div class="history-item" data-index="' + index + '">',
        '<strong>' + item.model + ' · ' + item.status + '</strong>',
        '<div>' + item.question + '</div>',
        '<div class="history-meta">' + item.elapsed + ' · token: ' + item.tokens + ' · ' + item.time + '</div>',
        '</div>'
      ].join("")).join("");
    }

    $("sampleBtn").addEventListener("click", () => {
      $("systemPrompt").value = "你是一个产品经理助手，回答要短、清楚、适合初中生理解。";
      $("userPrompt").value = "帮我写一个测试模型 API 输出效果的简单问题。";
    });

    $("clearBtn").addEventListener("click", resetResult);

    $("imageInput").addEventListener("change", () => {
      const names = Array.from($("imageInput").files).map((file) => file.name + " (" + Math.round(file.size / 1024) + " KB)");
      $("imageUploadTitle").textContent = names.length ? "已选择 " + names.length + " 个图片" : "选择图片文件";
      $("imageList").textContent = names.length ? "已选择：" + names.join("，") + "。当前版本只预留入口，暂不发送。" : "暂不发送图片，只用于预留多模态测试入口。";
    });

    $("pdfInput").addEventListener("change", () => {
      const file = $("pdfInput").files[0];
      $("pdfUploadTitle").textContent = file ? file.name : "选择 PDF 文件";
      $("pdfList").textContent = file ? "已选择：" + file.name + " (" + Math.round(file.size / 1024) + " KB)。当前版本只预留入口，暂不解析。" : "暂不解析 PDF，只用于预留文件测试入口。";
    });

    $("copyAnswerBtn").addEventListener("click", async () => {
      await navigator.clipboard.writeText($("answer").textContent);
      $("copyAnswerBtn").textContent = "已复制";
      setTimeout(() => { $("copyAnswerBtn").textContent = "复制回复"; }, 1200);
    });

    $("copyRequestBtn").addEventListener("click", async () => {
      await navigator.clipboard.writeText(lastRequestJson || $("requestPreview").textContent);
      $("copyRequestBtn").textContent = "✓";
      setTimeout(() => { $("copyRequestBtn").textContent = "⧉"; }, 1200);
    });

    function setHistoryDrawer(open) {
      $("historyDrawer").classList.toggle("open", open);
      $("drawerBackdrop").classList.toggle("open", open);
      $("historyDrawer").setAttribute("aria-hidden", open ? "false" : "true");
    }

    $("historyBtn").addEventListener("click", () => setHistoryDrawer(true));
    $("closeHistoryBtn").addEventListener("click", () => setHistoryDrawer(false));
    $("drawerBackdrop").addEventListener("click", () => setHistoryDrawer(false));

    $("clearHistoryBtn").addEventListener("click", () => {
      localStorage.removeItem(historyKey);
      renderHistory();
    });

    $("historyList").addEventListener("click", (event) => {
      const item = event.target.closest(".history-item");
      if (!item) return;
      const record = getHistory()[Number(item.dataset.index)];
      if (!record) return;
      $("model").value = record.model;
      $("userPrompt").value = record.question;
      $("answer").className = record.status === "失败" ? "answer error" : "answer";
      $("answer").textContent = record.answer;
      $("tokens").textContent = record.tokens;
      $("elapsed").textContent = record.elapsed;
      setStatus(record.status, record.status === "失败" ? "status-error" : "status-ok");
    });

    $("sendBtn").addEventListener("click", async () => {
      const startedAt = performance.now();
      const payload = collectPayload();
      const preview = buildPreview(payload);
      lastRequestJson = JSON.stringify(preview, null, 2);

      $("sendBtn").disabled = true;
      setStatus("请求中", "status-ready");
      $("elapsed").textContent = "-";
      $("tokens").textContent = "-";
      $("finishReason").textContent = "-";
      $("answer").className = "answer";
      $("answer").textContent = "正在请求 DeepSeek API...";
      $("raw").textContent = "等待返回...";
      $("requestPreview").textContent = JSON.stringify(preview, null, 2);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
          $("raw").textContent = JSON.stringify(data.raw || data, null, 2);
          throw new Error(data.error || "请求失败，HTTP 状态码：" + response.status);
        }

        const usage = data.raw && data.raw.usage ? data.raw.usage : {};
        const choice = data.raw && data.raw.choices ? data.raw.choices[0] : {};
        setStatus("成功", "status-ok");
        $("elapsed").textContent = Math.round(performance.now() - startedAt) + " ms";
        $("tokens").textContent = usage.total_tokens || "-";
        $("finishReason").textContent = choice && choice.finish_reason ? choice.finish_reason : "-";
        $("answer").textContent = data.answer || "接口返回成功，但没有读取到模型回复。";
        $("raw").textContent = JSON.stringify(data.raw, null, 2);
        saveHistory({
          time: new Date().toLocaleString(),
          status: "成功",
          model: payload.model,
          question: payload.userPrompt.slice(0, 120),
          answer: $("answer").textContent,
          elapsed: $("elapsed").textContent,
          tokens: $("tokens").textContent
        });
      } catch (error) {
        const readable = explainError(error.message);
        setStatus("失败", "status-error");
        $("elapsed").textContent = Math.round(performance.now() - startedAt) + " ms";
        $("answer").className = "answer error";
        $("answer").textContent = readable + "\n\n原始错误：" + error.message;
        $("raw").textContent = "无可用 JSON。";
        saveHistory({
          time: new Date().toLocaleString(),
          status: "失败",
          model: payload.model || "-",
          question: payload.userPrompt.slice(0, 120),
          answer: $("answer").textContent,
          elapsed: $("elapsed").textContent,
          tokens: "-"
        });
      } finally {
        $("sendBtn").disabled = false;
      }
    });

    renderHistory();
  </script>
</body>
</html>`;

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("请求内容过大"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function buildChatUrl(baseUrl) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return `${normalized}/chat/completions`;
}

async function handleChat(request, response) {
  try {
    const body = JSON.parse(await readBody(request));
    const { apiKey, baseUrl, model, systemPrompt, userPrompt } = body;

    if (!apiKey) return sendJson(response, 400, { error: "请先填写 API Key。" });
    if (!baseUrl) return sendJson(response, 400, { error: "请先填写 Base URL。" });
    if (!model) return sendJson(response, 400, { error: "请先填写模型名称。" });
    if (!userPrompt) return sendJson(response, 400, { error: "请先填写用户输入。" });

    const messages = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: userPrompt });

    const apiResponse = await fetch(buildChatUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 })
    });

    const rawText = await apiResponse.text();
    let raw;
    try {
      raw = JSON.parse(rawText);
    } catch {
      raw = { text: rawText };
    }

    if (!apiResponse.ok) {
      const message = raw.error && raw.error.message ? raw.error.message : "DeepSeek API 请求失败。";
      return sendJson(response, apiResponse.status, { error: message, raw });
    }

    const answer = raw.choices && raw.choices[0] && raw.choices[0].message
      ? raw.choices[0].message.content
      : "";
    sendJson(response, 200, { answer, raw });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "本地服务处理失败。" });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return response.end(page);
  }

  if (request.method === "POST" && url.pathname === "/api/chat") {
    return handleChat(request, response);
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`DeepSeek API 测试工具已启动：http://localhost:${PORT}`);
  console.log("停止服务：在终端按 Ctrl + C");
});
