import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';

type AppDateFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  placeholder?: string;
  allowClear?: boolean;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function AppDateField({
  label,
  value,
  onChangeText,
  error,
  helperText,
  required = false,
  containerStyle,
  placeholder = 'Select date',
  allowClear = true,
}: AppDateFieldProps) {
  const [visible, setVisible] = useState(false);
  const selectedDate = useMemo(() => parseDateInput(value), [value]);
  const initialMonth = useMemo(() => startOfMonth(selectedDate || new Date()), [selectedDate]);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  useEffect(() => {
    if (visible) {
      setCurrentMonth(initialMonth);
    }
  }, [initialMonth, visible]);

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={containerStyle}>
        <View pointerEvents="none">
          <AppTextField
            label={label}
            value={value}
            editable={false}
            error={error}
            helperText={helperText}
            required={required}
            placeholder={placeholder}
            rightAccessory={<CalendarAccessory />}
          />
        </View>
      </Pressable>

      <DatePickerModal
        visible={visible}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        onClose={() => setVisible(false)}
        onPreviousMonth={() => setCurrentMonth((current) => addMonths(current, -1))}
        onNextMonth={() => setCurrentMonth((current) => addMonths(current, 1))}
        onSelectDate={(date) => {
          onChangeText(formatDateValue(date));
          setVisible(false);
        }}
        onClear={
          allowClear
            ? () => {
                onChangeText('');
                setVisible(false);
              }
            : undefined
        }
      />
    </>
  );
}

function CalendarAccessory() {
  const theme = useAppTheme();

  return (
    <View style={styles.accessory}>
      <Ionicons color={theme.colors.primary} name="calendar-outline" size={18} />
    </View>
  );
}

function DatePickerModal({
  visible,
  currentMonth,
  selectedDate,
  onClose,
  onPreviousMonth,
  onNextMonth,
  onSelectDate,
  onClear,
}: {
  visible: boolean;
  currentMonth: Date;
  selectedDate: Date | null;
  onClose: () => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onClear?: () => void;
}) {
  const theme = useAppTheme();
  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: 'rgba(4, 11, 22, 0.56)' }]} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.modalShell}>
          <AppCard
            variant="hero"
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.borderStrong,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText variant="subtitle">Choose date</AppText>
              <View style={styles.monthNav}>
                <MonthButton icon="chevron-back" onPress={onPreviousMonth} />
                <AppText variant="label">{formatMonthLabel(currentMonth)}</AppText>
                <MonthButton icon="chevron-forward" onPress={onNextMonth} />
              </View>
            </View>

            <View style={styles.weekdayRow}>
              {weekdayLabels.map((label) => (
                <AppText key={label} variant="caption" style={styles.weekdayLabel}>
                  {label}
                </AppText>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day, index) => {
                if (!day) {
                  return <View key={`blank-${index}`} style={styles.dayCell} />;
                }

                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => onSelectDate(day)}
                    style={[
                      styles.dayCell,
                      styles.dayButton,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : isToday
                            ? theme.colors.primarySoft
                            : 'transparent',
                        borderColor: isSelected
                          ? theme.colors.primary
                          : isToday
                            ? theme.colors.primary
                            : theme.colors.borderSoft,
                        borderRadius: theme.radius.md,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isSelected ? '#FFFFFF' : theme.colors.heading,
                        textAlign: 'center',
                      }}
                    >
                      {day.getDate()}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionRow}>
              {onClear ? (
                <AppButton label="Clear" onPress={onClear} variant="secondary" />
              ) : null}
              <AppButton label="Close" onPress={onClose} variant="secondary" />
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MonthButton({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.monthButton,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Ionicons color={theme.colors.heading} name={icon} size={16} />
    </Pressable>
  );
}

function buildCalendarDays(monthDate: Date) {
  const start = startOfMonth(monthDate);
  const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const leadingBlanks = start.getDay();
  const days: Array<Date | null> = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(start.getFullYear(), start.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function parseDateInput(value: string) {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!usMatch) {
    return null;
  }

  const [, month, day, year] = usMatch;
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(left: Date | null, right: Date | null) {
  if (!left || !right) {
    return false;
  }

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const styles = StyleSheet.create({
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingLeft: 4,
    paddingRight: 12,
  },
  overlay: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalShell: {
    width: '100%',
  },
  modalCard: {
    alignSelf: 'center',
    borderWidth: 1,
    maxWidth: 420,
    width: '100%',
  },
  modalHeader: {
    gap: 12,
  },
  monthNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    minWidth: 0,
    width: '13.2%',
  },
  dayButton: {
    alignItems: 'center',
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
});
