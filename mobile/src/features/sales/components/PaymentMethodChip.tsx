import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';

import { formatPaymentMethodLabel } from '@/features/sales/utils/sales-display';

type PaymentMethodChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export function PaymentMethodChip({
  label,
  active = false,
  onPress,
}: PaymentMethodChipProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.surfaceElevated : theme.colors.surfaceMuted,
          borderColor: active ? `${theme.colors.primary}42` : theme.colors.borderSoft,
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
        {formatPaymentMethodLabel(label)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
