import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { AppText } from '@/components/ui/AppText';
import { useGenericNameAutocomplete } from '@/features/medicines/hooks/useMedicines';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppTheme } from '@/theme/useAppTheme';

type GenericNameAutocompleteProps = {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  containerStyle?: object;
};

export function GenericNameAutocomplete({
  value,
  onChangeText,
  error,
  containerStyle,
}: GenericNameAutocompleteProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebouncedValue(value, 300);

  const { data: suggestions, isFetching } = useGenericNameAutocomplete(debouncedQuery);

  const showDropdown = isFocused && debouncedQuery.length >= 2 && suggestions && suggestions.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <AppTextField
        label="Generic name"
        required
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          // Delay blur to allow touch events on dropdown
          setTimeout(() => setIsFocused(false), 200);
        }}
        error={error}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.borderStrong,
              shadowColor: theme.colors.shadowStrong,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
            {isFetching && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            {!isFetching && suggestions?.map((suggestion, index) => (
              <TouchableOpacity
                key={`${suggestion}-${index}`}
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: theme.colors.borderSoft },
                  index === suggestions.length - 1 && styles.lastItem,
                ]}
                onPress={() => {
                  onChangeText(suggestion);
                  setIsFocused(false);
                }}
              >
                <AppText style={{ color: theme.colors.text }}>{suggestion}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 68, // Adjust based on AppTextField height
    left: 0,
    right: 0,
    borderWidth: 1,
    maxHeight: 200,
    zIndex: 9999,
    elevation: 5, // For Android
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownScroll: {
    flexGrow: 1,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  loadingContainer: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
