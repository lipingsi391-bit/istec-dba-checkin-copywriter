const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY_BYTES = 1024 * 32;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const COPY_STATS_FILE = process.env.COPY_STATS_FILE || process.env.STATS_FILE || path.join(DATA_DIR, 'copy-stats.json');
const STATS_TIME_ZONE = process.env.STATS_TIME_ZONE || 'Asia/Shanghai';

loadDotEnv(path.join(ROOT, '.env'));

const PROGRAMS = {
  CI: {
    name: '企业创新',
    englishName: 'Corporate Innovation',
    tags: '#企业创新',
    focus: '聚焦企业创新与战略管理能力的系统构建，强调企业在数字化、复杂化与全球竞争环境中的战略升级与组织变革。'
  },
  HM: {
    name: '医疗健康管理',
    englishName: 'Healthcare Management',
    tags: '#医疗健康管理',
    focus: '聚焦“医疗治理、医疗创新、医疗运营管理”三大核心能力，强调医疗体系在数字化、智能化与政策变革背景下的管理升级与创新实践。'
  },
  AP: {
    name: '应用心理学',
    englishName: 'Applied Psychology',
    tags: '#应用心理学',
    focus: '聚焦“心理干预、组织心理、行为改变”三大核心领域，强调心理学在企业管理、组织发展与个人成长中的实践应用。'
  }
};

const MODES = {
  opening: '开学典礼'
};

const GENERAL_TAGS = '#ISTEC商学院 #ISTEC #在职博士 #DBA #博士 #工商管理博士';

const AI_PROMPT_RULES = [
  '标题必须控制在18-20个字之间，使用自然、有吸引力的小红书风格，不设固定句式，标题中不要放话题标签，生成前自行检查字数。',
  '正文必须完整出现“ISTEC商学院开学典礼”。',
  '正文必须完整出现所选专业方向的中文名称，不得只写英文名称或缩写。',
  '正文必须是小红书风格、真实在职博士学员视角，表达成熟、克制、专业，突出研究思维、管理实践与长期成长。',
  '避免幼稚、夸张或过度煽情的表达，不写“手发烫”“鼻子一酸”“眼睛亮闪闪”“终于啦”等口语化情节。',
  '只生成开学典礼场景文案，表达博士学习正式启程。',
  '正文必须控制在250-300字之间（不含标题和标签），少于250字或超过300字均不合格，输出前自行检查。',
  '必须明确项目为在职工商管理博士，学制3年。',
  '不得描述或暗示开学典礼的举办地点，不得写前往巴黎、来到巴黎、在巴黎参加典礼、身在巴黎、到学校参加典礼或类似旅行与到校情节，只能写“参加典礼”。',
  '可以客观介绍院校坐落于巴黎市中心，但不得将这一院校信息与典礼地点或学员所在地点相连。',
  '不得虚构学习地点、认证、课程名称、个人职位、工作年限、行业履历、研究方法、调研过程、论文过程或研究成果。',
  '必须根据所选方向自然融入对应的课程聚焦与能力重点，不得混入其他专业方向的内容，不得把能力领域虚构成具体课程名称。',
  '内容保持真实，只使用给定的ISTEC项目信息。',
  '明确这是工商管理博士（Doctorate of Business Administration，DBA），不得写成硕士、MBA或学术型PhD。',
  '如提及典礼服装，只能写博士服或博士袍，不得写学士服、硕士服。',
  'PGE法国TOP8仅指PGE精英商学院项目，不得表述成DBA项目排名或ISTEC综合排名TOP8。',
  '文案末尾必须逐字带齐通用标签和所选专业的中文标签，不得遗漏、改写或增加英文专业标签。'
];

const ISTEC_FACTS = [
  '院校名称：ISTEC商学院（ISTEC Business School）。',
  'ISTEC商学院创立于1961年，坐落于巴黎市中心。',
  'ISTEC商学院是法国精英大学校联盟CGE成员院校。',
  'ISTEC商学院是法国“常春藤”级精英商学院。',
  'ISTEC商学院入选2025年金棕榈全球精选高校。',
  'ISTEC商学院的PGE精英商学院项目位列法国TOP8；该排名仅对应PGE项目，不代表DBA项目排名。',
  '项目名称：工商管理博士（Doctorate of Business Administration，简称DBA）。',
  '项目为在职博士项目，学制3年。',
  '可选专业方向：企业创新（Corporate Innovation）、医疗健康管理（Healthcare Management）、应用心理学（Applied Psychology）。'
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/scan') {
      return handleScan(req, res, url);
    }

    if (req.method === 'POST' && url.pathname === '/api/copy-event') {
      return handleCopyEvent(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/api/copy-stats') {
      return handleCopyStats(req, res, url);
    }

    if (req.method === 'GET' && url.pathname === '/api/scan-stats') {
      return handleCopyStats(req, res, url);
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      return handleGenerate(req, res);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' });
    }

    return serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: 'SERVER_ERROR' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`ISTEC DBA check-in copywriter running on http://${HOST}:${PORT}`);
});

function handleScan(req, res, url) {
  const target = normalizeRedirectPath(url.searchParams.get('to')) || '/';
  res.writeHead(302, {
    Location: target,
    'Cache-Control': 'no-store'
  });
  res.end();
}

async function handleCopyEvent(req, res) {
  const body = await readJsonBody(req);
  try {
    const stats = recordCopy(body);
    const todayKey = getDateKey();
    return sendJson(res, 200, {
      ok: true,
      total: stats.total,
      today: stats.byDate[todayKey] || 0
    });
  } catch (err) {
    console.error('Failed to record copy event:', err);
    return sendJson(res, 500, { error: 'COPY_EVENT_FAILED' });
  }
}

function handleCopyStats(req, res, url) {
  if (!isStatsRequestAuthorized(req, url)) {
    return sendJson(res, 401, { error: 'UNAUTHORIZED' });
  }

  const stats = readCopyStats();
  const todayKey = getDateKey();
  return sendJson(res, 200, {
    metric: 'copy',
    total: stats.total,
    today: stats.byDate[todayKey] || 0,
    todayKey,
    timeZone: STATS_TIME_ZONE,
    byDate: stats.byDate,
    byMode: stats.byMode,
    byProgram: stats.byProgram,
    byCampaign: stats.byCampaign,
    lastCopiedAt: stats.lastCopiedAt,
    updatedAt: stats.updatedAt
  });
}

async function handleGenerate(req, res) {
  if (!process.env.ARK_API_KEY || !process.env.ARK_MODEL) {
    return sendJson(res, 503, {
      error: 'ARK_NOT_CONFIGURED',
      message: 'Please set ARK_API_KEY and ARK_MODEL.'
    });
  }

  const body = await readJsonBody(req);
  const mode = body.mode;
  const program = body.program;

  if (!MODES[mode] || !PROGRAMS[program]) {
    return sendJson(res, 400, { error: 'INVALID_SELECTION' });
  }

  try {
    const generated = await callArk(buildPrompt(mode, program));
    const content = normalizeGeneratedContent(generated, mode, program);
    return sendJson(res, 200, { content, source: 'ark' });
  } catch (err) {
    console.error(err);
    return sendJson(res, 502, {
      error: 'ARK_REQUEST_FAILED',
      message: 'Ark API request failed.'
    });
  }
}

function buildPrompt(mode, program) {
  const programInfo = PROGRAMS[program];
  return [
    `为ISTEC商学院工商管理博士（DBA）${programInfo.name}方向生成一篇${MODES[mode]}小红书打卡文案。`,
    ...AI_PROMPT_RULES.map((rule) => `- ${rule}`),
    `通用标签：${GENERAL_TAGS}`,
    `专业标签：${programInfo.tags}`,
    '可用事实：',
    ...ISTEC_FACTS.map((fact) => `- ${fact}`),
    `- 本次选择方向：${programInfo.name}（${programInfo.englishName}）。`,
    `- 本方向课程聚焦：${programInfo.focus}`,
    '格式：第一行标题；第二行起正文；最后两行分别放通用标签和专业标签。不要解释，不要 Markdown。'
  ].join('\n');
}

function normalizeGeneratedContent(content, mode, program) {
  const programInfo = PROGRAMS[program];
  const lines = String(content || '').split(/\r?\n/);
  const title = lines[0]?.trim() || `${programInfo.name}DBA学习记录`;
  const bodyLines = lines
    .slice(1)
    .filter((line) => !line.trim().startsWith('#'));

  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
  while (bodyLines.length && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();

  return [
    title,
    ...bodyLines,
    '',
    GENERAL_TAGS,
    programInfo.tags
  ].join('\n');
}

async function callArk(prompt) {
  const baseUrl = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ARK_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.ARK_MODEL,
        messages: [
          {
            role: 'system',
            content: '你只按用户给定规则生成成熟、专业的中文小红书文案。不得补充未提供的院校事实，不得混入巴黎商学院PSB的信息，不得暗示典礼在巴黎或学员前往巴黎参加典礼。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.85,
        max_tokens: 700,
        thinking: {
          type: 'disabled'
        }
      })
    });
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.error?.message || data.message || response.statusText;
    throw new Error(`Ark API error: ${detail}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Ark API returned empty content.');
  }
  return String(content).trim();
}

function serveStatic(req, res, pathname) {
  const safePath = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
  const target = path.resolve(ROOT, safePath);

  if (!target.startsWith(ROOT) || isHiddenOrIgnored(target)) {
    return sendText(res, 404, 'Not found');
  }

  let filePath = target;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return sendText(res, 404, 'Not found');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600'
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).pipe(res);
}

function isHiddenOrIgnored(filePath) {
  const rel = path.relative(ROOT, filePath);
  const parts = rel.split(path.sep);
  return rel.startsWith('.') || parts.includes('node_modules') || parts.includes('data') || rel === 'server.js' || rel === 'package.json';
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function recordCopy(body = {}) {
  const campaign = sanitizeCounterKey(body.campaign || 'default');
  const mode = MODES[body.mode] ? body.mode : 'unknown';
  const program = PROGRAMS[body.program] ? body.program : 'unknown';
  const now = new Date().toISOString();
  const dateKey = getDateKey(new Date(now));
  const stats = readCopyStats();

  stats.createdAt ||= now;
  stats.total = Number(stats.total || 0) + 1;
  stats.byDate[dateKey] = Number(stats.byDate[dateKey] || 0) + 1;
  stats.byMode[mode] = Number(stats.byMode[mode] || 0) + 1;
  stats.byProgram[program] = Number(stats.byProgram[program] || 0) + 1;
  stats.byCampaign[campaign] = Number(stats.byCampaign[campaign] || 0) + 1;
  stats.lastCopiedAt = now;
  stats.updatedAt = now;

  writeCopyStats(stats);
  return stats;
}

function readCopyStats() {
  const fallback = {
    metric: 'copy',
    total: 0,
    byDate: {},
    byMode: {},
    byProgram: {},
    byCampaign: {},
    createdAt: null,
    updatedAt: null,
    lastCopiedAt: null
  };

  if (!fs.existsSync(COPY_STATS_FILE)) return fallback;

  try {
    const parsed = JSON.parse(fs.readFileSync(COPY_STATS_FILE, 'utf8'));
    return {
      ...fallback,
      ...parsed,
      total: Number(parsed.total || 0),
      byDate: parsed.byDate && typeof parsed.byDate === 'object' ? parsed.byDate : {},
      byMode: parsed.byMode && typeof parsed.byMode === 'object' ? parsed.byMode : {},
      byProgram: parsed.byProgram && typeof parsed.byProgram === 'object' ? parsed.byProgram : {},
      byCampaign: parsed.byCampaign && typeof parsed.byCampaign === 'object' ? parsed.byCampaign : {}
    };
  } catch (err) {
    console.error('Failed to read copy stats:', err);
    return fallback;
  }
}

function writeCopyStats(stats) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tempFile = `${COPY_STATS_FILE}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(stats, null, 2)}\n`);
  fs.renameSync(tempFile, COPY_STATS_FILE);
}

function getDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STATS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function sanitizeCounterKey(value) {
  const normalized = String(value || 'default').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized.slice(0, 64) || 'default';
}

function normalizeRedirectPath(value) {
  if (!value) return '/';
  const trimmed = String(value).trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}

function isStatsRequestAuthorized(req, url) {
  const token = process.env.STATS_TOKEN;
  if (!token) return true;

  const queryToken = url.searchParams.get('token');
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return queryToken === token || bearerToken === token;
}
