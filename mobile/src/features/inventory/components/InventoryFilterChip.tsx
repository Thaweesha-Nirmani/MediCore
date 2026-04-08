import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

type InventoryFilterChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function InventoryFilterChip({
  label,
  active = false,
  onPress,
}: InventoryFilterChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.primarySoft : theme.colors.surfaceMuted,
          borderColor: active ? `${theme.colors.primary}38` : theme.colors.borderSoft,
          borderRadius: theme.radius.pill,
          shadowColor: active ? theme.colors.shadowStrong : theme.colors.shadow,
        },
      ]}
    >
      <AppText
        variant="label"
        style={{
          color: active ? theme.colors.primary : theme.colors.text,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
