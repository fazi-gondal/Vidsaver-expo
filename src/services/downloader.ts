import ReactNativeBlobUtil from "react-native-blob-util";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";

// ── Config ───────────────────────────────────────────────────────────────
// TikTok: fetched directly from TikWM public API (no backend needed).
// Instagram: routed through your self-hosted FastAPI backend.
// Set EXPO_PUBLIC_API_URL in .env to your backend URL.
//   • Android emulator → http://10.0.2.2:8000
//   • Real device (same Wi-Fi) → http://<local-ip>:8000
//   • Deployed → https://your-server.com
const TIKTOK_API = "https://www.tikwm.com/api/";
const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "https://fastapi-u8bm.onrender.com";

// ── Types ────────────────────────────────────────────────────────────────
export interface VideoFormat {
  id: string;
  label: string;    // e.g. "HD • No Watermark"
  size: string;     // e.g. "12.4 MB"
  sizeBytes?: number;
  url?: string;     // resolved CDN URL
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  author: string;
  platform: "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "VIDEO";
  duration: string;
  formats: VideoFormat[];
  /** Best download URL already resolved (set for TikTok HD) */
  directUrl?: string;
}

export interface DownloadRecord {
  id: string;
  title: string;
  platform: VideoInfo["platform"];
  author: string;
  size: string;
  date: string;
  url: string;
  thumbnail?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function detectPlatform(url: string): VideoInfo["platform"] {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com") || u.includes("vm.tiktok") || u.includes("vt.tiktok")) return "TIKTOK";
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "INSTAGRAM";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YOUTUBE";
  return "VIDEO";
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── TikTok via TikWM ─────────────────────────────────────────────────────

async function fetchTikTokInfo(url: string): Promise<VideoInfo> {
  const apiUrl = `${TIKTOK_API}?url=${encodeURIComponent(url)}&hd=1`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`TikWM request failed (${res.status})`);

  const json = await res.json() as {
    code: number;
    msg?: string;
    data?: {
      title?: string;
      cover?: string;
      duration?: number;
      hdplay?: string;
      play?: string;
      size?: number;
      hd_size?: number;
      author?: { nickname?: string };
    };
  };

  if (json.code !== 0 || !json.data) {
    throw new Error(`TikWM error: ${json.msg ?? "Unknown error"}`);
  }

  const d = json.data;
  const hdUrl = d.hdplay ?? d.play ?? "";
  const sizeBytes = d.hd_size ?? d.size ?? 0;
  const sizeMB = sizeBytes > 0 ? `${(sizeBytes / 1_048_576).toFixed(1)} MB` : "—";

  return {
    title: d.title ?? "TikTok Video",
    thumbnail: d.cover ?? "",
    author: d.author?.nickname ?? "Unknown",
    platform: "TIKTOK",
    duration: formatDuration(d.duration ?? 0),
    directUrl: hdUrl,
    formats: [
      {
        id: "hd",
        label: "HD • No Watermark",
        size: sizeMB,
        sizeBytes,
        url: hdUrl,
      },
    ],
  };
}

// ── Instagram via FastAPI backend ─────────────────────────────────────────

async function fetchInstagramInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${API_URL}/api/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(body.detail ?? `Backend error (${res.status})`);
  }

  const json = await res.json() as {
    success?: boolean;
    data?: {
      title?: string;
      thumbnail?: string;
      uploader?: string;
      duration?: number;
    };
  };

  if (!json.success || !json.data) {
    throw new Error("Backend returned no data");
  }

  const d = json.data;
  return {
    title: d.title ?? "Instagram Video",
    thumbnail: d.thumbnail ?? "",
    author: d.uploader ?? "Unknown",
    platform: "INSTAGRAM",
    duration: formatDuration(d.duration ?? 0),
    formats: [{ id: "default", label: "Best Quality", size: "—" }],
  };
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Fetch video metadata. Routes to TikWM (TikTok) or FastAPI backend (Instagram).
 */
export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const platform = detectPlatform(url);
  if (platform === "TIKTOK") {
    return fetchTikTokInfo(url);
  }
  // Instagram + others → FastAPI backend
  return fetchInstagramInfo(url);
}

/**
 * Resolve the best direct download URL for a given video URL.
 * For TikTok: uses the already-resolved `directUrl` from VideoInfo.
 * For Instagram: calls POST /api/get-direct-url on the FastAPI backend.
 */
async function resolveDownloadUrl(url: string, videoInfo?: VideoInfo): Promise<string> {
  console.log("Resolving download URL via backend for:", url);
  const res = await fetch(`${API_URL}/api/get-direct-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    console.error(`Backend failed to resolve URL (status: ${res.status})`);
    throw new Error(`Could not resolve download URL (${res.status})`);
  }

  const json = await res.json() as {
    success?: boolean;
    data?: { direct_url?: string };
  };
  const directUrl = json.data?.direct_url;
  if (!directUrl) {
    console.error("Backend returned empty direct_url:", json);
    throw new Error("No download URL returned by backend");
  }
  console.log("Successfully resolved download URL:", directUrl);
  return directUrl;
}

/**
 * Download a video and save it to the device Downloads folder + gallery.
 * The file will be visible in:
 *   • Files → Downloads  (direct path write via react-native-blob-util)
 *   • Gallery / video player  (registered via expo-media-library)
 * Reports download progress through the callback (0–100).
 */
export async function downloadVideo(
  url: string,
  onProgress?: (percent: number) => void,
  videoInfo?: VideoInfo
): Promise<string> {
  // 1. Resolve a streamable CDN URL
  const downloadUrl = await resolveDownloadUrl(url, videoInfo);

  // 2. Request media library permission upfront (non-blocking ask)
  const { status } = await MediaLibrary.requestPermissionsAsync();

  // 3. Download to a temporary file in the secure Cache directory using expo-file-system.
  // This uses Expo's native HTTP downloader (based on OkHttp) which handles redirects,
  // SSL, chunked stream encoding, and progress updates with maximum stability.
  const filename = `vidsaver_${generateId()}.mp4`;
  const tempPath = `${FileSystem.cacheDirectory}${filename}`;

  console.log("Starting file download using expo-file-system to:", tempPath);
  const isTiktok = detectPlatform(url) === "TIKTOK";
  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    tempPath,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
        ...(isTiktok ? { "Referer": "https://tiktok.com/" } : {}),
      }
    },
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        const percent = Math.round(
          (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
        );
        onProgress(percent);
      }
    }
  );

  const downloadResult = await downloadResumable.downloadAsync();
  if (!downloadResult) {
    throw new Error("Download failed: Server returned an empty response");
  }

  const statusCode = downloadResult.status;
  const tempSavedPath = downloadResult.uri.replace("file://", "");
  console.log(`Download completed with HTTP status: ${statusCode}, saved to: ${tempSavedPath}`);

  if (statusCode < 200 || statusCode >= 300) {
    try {
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    } catch {}
    throw new Error(`Download failed: Server returned HTTP status ${statusCode}`);
  }

  let finalPath = tempSavedPath;

  // 4. Save to user-visible Download/Vidsaver folder using Android MediaStore
  try {
    const destName = `vidsaver_${generateId()}.mp4`;
    const mediaUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
      {
        name: destName,
        parentFolder: "Vidsaver", // Subfolder under public Downloads folder
        mimeType: "video/mp4",
      },
      "Download", // Target collection
      tempSavedPath
    );
    finalPath = mediaUri || tempSavedPath;
  } catch (err) {
    console.warn("copyToMediaStore failed, attempting direct folder copy fallback:", err);
    // Fallback for older Android versions or devices without standard MediaStore
    try {
      const publicFolder = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/Vidsaver`;
      if (!(await ReactNativeBlobUtil.fs.isDir(publicFolder))) {
        await ReactNativeBlobUtil.fs.mkdir(publicFolder);
      }
      const publicPath = `${publicFolder}/${filename}`;
      await ReactNativeBlobUtil.fs.cp(tempSavedPath, publicPath);
      finalPath = publicPath;
    } catch (fallbackErr) {
      console.error("Fallback folder copy failed:", fallbackErr);
    }
  }

  // 5. Clean up the temporary file from app Cache
  try {
    await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
  } catch (e) {
    console.warn("Could not delete temporary cache file:", e);
  }

  // 6. Register with MediaLibrary so it is guaranteed to index immediately in the Gallery / video player
  if (status === "granted") {
    try {
      await MediaLibrary.createAssetAsync(finalPath);
    } catch (err) {
      console.warn("MediaLibrary.createAssetAsync failed:", err);
    }
  }

  return finalPath;
}

/**
 * Create a download record for the downloads list.
 */
export function createDownloadRecord(info: VideoInfo, size: string, localPath: string): DownloadRecord {
  return {
    id: generateId(),
    title: info.title,
    platform: info.platform,
    author: info.author,
    size,
    date: formatDate(),
    url: localPath,
    thumbnail: info.thumbnail,
  };
}
