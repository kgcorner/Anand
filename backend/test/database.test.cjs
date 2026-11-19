const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { existsSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createInterface } = require('node:readline');
const { test } = require('node:test');
const { openDatabase } = require('../dist/platform/database.js');

function tempDirectory(t) {
  const directory = mkdtempSync(join(tmpdir(), 'anand-sqlite-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('opens an in-memory database and enforces foreign keys', () => {
  const database = openDatabase(':memory:');
  try {
    database.exec('CREATE TABLE parent (id INTEGER PRIMARY KEY); CREATE TABLE child (parent_id INTEGER REFERENCES parent(id));');
    assert.throws(() => database.prepare('INSERT INTO child VALUES (?)').run(1), {
      code: 'SQLITE_CONSTRAINT_FOREIGNKEY',
    });
    database.prepare('INSERT INTO parent VALUES (?)').run(1);
    database.prepare('INSERT INTO child VALUES (?)').run(1);
    assert.deepEqual(database.prepare('SELECT parent_id FROM child').get(), { parent_id: 1 });
    assert.equal(database.pragma('busy_timeout', { simple: true }), 5000);
  } finally {
    database.close();
  }
});

test('creates a nested database file and persists records in WAL mode', (t) => {
  const filename = join(tempDirectory(t), 'nested', 'anand.sqlite');
  const database = openDatabase(filename);
  try {
    assert.equal(database.pragma('journal_mode', { simple: true }), 'wal');
    database.exec('CREATE TABLE sample (value TEXT NOT NULL)');
    database.prepare('INSERT INTO sample VALUES (?)').run('persisted');
  } finally {
    database.close();
  }

  const reopened = openDatabase(filename);
  try {
    assert.deepEqual(reopened.prepare('SELECT value FROM sample').get(), { value: 'persisted' });
  } finally {
    reopened.close();
  }
});

test('rejects a blank database path', () => {
  assert.throws(() => openDatabase(' '), /DATABASE_PATH must not be empty/);
});

test('server uses DATABASE_PATH and exits cleanly on SIGTERM', { timeout: 5000 }, async (t) => {
  const filename = join(tempDirectory(t), 'server.sqlite');
  const server = spawn(process.execPath, [join(__dirname, '../dist/server.js')], {
    env: { ...process.env, DATABASE_PATH: filename, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(server, 'close');
  const output = createInterface({ input: server.stdout });
  let stderr = '';
  server.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });

  try {
    let port;
    for await (const line of output) {
      const match = /^Anand backend listening on port (\d+) /.exec(line);
      if (match) {
        port = Number(match[1]);
        break;
      }
    }
    assert.ok(port, stderr || 'Server did not start');
    assert.ok(existsSync(filename));
    const migrated = openDatabase(filename);
    try {
      assert.equal(migrated.pragma('user_version', { simple: true }), 1);
      assert.equal(migrated.prepare('SELECT count(*) AS total FROM patients').get().total, 0);
    } finally {
      migrated.close();
    }
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'UP');
    assert.ok(server.kill('SIGTERM'));
    assert.deepEqual(await exited, [0, null], stderr);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill('SIGKILL');
      await exited;
    }
  }
});
