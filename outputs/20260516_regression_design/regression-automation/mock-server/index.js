const http = require('http');
const url = require('url');

const PORT = process.env.MOCK_SERVER_PORT || 3099;

const routes = {
  'POST /api/ocr/recognize': (req, body) => {
    const scenario = req.headers['x-mock-scenario'] || 'success';
    const responses = {
      success: { code: 0, data: { recognized: true, text: '发票号:12345678\n金额:1000.00', invoiceNo: '12345678', amount: 1000.00 }, message: 'success' },
      fail: { code: 1001, data: null, message: '图片识别失败，请重试' },
      timeout: { code: 1002, data: null, message: '识别服务超时' },
      no_result: { code: 0, data: { recognized: false, text: '' }, message: '未识别到发票信息' },
    };
    return { status: scenario === 'timeout' ? 504 : 200, body: responses[scenario] || responses.success };
  },

  'POST /api/platform/callback': (req, body) => {
    const scenario = req.headers['x-mock-scenario'] || 'approved';
    const responses = {
      approved: { code: 0, data: { status: 'approved', projectId: body?.projectId || 'PROJ-001', processedAt: new Date().toISOString() }, message: 'success' },
      empty: { code: 0, data: null, message: '无报备数据' },
      completed: { code: 0, data: { status: 'completed', projectId: body?.projectId || 'PROJ-001', processedAt: new Date().toISOString() }, message: 'success' },
    };
    return { status: 200, body: responses[scenario] || responses.approved };
  },

  'POST /api/sms/send': (req, body) => {
    const scenario = req.headers['x-mock-scenario'] || 'success';
    const responses = {
      success: { code: 0, data: { smsId: 'SMS-' + Date.now(), status: 'sent', phone: body?.phone }, message: 'success' },
      fail: { code: 2001, data: null, message: '短信发送失败' },
      rate_limit: { code: 2002, data: null, message: '短信发送太频繁，请稍后重试' },
    };
    return { status: 200, body: responses[scenario] || responses.success };
  },

  'POST /api/blockchain/send': (req, body) => {
    return { status: 200, body: { code: 0, data: { txId: 'TX-' + Date.now(), status: 'sent' }, message: 'success' } };
  },

  'GET /api/health': () => {
    return { status: 200, body: { code: 0, data: { status: 'UP', timestamp: new Date().toISOString() }, message: 'ok' } };
  },
};

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-mock-scenario');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const routeKey = `${req.method} ${parsedUrl.pathname}`;
  const handler = routes[routeKey];

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 404, message: 'Mock route not found' }));
    return;
  }

  const body = await parseBody(req);
  const result = handler(req, body);
  res.writeHead(result.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result.body));
});

server.listen(PORT, () => {
  console.log(`[Mock Server] Running on http://localhost:${PORT}`);
  console.log('[Mock Server] Routes:');
  Object.keys(routes).forEach((r) => console.log(`  ${r}`));
});
