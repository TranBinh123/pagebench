const sources = new Map<string, Uint8Array>();

export function putSource(id: string, bytes: Uint8Array) {
  sources.set(id, bytes);
}

export function getSource(id: string): Uint8Array {
  const bytes = sources.get(id);
  if (!bytes) throw new Error(`Missing source ${id}`);
  return bytes;
}
