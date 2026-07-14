import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Host } from "@expo/ui";
import {
  Box,
  Button,
  Column,
  ElevatedCard,
  Icon,
  LinearProgressIndicator,
  LoadingIndicator,
  OutlinedTextField,
  Row,
  SnackbarHost,
  Spacer,
  Text,
  useNativeState,
  type ObservableState,
  type TextFieldRef,
} from "@expo/ui/jetpack-compose";
import {
  align,
  background,
  clickable,
  clip,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  Shapes,
  verticalScroll,
  weight,
  width
} from "@expo/ui/jetpack-compose/modifiers";

import { AppHeader } from "@/components/app-header";
import {
  createDownloadRecord,
  downloadVideo,
  fetchVideoInfo,
  type VideoInfo,
} from "@/services/downloader";
import { addDownload } from "@/services/storage";
import { colors } from "@/theme/colors";

// Module-level requires — Metro bundles all XML assets statically.
const ICON_PASTE = require("@/assets/icons/content_paste.xml");
const ICON_CLOSE = require("@/assets/icons/close.xml");
const ICON_DOWNLOAD = require("@/assets/icons/download.xml");
const ICON_SEND = require("@/assets/icons/send.xml");
const ICON_MENU = require("@/assets/icons/menu.xml");
const ICON_REFRESH = require("@/assets/icons/refresh.xml");

const URL_REGEX = /^https?:\/\/.+/i;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const snackbarRef = useRef<any>(null);
  const fieldRef = useRef<TextFieldRef>(null);

  const textState: ObservableState<string> = useNativeState("");
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastClipboard, setLastClipboard] = useState<string | null>(null);

  const setFieldText = useCallback(
    async (value: string) => {
      textState.value = value;
      setUrl(value);
    },
    [textState]
  );

  // Auto-paste a copied link on focus / launch (only if it looks like a URL).
  const tryAutoPaste = useCallback(async () => {
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;
      const clip = (await Clipboard.getStringAsync())?.trim();
      if (
        clip &&
        clip !== url &&
        clip !== lastClipboard &&
        URL_REGEX.test(clip)
      ) {
        await setFieldText(clip);
        setLastClipboard(clip);
      }
    } catch {
      /* clipboard unavailable */
    }
  }, [url, lastClipboard, setFieldText]);

  useFocusEffect(
    useCallback(() => {
      tryAutoPaste();
    }, [tryAutoPaste])
  );

  const handlePaste = useCallback(async () => {
    try {
      const clip = (await Clipboard.getStringAsync())?.trim();
      if (clip) {
        await setFieldText(clip);
        setVideo(null);
      } else {
        snackbarRef.current?.showSnackbar({
          message: "Clipboard is empty",
          duration: "short",
        });
      }
    } catch {
      snackbarRef.current?.showSnackbar({
        message: "Could not read clipboard",
        duration: "short",
      });
    }
  }, [setFieldText]);

  const handleClear = useCallback(async () => {
    await setFieldText("");
    setVideo(null);
    fieldRef.current?.clear();
  }, [setFieldText]);

  const handleFetch = useCallback(async () => {
    if (!URL_REGEX.test(url)) {
      snackbarRef.current?.showSnackbar({
        message: "Please enter a valid URL",
        duration: "short",
      });
      return;
    }

    setLoading(true);
    setVideo(null);
    try {
      const info = await fetchVideoInfo(url);
      setVideo(info);
    } catch (e) {
      snackbarRef.current?.showSnackbar({
        message:
          e instanceof Error ? e.message : "Could not fetch video info",
        duration: "long",
      });
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleDownload = useCallback(async () => {
    if (!video) return;
    setDownloading(true);
    setProgress(0);
    try {
      const localPath = await downloadVideo(url, (p) => setProgress(p), video);
      const record = createDownloadRecord(
        video,
        video.formats[0]?.size ?? "—",
        localPath
      );
      await addDownload(record);
      snackbarRef.current?.showSnackbar({
        message: "Saved to gallery & downloads",
        duration: "short",
      });
    } catch (e) {
      snackbarRef.current?.showSnackbar({
        message: e instanceof Error ? e.message : "Download failed",
        duration: "long",
      });
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }, [url, video]);

  const platformColor = (p: VideoInfo["platform"]) =>
    p === "TIKTOK"
      ? colors.tiktok
      : p === "INSTAGRAM"
        ? colors.instagram
        : p === "YOUTUBE"
          ? colors.youtube
          : colors.video;

  return (
    <>
      <StatusBar style="dark" />
      <Host style={{ flex: 1, backgroundColor: colors.background }}>
        <Column modifiers={[fillMaxSize()]}>
          <AppHeader
            title="Vidsaver"
            subtitle="Download from Instagram & TikTok"
            showDivider={true}
          />

          {/* ── Scrollable content ────────────────────────────── */}
          <Column
            modifiers={[
              weight(1),
              fillMaxWidth(),
              padding(16, 16, 16, insets.bottom + 16),
              verticalScroll(),
            ]}
          >

            <Spacer modifiers={[height(20)]} />

            {/* ── URL Input ────────────────────────────────────── */}
            <OutlinedTextField
              ref={fieldRef}
              value={textState}
              singleLine
              enabled={!downloading}
              keyboardOptions={{ keyboardType: "uri", imeAction: "go" }}
              keyboardActions={{
                onGo: (value) => {
                  setUrl(value);
                  handleFetch();
                },
              }}
              onValueChange={(value) => {
                setUrl(value);
              }}
              textStyle={{ fontSize: 15 }}
              modifiers={[fillMaxWidth()]}
              colors={{
                focusedTextColor: colors.textPrimary,
                unfocusedTextColor: colors.textPrimary,
                focusedContainerColor: colors.white,
                unfocusedContainerColor: colors.white,
                focusedIndicatorColor: colors.primary,
                unfocusedIndicatorColor: colors.outline,
                cursorColor: colors.primary,
                focusedLabelColor: colors.primary,
                unfocusedLabelColor: colors.textSecondary,
                focusedPlaceholderColor: colors.textTertiary,
                unfocusedPlaceholderColor: colors.textTertiary,
              }}
            >
              <OutlinedTextField.Label>
                <Text>Video link</Text>
              </OutlinedTextField.Label>
              <OutlinedTextField.Placeholder>
                <Text>https://...</Text>
              </OutlinedTextField.Placeholder>

              {/* Left: Compact Paste Button */}
              <OutlinedTextField.LeadingIcon>
                <Box
                  modifiers={[
                    clickable(() => handlePaste(), { indication: true }),
                    background(colors.primaryContainer),
                    padding(7, 7, 7, 7),
                    clip(Shapes.RoundedCorner(8)),
                  ]}
                >
                  <Text
                    style={{ fontSize: 11, fontWeight: "700" }}
                    color={colors.primary}
                  >
                    Paste
                  </Text>
                </Box>
              </OutlinedTextField.LeadingIcon>

              {/* Right: Clear (X) button */}
              {url.length > 0 && (
                <OutlinedTextField.TrailingIcon>
                  <Box
                    modifiers={[
                      clickable(() => handleClear(), { indication: true }),
                      background(colors.surfaceVariant),
                      paddingAll(6),
                      clip(Shapes.Circle),
                    ]}
                  >
                    <Icon source={ICON_CLOSE} size={16} tint={colors.textSecondary} />
                  </Box>
                </OutlinedTextField.TrailingIcon>
              )}
            </OutlinedTextField>

            <Spacer modifiers={[height(16)]} />

            {/* ── Fetch Button ─────────────────────────────────── */}
            <Button
              onClick={handleFetch}
              enabled={url.length > 0 && !loading}
              colors={{
                containerColor: colors.primary,
                contentColor: colors.white,
                disabledContainerColor: colors.surfaceVariant,
                disabledContentColor: colors.textTertiary,
              }}
            >
              <Text>{loading ? "Fetching..." : "Get video"}</Text>
            </Button>

            {/* ── Loading ──────────────────────────────────────── */}
            {loading && (
              <Column horizontalAlignment="center" modifiers={[fillMaxWidth(), paddingAll(24)]}>
                <LoadingIndicator />
                <Spacer modifiers={[height(8)]} />
                <Text style={{ fontSize: 13 }} color={colors.textSecondary}>
                  Fetching video info…
                </Text>
              </Column>
            )}

            {/* ── Video Preview Card ───────────────────────────── */}
            {video && !loading && (
              <>
                <Spacer modifiers={[height(20)]} />

                {/* ── Compact metadata card ── */}
                <ElevatedCard modifiers={[fillMaxWidth(), paddingAll(0)]}>
                  <Row
                    verticalAlignment="center"
                    modifiers={[fillMaxWidth(), padding(12, 12, 12, 12)]}
                  >
                    {/* Platform badge column */}
                    <Column horizontalAlignment="center" modifiers={[width(48)]}>
                      <Box
                        contentAlignment="center"
                        modifiers={[
                          background(platformColor(video.platform)),
                          padding(6, 10, 6, 10),
                          clip(Shapes.RoundedCorner(6)),
                        ]}
                      >
                        <Text
                          style={{ fontSize: 9, fontWeight: "800" }}
                          color={colors.white}
                        >
                          {video.platform}
                        </Text>
                      </Box>
                    </Column>

                    <Spacer modifiers={[width(12)]} />

                    {/* Title + meta */}
                    <Column modifiers={[weight(1)]}>
                      <Text
                        overflow="ellipsis"
                        maxLines={2}
                        style={{ fontSize: 14, fontWeight: "600" }}
                        color={colors.textPrimary}
                      >
                        {video.title}
                      </Text>
                      <Spacer modifiers={[height(4)]} />
                      <Row verticalAlignment="center">
                        <Text style={{ fontSize: 12 }} color={colors.textSecondary}>
                          {video.author}
                        </Text>
                        {video.duration !== "0:00" && (
                          <>
                            <Spacer modifiers={[width(6)]} />
                            <Text style={{ fontSize: 12 }} color={colors.textTertiary}>·</Text>
                            <Spacer modifiers={[width(6)]} />
                            <Text style={{ fontSize: 12 }} color={colors.textSecondary}>
                              {video.duration}
                            </Text>
                          </>
                        )}
                      </Row>
                      {video.formats.length > 0 && (
                        <>
                          <Spacer modifiers={[height(6)]} />
                          <Row horizontalArrangement={{ spacedBy: 6 }}>
                            {video.formats.slice(0, 2).map((f) => (
                              <Box
                                key={f.id}
                                modifiers={[
                                  background(colors.primaryContainer),
                                  padding(5, 3, 5, 3),
                                  clip(Shapes.RoundedCorner(4)),
                                ]}
                              >
                                <Text
                                  style={{ fontSize: 10, fontWeight: "600" }}
                                  color={colors.primary}
                                >
                                  {f.label}
                                </Text>
                              </Box>
                            ))}
                            {video.formats[0]?.size && video.formats[0].size !== "—" && (
                              <Text style={{ fontSize: 11 }} color={colors.textTertiary}>
                                {video.formats[0].size}
                              </Text>
                            )}
                          </Row>
                        </>
                      )}
                    </Column>
                  </Row>
                </ElevatedCard>

                {/* ── Progress bar (below card, only while downloading) ── */}
                {downloading && (
                  <>
                    <Spacer modifiers={[height(12)]} />
                    <LinearProgressIndicator
                      progress={progress / 100}
                      color={colors.primary}
                      trackColor={colors.surfaceVariant}
                      modifiers={[fillMaxWidth()]}
                    />
                    <Spacer modifiers={[height(4)]} />
                    <Text style={{ fontSize: 12 }} color={colors.textSecondary}>
                      Downloading… {progress}%
                    </Text>
                  </>
                )}

                {/* ── Save video button (below card) ── */}
                <Spacer modifiers={[height(12)]} />
                <Button
                  onClick={handleDownload}
                  enabled={!downloading}
                  colors={{
                    containerColor: colors.primary,
                    contentColor: colors.white,
                    disabledContainerColor: colors.surfaceVariant,
                    disabledContentColor: colors.textTertiary,
                  }}
                >
                  <Text>{downloading ? "Downloading…" : "Save video"}</Text>
                </Button>
              </>
            )}

          </Column>
        </Column>

        <SnackbarHost ref={snackbarRef} modifiers={[align("bottomCenter")]} />
      </Host>
    </>
  );
}

