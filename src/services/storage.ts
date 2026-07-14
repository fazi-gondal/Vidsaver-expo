import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DownloadRecord } from "@/services/downloader";

const KEY = "@vidsaver_downloads";

export async function loadDownloads(): Promise<DownloadRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    return stored ? (JSON.parse(stored) as DownloadRecord[]) : [];
  } catch (e) {
    console.error("Failed to load downloads:", e);
    return [];
  }
}

export async function saveDownloads(downloads: DownloadRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(downloads));
  } catch (e) {
    console.error("Failed to save downloads:", e);
  }
}

export async function addDownload(record: DownloadRecord): Promise<DownloadRecord[]> {
  const downloads = await loadDownloads();
  const updated = [record, ...downloads];
  await saveDownloads(updated);
  return updated;
}

export async function removeDownload(id: string): Promise<DownloadRecord[]> {
  const downloads = await loadDownloads();
  const updated = downloads.filter((d) => d.id !== id);
  await saveDownloads(updated);
  return updated;
}
