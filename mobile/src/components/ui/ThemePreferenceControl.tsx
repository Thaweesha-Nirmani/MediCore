import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemeMode, ThemePreference } from '@/theme/theme';
import { useAppTheme } from '@/theme/useAppTheme';

import { AppText } from '@/components/ui/AppText';

type ThemePreferenceControlProps = {
  variant?: 'compact' | 'segmented';
  includeSystem?: boolean;
  style?: StyleProp<ViewStyle>;
};

const themeOptions: Array<{
  key: ThemePreference;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  {
    key: 'light',
    label: 'Light',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    label: 'Dark',
    icon: 'moon-outline',
  },
  {
    key: 'system',
    label: 'System',
    icon: 'phone-portrait-outline',
  },
];

export function ThemePreferenceControl({
  variant = 'segmented',
  includeSystem = false,
  style,
}: ThemePreferenceControlProps) {
  const theme = useAppTheme();

  if (variant === 'compact') {
    const nextMode: ThemeMode = theme.resolvedThemeMode === 'dark' ? 'light' : 'dark';
    const icon = nextMode === 'dark' ? 'moon-outline' : 'sunny-outline';
    const label = nextMode === 'dark' ? 'Switch to dark theme' : 'Switch to light theme';

    return (
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => {
          void theme.setThemePreference(nextMode);
        }}
        style={({ pressed }) => [
          styles.compactPressable,
          style,
          {
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.compactSurface,
            {
              backgroundColor: theme.isDark ? 'rgba(24,40,63,0.52)' : 'rgba(255,255,255,0.24)',
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <View style={styles.compactContent}>
            <Ionicons color={theme.colors.heading} name={icon} size={17} />
          </View>
        </View>
      </Pressable>
    );
  }

  const options = includeSystem ? themeOptions : themeOptions.filter((option) => option.key !== 'system');

  return (
    <View style={[styles.segmentedRow, style]}>
      {options.map((option) => {
        const isActive = theme.themePreference === option.key;

        return (
          <Pressable
            key={option.key}
            accessibilityLabel={`Use ${option.label.toLowerCase()} theme`}
            accessibilityRole="button"
            onPress={() => {
              void theme.setThemePreference(option.key);
            }}
            style={({ pressed }) => [
              styles.segmentPressable,
              {
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.segmentOption,
                {
                  backgroundColor: isActive
                    ? theme.colors.primarySoft
                    : theme.isDark
                      ? 'rgba(24,40,63,0.52)'
                      : 'rgba(255,255,255,0.22)',
                  borderColor: isActive ? `${theme.colors.primary}52` : theme.colors.borderSoft,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <Ionicons
                color={isActive ? theme.colors.primary : theme.colors.mutedText}
                name={option.icon}
                size={16}
              />
              <AppText
                variant="caption"
                style={{
                  color: isActive ? theme.colors.primary : theme.colors.mutedText,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  compactPressable: {
    alignSelf: 'flex-end',
  },
  compactSurface: {
    borderWidth: 1,
    minHeight: 36,
    minWidth: 36,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  compactContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 9,
  },
  segmentedRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  segmentPressable: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  segmentOption: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});
