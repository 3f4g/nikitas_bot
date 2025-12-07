import fs from 'fs';
import path from 'path';

const configPath = path.resolve('botConfig.json');

export function loadConfig() {
  const data = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(data);
}

export function saveConfig(newConfig) {
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
}