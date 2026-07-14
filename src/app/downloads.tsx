import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Host } from "@expo/ui";
import {
  Box,
  Column,
  ElevatedCard,
  Icon,
  LazyColumn,
  RNHostView,
  Row,
  SnackbarHost,
  Spacer,
  Text,
  VerticalDivider
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
  weight,
  width
} from "@expo/ui/jetpack-compose/modifiers";

import { AppHeader } from "@/components/app-header";
import type { DownloadRecord } from "@/services/downloader";
import { loadDownloads, removeDownload } from "@/services/storage";
import { colors } from "@/theme/colors";

// Module-level requires — Metro bundles all XML assets statically.
const ICON_MUSIC = require("@/assets/icons/music_note.xml");
const ICON_CAMERA = require("@/assets/icons/photo_camera.xml");
const ICON_MOVIE = require("@/assets/icons/smart_display.xml");
const ICON_DELETE = require("@/assets/icons/delete.xml");
const ICON_DOWNLOAD = require("@/assets/icons/download.xml");

export default function DownloadsScreen() {
  const insets = useSafeAreaInsets();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const snackbarRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadDownloads().then(setDownloads);
    }, [])
  );

  const handleDelete = useCallback(
    async (item: DownloadRecord) => {
      // 1. Delete physical file from device
      if (item.url) {
        try {
          const cleanPath = item.url.replace(/^file:\/\//, "");
          const fileExists = await ReactNativeBlobUtil.fs.exists(cleanPath);
          if (fileExists) {
            await ReactNativeBlobUtil.fs.unlink(cleanPath);
            console.log("Successfully deleted native file:", cleanPath);
          } else {
            console.log("Native file does not exist, skipping filesystem deletion:", cleanPath);
          }
        } catch (err) {
          console.warn("Failed to delete native file:", err);
        }
      }

      // 2. Remove from AsyncStorage list
      const updated = await removeDownload(item.id);
      setDownloads(updated);

      snackbarRef.current?.showSnackbar({
        message: "Video deleted successfully",
        duration: "short",
      });
    },
    []
  );

  const handleDeleteConfirm = useCallback((item: DownloadRecord) => {
    Alert.alert(
      "Delete Video",
      "Are you sure you want to delete this video? This will remove the record from the app and permanently delete the video file from your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(item),
        },
      ],
      { cancelable: true }
    );
  }, [handleDelete]);

  const platformColor = (p: DownloadRecord["platform"]) =>
    p === "TIKTOK"
      ? colors.tiktok
      : p === "INSTAGRAM"
        ? colors.instagram
        : p === "YOUTUBE"
          ? colors.youtube
          : colors.video;

  const platformIcon = (p: DownloadRecord["platform"]) =>
    p === "TIKTOK" ? ICON_MUSIC : p === "INSTAGRAM" ? ICON_CAMERA : ICON_MOVIE;

  return (
    <>
      <StatusBar style="dark" />
      <Host style={{ flex: 1, backgroundColor: colors.background }}>
        <Column modifiers={[fillMaxSize()]}>
          {/* ── Header ─────────────────────────────────────────── */}
          <AppHeader
            title="Downloads"
            subtitle={
              downloads.length > 0
                ? `${downloads.length} saved video${downloads.length !== 1 ? "s" : ""}`
                : "No videos saved yet"
            }
            badgeText={downloads.length > 0 ? String(downloads.length) : undefined}
            showDivider={true}
          />

          {/* ── Empty State ────────────────────────────────────── */}
          {downloads.length === 0 && (
            <Box contentAlignment="center" modifiers={[weight(1), fillMaxWidth()]}>
              <Column
                horizontalAlignment="center"
                modifiers={[paddingAll(24)]}
              >
                <Box
                  modifiers={[
                    background(colors.primaryContainer),
                    paddingAll(16),
                    clip(Shapes.Circle),
                  ]}
                >
                  <Icon source={ICON_DOWNLOAD} size={32} tint={colors.primary} />
                </Box>
                <Spacer modifiers={[height(16)]} />
                <Text
                  color={colors.textPrimary}
                  style={{ fontSize: 17, fontWeight: "600" }}
                >
                  No downloads yet
                </Text>
                <Spacer modifiers={[height(6)]} />
                <Text color={colors.textSecondary} style={{ fontSize: 14 }}>
                  Paste a link in the Home tab to start
                </Text>
              </Column>
            </Box>
          )}

          {/* ── Downloads List ─────────────────────────────────── */}
          {downloads.length > 0 && (
            <LazyColumn
              verticalArrangement={{ spacedBy: -20 }}
              modifiers={[weight(1), fillMaxWidth(), padding(10, 10, 10, 10)]}
            >
              {downloads.map((item) => (
                <ElevatedCard
                  key={item.id}
                  modifiers={[fillMaxWidth(), padding(7, 14, 7, 14), background(colors.primaryContainer)]}
                >
                  <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
                    {/* Media Thumbnail / Fallback Icon */}
                    <Box
                      modifiers={[
                        width(72),
                        height(72),
                        clip(Shapes.RoundedCorner(10)),
                        background(colors.surfaceVariant),
                      ]}
                      contentAlignment="center"
                    >
                      {item.thumbnail ? (
                        <RNHostView style={{ width: 72, height: 72 }}>
                          <Image
                            source={{ uri: item.thumbnail }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        </RNHostView>
                      ) : (
                        <Icon
                          source={platformIcon(item.platform)}
                          size={26}
                          tint={colors.primary}
                        />
                      )}
                    </Box>

                    <Spacer modifiers={[width(12)]} />

                    {/* Meta Info */}
                    <Column modifiers={[weight(1)]}>
                      {/* Platform Badge */}
                      <Box
                        modifiers={[
                          background(colors.primaryContainer),
                          padding(7, 3, 7, 3),
                          clip(Shapes.RoundedCorner(5)),
                        ]}
                      >
                        <Text
                          color={colors.primary}
                          style={{ fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}
                        >
                          {item.platform}
                        </Text>
                      </Box>

                      <Spacer modifiers={[height(6)]} />

                      {/* Title */}
                      <Text
                        overflow="ellipsis"
                        maxLines={2}
                        color={colors.textPrimary}
                        style={{ fontSize: 13, fontWeight: "600", lineHeight: 18 }}
                      >
                        {item.title}
                      </Text>

                      <Spacer modifiers={[height(6)]} />

                      {/* Size · Date */}
                      <Row verticalAlignment="center">
                        <Text color={colors.textSecondary} style={{ fontSize: 11 }}>
                          {item.size}
                        </Text>
                        <Spacer modifiers={[width(6)]} />
                        <Text color={colors.textTertiary} style={{ fontSize: 11 }}>·</Text>
                        <Spacer modifiers={[width(6)]} />
                        <Text color={colors.textSecondary} style={{ fontSize: 11 }}>
                          {item.date}
                        </Text>
                      </Row>
                    </Column>

                    <Spacer modifiers={[width(10)]} />

                    {/* Vertical separator before delete */}
                    <VerticalDivider />

                    <Spacer modifiers={[width(10)]} />

                    {/* Delete button */}
                    <Box
                      modifiers={[
                        clickable(() => handleDeleteConfirm(item)),
                        background(colors.primaryContainer),
                        paddingAll(16),
                        clip(Shapes.RoundedCorner(100)),
                      ]}
                    >
                      <Icon source={ICON_DELETE} size={20} tint={colors.error} />
                    </Box>
                  </Row>
                </ElevatedCard>
              ))}
            </LazyColumn>
          )}
        </Column>

        <SnackbarHost ref={snackbarRef} modifiers={[align("bottomCenter")]} />
      </Host>
    </>
  );
}
