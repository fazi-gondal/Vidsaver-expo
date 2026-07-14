import {
  Box,
  Column,
  HorizontalDivider,
  Icon,
  IconButton,
  Row,
  Text,
  Spacer,
} from "@expo/ui/jetpack-compose";
import {
  background,
  fillMaxWidth,
  height,
  padding,
  weight,
  width,
  clip,
  Shapes,
} from "@expo/ui/jetpack-compose/modifiers";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme/colors";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  /** Leading icon XML asset (require()'d). */
  leadingIcon?: number;
  onLeadingPress?: () => void;
  /** Trailing (right) action icon XML asset (require()'d). */
  trailingIcon?: number;
  onTrailingPress?: () => void;
  /** Show the bottom divider (SurfaceVariant). Default true. */
  showDivider?: boolean;
}

/**
 * Solid Material You app header (prompt.md §5).
 * Standardized height + status-bar inset. No gradients.
 * Background color matches bottom tab bar (#F8FAFC).
 */
export function AppHeader({
  title,
  subtitle,
  badgeText,
  leadingIcon,
  onLeadingPress,
  trailingIcon,
  onTrailingPress,
  showDivider = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = subtitle ? 64 : 56;

  return (
    <Column
      modifiers={[
        fillMaxWidth(),
        background(colors.surface),
      ]}
    >
      <Row
        verticalAlignment="center"
        modifiers={[
          fillMaxWidth(),
          padding(4, insets.top, 4, 0),
          height(headerHeight),
        ]}
      >
        {/* Leading: app logo / menu icon */}
        {leadingIcon && (
          <IconButton
            onClick={onLeadingPress}
            colors={{ contentColor: colors.textPrimary }}
          >
            <Icon source={leadingIcon} size={24} tint={colors.textPrimary} />
          </IconButton>
        )}

        {/* Center/Left: Title & Subtitle / Badge area */}
        <Box
          contentAlignment="centerStart"
          modifiers={[weight(1), padding(16, 0, 16, 0)]}
        >
          <Column>
            <Row verticalAlignment="center">
              <Text
                style={{ fontSize: 20, fontWeight: "700" }}
                color={colors.textPrimary}
              >
                {title}
              </Text>
              {badgeText && (
                <>
                  <Spacer modifiers={[width(8)]} />
                  <Box
                    modifiers={[
                      background(colors.primaryContainer),
                      padding(8, 3, 8, 3),
                      clip(Shapes.RoundedCorner(10)),
                    ]}
                  >
                    <Text
                      style={{ fontSize: 11, fontWeight: "700" }}
                      color={colors.primary}
                    >
                      {badgeText}
                    </Text>
                  </Box>
                </>
              )}
            </Row>
            {subtitle && (
              <>
                <Spacer modifiers={[height(2)]} />
                <Text
                  style={{ fontSize: 12 }}
                  color={colors.textSecondary}
                >
                  {subtitle}
                </Text>
              </>
            )}
          </Column>
        </Box>

        {/* Trailing: action icon */}
        {trailingIcon && (
          <IconButton
            onClick={onTrailingPress}
            colors={{ contentColor: colors.textPrimary }}
          >
            <Icon source={trailingIcon} size={24} tint={colors.textPrimary} />
          </IconButton>
        )}
      </Row>
      {showDivider && <HorizontalDivider color={colors.surfaceVariant} />}
    </Column>
  );
}
