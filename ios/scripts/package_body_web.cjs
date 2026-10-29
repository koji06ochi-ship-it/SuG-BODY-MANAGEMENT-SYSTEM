#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REMOTE_ROOT = 'https://koji06ochi-ship-it.github.io/SuG-BODY-MANAGEMENT-SYSTEM/';

function args() {
  const values = process.argv.slice(2);
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || !value) throw new Error(`Invalid argument near ${key || '<end>'}`);
    parsed[key.slice(2)] = value;
  }
  for (const key of ['source', 'output', 'quest-asset']) {
    if (!parsed[key]) throw new Error(`Missing --${key}`);
  }
  return parsed;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
}

function runtimeRefs(html) {
  const refs = new Set();
  const expression = /(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(expression)) {
    const value = match[1].split('?', 1)[0].split('#', 1)[0];
    if (!value || /^(?:https?:|#|data:|mailto:|tel:)/i.test(value)) continue;
    if (value.startsWith('assets/') || !value.includes('/')) refs.add(value);
  }
  return [...refs].sort();
}

function copyRequired(source, destination) {
  if (!fs.statSync(source, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Required BODY runtime file is missing: ${source}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function listFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files.sort();
}

function main() {
  const options = args();
  const source = path.resolve(options.source);
  const output = path.resolve(options.output);
  const questAsset = path.resolve(options['quest-asset']);
  if (output === source || output.startsWith(source + path.sep)) {
    throw new Error('Output must not be the BODY source directory or one of its children');
  }
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  const sourceIndex = path.join(source, 'index.html');
  let indexText = fs.readFileSync(sourceIndex, 'utf8');
  for (const ref of runtimeRefs(indexText)) {
    if (ref.startsWith('assets/')) continue;
    copyRequired(path.join(source, ref), path.join(output, ref));
  }
  fs.cpSync(path.join(source, 'assets'), path.join(output, 'assets'), { recursive: true });
  copyRequired(questAsset, path.join(output, path.basename(questAsset)));

  indexText = indexText
    .replaceAll('../../../assets/quest/person-gps-core-20260905.js', 'person-gps-core-20260905.js')
    .replaceAll('../index.html#body-training', REMOTE_ROOT + 'apps/body/index.html#body-training')
    .replaceAll('../self-coach.html', REMOTE_ROOT + 'apps/body/self-coach.html');
  fs.writeFileSync(path.join(output, 'index.html'), indexText.replace(/\r\n/g, '\n'));

  const sevenScreen = path.join(output, 'seven-screen.js');
  if (fs.existsSync(sevenScreen)) {
    const text = fs.readFileSync(sevenScreen, 'utf8')
      .replaceAll('../../../member-hub.html', REMOTE_ROOT + 'member-hub.html');
    fs.writeFileSync(sevenScreen, text.replace(/\r\n/g, '\n'));
  }

  const packagedIndex = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  const missing = runtimeRefs(packagedIndex).filter(ref => !fs.existsSync(path.join(output, ref)));
  if (missing.length) throw new Error(`Packaged BODY has missing local references: ${missing.join(', ')}`);

  const files = listFiles(output).map(file => ({
    path: path.relative(output, file).split(path.sep).join('/'),
    bytes: fs.statSync(file).size,
    sha256: sha256(file)
  }));
  const manifest = {
    schemaVersion: 1,
    source: source.split(path.sep).join('/'),
    entry: 'index.html',
    files,
    fileCount: files.length,
    totalBytes: files.reduce((sum, item) => sum + item.bytes, 0)
  };
  fs.writeFileSync(path.join(output, 'body-web-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ output, fileCount: files.length, totalBytes: manifest.totalBytes }));
}

main();
