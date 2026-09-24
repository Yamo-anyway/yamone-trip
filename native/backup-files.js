import { Directory, File } from 'expo-file-system';
import { MAX_BACKUP_BYTES } from './backup.js';

const safeStamp = value => value.replace(/[:.]/g, '-');

export function isPickerCancellation(error) {
  return error instanceof Error && /picker was cancelled|picker was canceled/i.test(error.message);
}

/** Opens the Android system directory picker only after an explicit user action. */
export async function exportBackupFile(contents, createdAt) {
  if (typeof contents !== 'string') throw new Error('backupError');
  const directory = await Directory.pickDirectoryAsync();
  const name = `yamone-trip-backup-${safeStamp(createdAt)}.json`;
  const file = directory.createFile(name, 'application/json');
  file.write(contents);
  return {name:file.name, size:file.size};
}

/** Opens the Android system file picker. It never scans storage or reads a file before selection. */
export async function pickBackupFile() {
  const picked = await File.pickFileAsync(undefined, 'application/json');
  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file || file.size > MAX_BACKUP_BYTES) throw new Error('backupTooLarge');
  return {name:file.name, text:await file.text()};
}
