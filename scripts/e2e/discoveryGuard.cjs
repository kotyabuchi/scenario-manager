/**
 * --list専用の先行ロード。既知のimport時I/Oを検出する境界であり、悪意あるコードのsandboxではない。
 * app/testより前に読み込み、違反がcatchされてもexit codeとmarkerを残す。
 */
const fs = require('node:fs');
const path = require('node:path');
const moduleApi = require('node:module');
const { fileURLToPath, pathToFileURL } = require('node:url');

const configuredDirectory = process.env.E2E_DISCOVERY_DIRECTORY;
if (!configuredDirectory || !path.isAbsolute(configuredDirectory)) {
  throw new Error('E2E_DISCOVERY_DIRECTORYに専用の絶対パスが必要です');
}
const directory = fs.realpathSync(configuredDirectory);
const marker = path.join(directory, 'violations.jsonl');
const originalOpenSync = fs.openSync;
const originalWriteSync = fs.writeSync;
const originalCloseSync = fs.closeSync;
const originalRealpathSync = fs.realpathSync;
const violations = [];
const writableDescriptors = new Set([1, 2]);
const guardSymbol = Symbol.for('scenario-manager.discovery.deny');
const projectRoot = fs.realpathSync(
  process.env.E2E_DISCOVERY_ROOT ?? process.cwd(),
);
const NativeError = Error;

/** 引数・値・関数名を保存せず、project内の最初の呼出位置だけを記録する。 */
const callerLocation = () => {
  for (const frame of new NativeError().stack?.split('\n').slice(1) ?? []) {
    const match = frame.match(
      /(file:\/\/[^\r\n]+|[A-Za-z]:[\\/][^\r\n]+|\/[^\r\n]+):(\d+):(\d+)\)?$/,
    );
    if (!match) continue;
    let file = match[1];
    if (file.startsWith('file:')) {
      const url = new URL(file);
      if (url.search || url.hash) continue;
      file = fileURLToPath(url);
    }
    const relative = path.relative(projectRoot, file);
    if (
      file === __filename ||
      path.isAbsolute(relative) ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`)
    )
      continue;
    const normalized = relative.split(path.sep).join('/');
    if (normalized.split('/').includes('node_modules')) continue;
    return {
      file: normalized,
      line: Number(match[2]),
      column: Number(match[3]),
    };
  }
  return null;
};

const saveViolations = () => {
  if (violations.length === 0) return;
  process.exitCode = 1;
  const descriptor = originalOpenSync(marker, 'w');
  try {
    const bytes = Buffer.from(`${violations.map(JSON.stringify).join('\n')}\n`);
    let offset = 0;
    while (offset < bytes.length)
      offset += originalWriteSync(
        descriptor,
        bytes,
        offset,
        bytes.length - offset,
      );
  } finally {
    originalCloseSync(descriptor);
  }
};
const deny = (operation) => {
  if (violations.length < 100) {
    let location = null;
    try {
      location = callerLocation();
    } catch {
      // stackの解釈失敗でも副作用の違反記録は必ず残す。
    }
    violations.push({ operation, location });
  }
  saveViolations();
  throw new Error(`E2E discovery blocked: ${operation}`);
};
globalThis[guardSymbol] = deny;
process.on('exit', saveViolations);

/** 未作成の末尾も既存の祖先をrealpathし、junction/symlinkの範囲外書込みを防ぐ。 */
const physicalPath = (value) => {
  let candidate = path.resolve(
    value instanceof URL
      ? fileURLToPath(value)
      : Buffer.isBuffer(value)
        ? value.toString()
        : value,
  );
  const tail = [];
  while (true) {
    try {
      return path.join(originalRealpathSync(candidate), ...tail.reverse());
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      const parent = path.dirname(candidate);
      if (parent === candidate) throw error;
      tail.push(path.basename(candidate));
      candidate = parent;
    }
  }
};
const allowWrite = (value, operation) => {
  if (value && typeof value === 'object' && typeof value.fd === 'number') {
    return allowWrite(value.fd, operation);
  }
  if (typeof value === 'number') {
    if (!writableDescriptors.has(value)) deny(operation);
    return;
  }
  const physical = physicalPath(value);
  const relative = path.relative(directory, physical);
  if (
    path.isAbsolute(relative) ||
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    physical === marker ||
    (relative === '' && /(?:rm|rmdir|unlink|rename)/.test(operation))
  )
    deny(operation);
};
const wrap = (object, key, validate) => {
  const original = object[key];
  if (typeof original !== 'function') return;
  object[key] = function (...args) {
    validate(args, key);
    return original.apply(this, args);
  };
};
const block = (object, keys, category) => {
  for (const key of keys) {
    if (typeof object[key] === 'function')
      object[key] = () => deny(`${category}.${key}`);
  }
};

// ファイル書込みはrunner所有のcache/reportだけを許可する。
const pathWrites = [
  'writeFile',
  'appendFile',
  'mkdir',
  'mkdtemp',
  'rm',
  'rmdir',
  'unlink',
  'truncate',
  'chmod',
  'chown',
  'lchmod',
  'lchown',
  'utimes',
  'lutimes',
];
for (const api of [fs, fs.promises]) {
  for (const name of pathWrites) {
    for (const key of [name, `${name}Sync`])
      wrap(api, key, (args) => allowWrite(args[0], `fs.${key}`));
  }
  for (const key of ['rename', 'renameSync'])
    wrap(api, key, (args) => {
      allowWrite(args[0], `fs.${key}`);
      allowWrite(args[1], `fs.${key}`);
    });
  for (const key of ['copyFile', 'copyFileSync', 'cp', 'cpSync'])
    wrap(api, key, (args) => allowWrite(args[1], `fs.${key}`));
  // hardlinkによる範囲外inodeの変更とsymlinkの持込みは列挙には不要。
  block(api, ['link', 'linkSync', 'symlink', 'symlinkSync'], 'fs');
}
const hasWriteFlag = (flags) =>
  typeof flags === 'number'
    ? (flags &
        (fs.constants.O_WRONLY |
          fs.constants.O_RDWR |
          fs.constants.O_CREAT |
          fs.constants.O_TRUNC |
          fs.constants.O_APPEND)) !==
      0
    : /[wa+]/.test(flags ?? 'r');
fs.openSync = function (file, flags, ...args) {
  if (hasWriteFlag(flags)) allowWrite(file, 'fs.openSync');
  const descriptor = originalOpenSync.call(this, file, flags, ...args);
  if (hasWriteFlag(flags)) writableDescriptors.add(descriptor);
  return descriptor;
};
const originalOpen = fs.open;
fs.open = function (file, flags, ...args) {
  if (hasWriteFlag(flags)) allowWrite(file, 'fs.open');
  const callback = args.pop();
  return originalOpen.call(this, file, flags, ...args, (error, descriptor) => {
    if (!error && hasWriteFlag(flags)) writableDescriptors.add(descriptor);
    callback(error, descriptor);
  });
};
const originalPromiseOpen = fs.promises.open;
fs.promises.open = async function (file, flags, ...args) {
  if (hasWriteFlag(flags)) allowWrite(file, 'fs.promises.open');
  const handle = await originalPromiseOpen.call(this, file, flags, ...args);
  const descriptor = handle.fd;
  if (hasWriteFlag(flags)) writableDescriptors.add(descriptor);
  wrap(handle, 'close', () => writableDescriptors.delete(descriptor));
  for (const key of [
    'write',
    'writeFile',
    'appendFile',
    'writev',
    'truncate',
    'chmod',
    'chown',
    'utimes',
    'createWriteStream',
  ]) {
    wrap(handle, key, () => allowWrite(file, `fs.FileHandle.${key}`));
  }
  return handle;
};
for (const key of [
  'write',
  'writeSync',
  'writev',
  'writevSync',
  'ftruncate',
  'ftruncateSync',
  'fchmod',
  'fchmodSync',
  'fchown',
  'fchownSync',
  'futimes',
  'futimesSync',
]) {
  wrap(fs, key, (args) => allowWrite(args[0], `fs.${key}`));
}
for (const key of ['close', 'closeSync'])
  wrap(fs, key, (args) => writableDescriptors.delete(args[0]));
wrap(fs, 'createWriteStream', (args) => {
  allowWrite(args[1]?.fd ?? args[0], 'fs.createWriteStream');
});

// fetchだけでなくNode組込みの接続経路とESMのnamed importも同時に閉じる。
globalThis.fetch = () => deny('network.fetch');
for (const key of ['WebSocket', 'EventSource']) {
  if (globalThis[key]) globalThis[key] = () => deny(`network.${key}`);
}
for (const name of ['http', 'https'])
  block(require(`node:${name}`), ['request', 'get'], 'network');
block(require('node:net'), ['connect', 'createConnection'], 'network');
block(require('node:net').Socket.prototype, ['connect'], 'network.Socket');
block(require('node:net').Server.prototype, ['listen'], 'network.Server');
block(require('node:tls'), ['connect'], 'network');
block(require('node:http2'), ['connect'], 'network');
block(
  require('node:dgram').Socket.prototype,
  ['bind', 'connect', 'send'],
  'network.Datagram',
);
const dns = require('node:dns');
for (const api of [dns, dns.promises])
  block(
    api,
    Object.keys(api).filter((key) => /^(lookup|resolve|reverse)/.test(key)),
    'network.dns',
  );
const childProcess = require('node:child_process');
block(
  childProcess,
  [
    'spawn',
    'spawnSync',
    'exec',
    'execSync',
    'execFile',
    'execFileSync',
    'fork',
  ],
  'child_process',
);
block(childProcess.ChildProcess.prototype, ['spawn'], 'child_process');
moduleApi.syncBuiltinESMExports();

// factory未使用のSDK importは許すが、列挙中のclient生成は呼出時に失敗させる。
const classify = (filename) => {
  const normalized = filename.replaceAll('\\', '/');
  if (/\/node_modules\/dotenv\/config\.js$/.test(normalized))
    return 'dotenv-config';
  if (/\/node_modules\/dotenv\/lib\/main\.js$/.test(normalized))
    return 'dotenv';
  if (/\/node_modules\/@supabase\/(supabase-js|ssr)\/dist\//.test(normalized))
    return 'supabase';
  return null;
};
const blockedExports = {
  createClient: () => deny('sdk.createClient'),
  SupabaseClient: () => deny('sdk.SupabaseClient'),
  createServerClient: () => deny('sdk.createServerClient'),
  createBrowserClient: () => deny('sdk.createBrowserClient'),
  config: () => deny('dotenv.config'),
  configDotenv: () => deny('dotenv.configDotenv'),
};
const originalLoad = moduleApi._load;
moduleApi._load = function (request, parent, isMain) {
  const kind = classify(moduleApi._resolveFilename(request, parent, isMain));
  if (kind === 'dotenv-config') return {};
  if (kind) return blockedExports;
  return originalLoad.call(this, request, parent, isMain);
};

// Node 20.6以降の非同期loaderでESMのSDK入口にも同じ境界を適用する。
const loader = String.raw`
  const classify = ${classify.toString()};
  export async function load(url, context, nextLoad) {
    const kind = classify(decodeURIComponent(url));
    if (!kind) return nextLoad(url, context);
    if (kind === 'dotenv-config') return { format: 'module', source: 'export default {};', shortCircuit: true };
    const names = ${JSON.stringify(Object.keys(blockedExports))};
    const source = names.map(name => 'export function ' + name + '() { return globalThis[Symbol.for("scenario-manager.discovery.deny")]("' + (kind === 'dotenv' ? 'dotenv.' : 'sdk.') + name + '"); }').join('\n');
    return { format: 'module', source: source + '\nexport default { ' + names.join(', ') + ' };', shortCircuit: true };
  }
`;
moduleApi.register(
  `data:text/javascript,${encodeURIComponent(loader)}`,
  pathToFileURL(__filename),
);
