import { Platform } from 'react-native';

/** Reads a picked file (DocumentPicker / ImagePicker asset) as a data: URL. */
export async function toDataUrl(asset: { uri: string; mimeType?: string | null; base64?: string | null }) {
  const type = asset.mimeType ?? 'application/octet-stream';
  if (asset.base64) return `data:${type};base64,${asset.base64}`;
  if (Platform.OS === 'web' || asset.uri.startsWith('blob:') || asset.uri.startsWith('data:')) {
    if (asset.uri.startsWith('data:')) return asset.uri;
    const blob = await (await fetch(asset.uri)).blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).replace(/^data:[^;]*;/, `data:${type};`));
      r.onerror = () => reject(new Error('Couldn’t read that file'));
      r.readAsDataURL(blob);
    });
  }
  const FS = await import('expo-file-system/legacy');
  const b64 = await FS.readAsStringAsync(asset.uri, { encoding: FS.EncodingType.Base64 });
  return `data:${type};base64,${b64}`;
}

/** Opens a data: URL — new tab on web, the system viewer / share sheet on iOS & Android. */
export async function openDataUrl(dataUrl: string, name: string) {
  const type = dataUrl.slice(5, dataUrl.indexOf(';'));
  if (Platform.OS === 'web') {
    const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const FS = await import('expo-file-system/legacy');
  const ext = type === 'application/pdf' ? 'pdf' : type.split('/')[1] ?? 'bin';
  const path = `${FS.cacheDirectory}${name.replace(/[^\w-]+/g, '_').slice(0, 40)}.${ext}`;
  await FS.writeAsStringAsync(path, dataUrl.slice(dataUrl.indexOf(',') + 1), { encoding: FS.EncodingType.Base64 });
  const Sharing = await import('expo-sharing');
  await Sharing.shareAsync(path, { mimeType: type, dialogTitle: name });
}
