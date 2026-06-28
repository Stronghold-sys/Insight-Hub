const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WINDOWS_FILE_TIME_EPOCH = BigInt("11644473600");

function generateSecMsGecToken(): string {
  const ticks = BigInt(Math.floor((Date.now() / 1000) + Number(WINDOWS_FILE_TIME_EPOCH))) * BigInt("10000000");
  const roundedTicks = ticks - (ticks % BigInt("3000000000"));
  const strToHash = `${roundedTicks}${TRUSTED_CLIENT_TOKEN}`;
  
  let hashHex = '';
  try {
    const nodeCrypto = eval("require")('crypto');
    const hash = nodeCrypto.createHash('sha256');
    hash.update(strToHash, 'ascii');
    hashHex = hash.digest('hex').toUpperCase();
  } catch (e) {
    // Web Crypto fallback if crypto module is not present
    // Handled natively inside Cloudflare Workers or other non-Node JS runtimes
    // Since Web Crypto digest is async, we can block or fallback to a simpler mock,
    // but in Cloudflare nodejs_compat, eval("require")('crypto') will work as it uses standard node crypto polyfill.
    throw new Error("Failed to load crypto module for token generation");
  }
  return hashHex;
}

function getRandomHex(length: number): string {
  try {
    const nodeCrypto = eval("require")('crypto');
    if (nodeCrypto && nodeCrypto.randomBytes) {
      return nodeCrypto.randomBytes(length).toString('hex');
    }
  } catch (e) {}

  const arr = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function findSeparatorIndex(data: Uint8Array): number {
  const seq = [80, 97, 116, 104, 58, 97, 117, 100, 105, 111, 13, 10];
  for (let i = 0; i <= data.length - seq.length; i++) {
    let match = true;
    for (let j = 0; j < seq.length; j++) {
      if (data[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

function concatUint8Arrays(arrays: Uint8Array[]): Buffer {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return Buffer.from(result);
}

// Helper untuk generate TTS ke dalam Buffer (in-memory, tanpa filesystem)
// Mendukung penuh lingkungan local Node.js dan Cloudflare Workers
export async function generateEdgeTTSBuffer(
  text: string,
  voiceConfig: { voice: string; rate: string; pitch: string }
): Promise<Buffer> {
  const gec = generateSecMsGecToken();
  const wssUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`;

  const headers = {
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_FULL_VERSION.split('.')[0]}.0.0.0 Safari/537.36 Edg/${CHROMIUM_FULL_VERSION.split('.')[0]}.0.0.0`,
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  const isWorker = (typeof process !== 'undefined' && process.env?.NEXT_RUNTIME === 'edge') || 
                   (typeof globalThis.WebSocket !== 'undefined' && typeof globalThis.caches !== 'undefined');
  let ws: any;

  if (isWorker) {
    console.log("[Edge TTS] Connecting via Cloudflare native WebSocket fetch...");
    // Cloudflare Workers upgrade HTTP request ke WebSocket
    const httpUrl = wssUrl.replace('wss://', 'https://');
    const response = await fetch(httpUrl, {
      headers: {
        ...headers,
        Upgrade: 'websocket',
      },
    });
    
    ws = (response as any).webSocket;
    if (!ws) {
      throw new Error("Cloudflare did not return a webSocket object. Check headers/Upgrade.");
    }
    ws.accept();
  } else {
    console.log("[Edge TTS] Connecting via Node.js ws client...");
    const WebSocketClient = eval("require")('ws');
    ws = new WebSocketClient(wssUrl, { headers });
  }

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('TTS Generation Timed out'));
    }, 15000);

    const sendRequests = () => {
      // 1. Send Config
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{\n` +
        `  "context": {\n` +
        `    "synthesis": {\n` +
        `      "audio": {\n` +
        `        "metadataoptions": {\n` +
        `          "sentenceBoundaryEnabled": "false",\n` +
        `          "wordBoundaryEnabled": "true"\n` +
        `        },\n` +
        `        "outputFormat": "audio-24khz-48kbitrate-mono-mp3"\n` +
        `      }\n` +
        `    }\n` +
        `  }\n` +
        `}`;
      ws.send(configMsg);

      // 2. Send SSML
      const requestId = getRandomHex(16);
      const escapedText = text.replace(/[<>&"']/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '"': return '&quot;';
          case "'": return '&apos;';
          default: return c;
        }
      });

      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n` +
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="id-ID">
          <voice name="${voiceConfig.voice}">
            <prosody rate="${voiceConfig.rate}" pitch="${voiceConfig.pitch}" volume="default">
              ${escapedText}
            </prosody>
          </voice>
        </speak>`;
      
      ws.send(ssmlMsg);
    };

    const handleMessage = (data: any) => {
      if (typeof data === 'string') {
        if (data.includes('Path:turn.end')) {
          ws.close();
          clearTimeout(timeout);
          resolve(concatUint8Arrays(chunks));
        }
      } else {
        const rawData = new Uint8Array(data);
        const textDecoder = new TextDecoder('utf-8');
        const textContent = textDecoder.decode(rawData);
        
        if (textContent.includes('Path:turn.end')) {
          ws.close();
          clearTimeout(timeout);
          resolve(concatUint8Arrays(chunks));
          return;
        }

        const idx = findSeparatorIndex(rawData);
        if (idx !== -1) {
          const audioPayload = rawData.slice(idx + 12);
          chunks.push(audioPayload);
        }
      }
    };

    const handleError = (err: any) => {
      clearTimeout(timeout);
      ws.close();
      reject(err);
    };

    if (isWorker) {
      ws.binaryType = 'arraybuffer';
      ws.addEventListener('message', (e: any) => handleMessage(e.data));
      ws.addEventListener('error', (e: any) => handleError(e.error || e));
      // Cloudflare native WebSocket is already accepted and ready
      sendRequests();
    } else {
      ws.on('open', () => sendRequests());
      ws.on('message', (data: any) => handleMessage(data));
      ws.on('error', (err: any) => handleError(err));
    }
  });
}
