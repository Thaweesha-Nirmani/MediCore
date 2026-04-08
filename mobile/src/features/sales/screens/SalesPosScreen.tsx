import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/feedback/EmptyState';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { SalesCartItem } from '@/features/sales/components/SalesCartItem';
import { SalesLookupItem } from '@/features/sales/components/SalesLookupItem';
import { useSaleBarcodeLookup, useSaleMedicineSearch } from '@/features/sales/hooks/useSales';
import { useSalesCartStore } from '@/features/sales/store/useSalesCartStore';
import { getSalesPermissions } from '@/features/sales/utils/sales-access';
import { formatSalesCurrency } from '@/features/sales/utils/sales-display';

import type { BillingLookupMedicine, CartItem } from '@/features/sales/types';

export function SalesPosScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const permissions = getSalesPermissions(user?.role);
  const [searchText, setSearchText] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const debouncedSearch = useDebouncedValue(searchText.trim(), 250);
  const medicineSearchQuery = useSaleMedicineSearch(debouncedSearch, 10, false);
  const barcodeLookup = useSaleBarcodeLookup();
  const items = useSalesCartStore((state) => state.items);
  const addMedicine = useSalesCartStore((state) => state.addMedicine);
  const removeItem = useSalesCartStore((state) => state.removeItem);
  const incrementQuantity = useSalesCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useSalesCartStore((state) => state.decrementQuantity);

  const cartSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );
  const lookupItems = medicineSearchQuery.data || [];
  const canUseBarcode = searchText.trim().length >= 1;
  const queryError = medicineSearchQuery.error || barcodeLookup.error || null;
  const roleTitle =
    permissions.role === 'cashier'
      ? 'Cashier workspace'
      : permissions.role === 'pharmacist'
        ? 'Dispensing and billing'
        : 'Sales operations';
  const roleCopy =
    permissions.role === 'cashier'
      ? 'Look up medicines, confirm stock, and complete checkout with the fewest possible taps.'
      : permissions.role === 'pharmacist'
        ? 'Move quickly between medicine lookup, availability review, and safe invoice completion.'
        : 'Monitor billing activity while keeping the sales counter fast and accurate.';

  if (!permissions.canRead) {
    return (
      <AppScreen>
        <View style={styles.stateBox}>
          <AppText variant="title">Access restricted</AppText>
          <AppText>Your role does not have permission to use sales and billing.</AppText>
        </View>
      </AppScreen>
    );
  }

  function applyAddResult(result: { ok: boolean; message?: string }) {
    setBannerMessage(result.ok ? '' : result.message || 'Unable to add this medicine.');
  }

  function addLookupMedicine(medicine: BillingLookupMedicine) {
    applyAddResult(addMedicine(medicine));
  }

  async function handleBarcodeLookup() {
    try {
      const medicine = await barcodeLookup.mutateAsync(searchText.trim());
      addLookupMedicine(medicine);
    } catch {
      setBannerMessage('');
    }
  }

  function renderLookupItem({ item }: { item: BillingLookupMedicine }) {
    return <SalesLookupItem item={item} onPress={() => addLookupMedicine(item)} />;
  }

  function renderCartItem({ item }: { item: CartItem }) {
    return (
      <SalesCartItem
        item={item}
        onIncrement={() => applyAddResult(incrementQuantity(item.medicineId))}
        onDecrement={() => {
          setBannerMessage('');
          decrementQuantity(item.medicineId);
        }}
        onRemove={() => {
          setBannerMessage('');
          removeItem(item.medicineId);
        }}
      />
    );
  }

  return (
    <AppScreen contentWidth="wide">
      <FlatList
        data={items}
        keyExtractor={(item) => item.medicineId}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <AppCard variant="hero">
              <View style={styles.heroContent}>
                <View style={[styles.titleRow, !responsive.isMdUp && styles.stackColumn]}>
                  <View style={styles.titleBlock}>
                    <AppText variant="caption">{roleTitle}</AppText>
                    <AppText variant="title">Search, add, and bill fast</AppText>
                    <AppText>{roleCopy}</AppText>
                  </View>
                  <AppButton
                    label="History"
                    variant="secondary"
                    onPress={() => router.push(appRoutes.salesHistory as Href)}
                  />
                </View>

                <View style={styles.heroMetrics}>
                  <View
                    style={[
                      styles.metricCard,
                      responsive.isLgUp
                        ? styles.thirdWidth
                        : responsive.isMdUp
                          ? styles.halfWidth
                          : styles.fullWidth,
                    ]}
                  >
                    <AppText variant="caption">Selected items</AppText>
                    <AppText variant="subtitle">{items.length}</AppText>
                  </View>
                  <View
                    style={[
                      styles.metricCard,
                      responsive.isLgUp
                        ? styles.thirdWidth
                        : responsive.isMdUp
                          ? styles.halfWidth
                          : styles.fullWidth,
                    ]}
                  >
                    <AppText variant="caption">Total units</AppText>
                    <AppText variant="subtitle">{totalUnits}</AppText>
                  </View>
                  <View
                    style={[
                      styles.metricCard,
                      responsive.isLgUp
                        ? styles.thirdWidth
                        : responsive.isMdUp
                          ? styles.halfWidth
                          : styles.fullWidth,
                    ]}
                  >
                    <AppText variant="caption">Cart value</AppText>
                    <AppText variant="subtitle">{formatSalesCurrency(cartSubtotal)}</AppText>
                  </View>
                </View>
              </View>
            </AppCard>

            <AppCard variant="subtle">
              <AppTextField
                label="Medicine or barcode"
                value={searchText}
                onChangeText={(value) => {
                  setBannerMessage('');
                  barcodeLookup.reset();
                  setSearchText(value);
                }}
                placeholder="Search medicine or enter barcode"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                helperText="Search by brand, generic, strength, dosage form, or scan-ready barcode."
              />

              <View style={[styles.quickActions, !responsive.isMdUp && styles.stackColumn]}>
                <AppButton
                  label={barcodeLookup.isPending ? 'Checking barcode' : 'Lookup barcode'}
                  loading={barcodeLookup.isPending}
                  variant="secondary"
                  onPress={() => {
                    void handleBarcodeLookup();
                  }}
                  disabled={!canUseBarcode}
                  style={styles.actionButton}
                />
                <AppButton
                  label={items.length ? `Checkout (${items.length})` : 'Checkout'}
                  onPress={() => router.push(appRoutes.salesCheckout as Href)}
                  disabled={!items.length}
                  style={styles.actionButton}
                />
              </View>

              {bannerMessage ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: `${theme.colors.warning}12`,
                      borderColor: `${theme.colors.warning}45`,
                    },
                  ]}
                >
                  <AppText style={{ color: theme.colors.warning }}>{bannerMessage}</AppText>
                </View>
              ) : null}

              {queryError ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: `${theme.colors.danger}10`,
                      borderColor: `${theme.colors.danger}45`,
                    },
                  ]}
                >
                  <AppText style={{ color: theme.colors.danger }}>
                    {getErrorMessage(queryError, 'Unable to search medicines right now.')}
                  </AppText>
                </View>
              ) : null}
            </AppCard>

            <View style={styles.resultsBlock}>
              <View style={[styles.sectionHeader, !responsive.isMdUp && styles.stackColumn]}>
                <View style={styles.sectionTitleBlock}>
                  <AppText variant="subtitle">Quick medicine matches</AppText>
                  <AppText variant="caption">
                    {debouncedSearch.length >= 2
                      ? `${lookupItems.length} ready-to-add results`
                      : 'Type at least 2 characters to start lookup'}
                  </AppText>
                </View>
                {debouncedSearch.length >= 2 ? (
                  <View style={styles.sectionCounter}>
                    <AppText variant="label">{lookupItems.length}</AppText>
                  </View>
                ) : null}
              </View>

              {medicineSearchQuery.isLoading && debouncedSearch.length >= 2 ? (
                <View style={styles.inlineLoader}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <AppText variant="caption">Searching medicines...</AppText>
                </View>
              ) : lookupItems.length ? (
                <FlatList
                  data={lookupItems}
                  keyExtractor={(item) => item.id}
                  renderItem={renderLookupItem}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  scrollEnabled={false}
                />
              ) : (
                <EmptyState
                  compact
                  icon="search-outline"
                  title={
                    debouncedSearch.length >= 2
                      ? 'No matches found'
                      : 'Start typing to search medicines'
                  }
                  message={
                    debouncedSearch.length >= 2
                      ? 'Try another medicine name, generic term, or barcode.'
                      : 'Quick medicine matches will appear here as you type.'
                  }
                />
              )}
            </View>

            <AppCard variant="subtle">
              <View style={[styles.cartSummaryRow, !responsive.isMdUp && styles.stackColumn]}>
                <View style={styles.summaryCopy}>
                  <AppText variant="caption">Cart</AppText>
                  <AppText variant="subtitle">{items.length} medicines ready for billing</AppText>
                  <AppText variant="caption">{totalUnits} units across current invoice</AppText>
                </View>
                <View style={styles.summaryValues}>
                  <AppText variant="caption">Subtotal</AppText>
                  <AppText variant="subtitle">{formatSalesCurrency(cartSubtotal)}</AppText>
                </View>
              </View>
            </AppCard>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="basket-outline"
            title="Cart is empty"
            message="Add medicines from the lookup results to start the sale."
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        refreshControl={
          <RefreshControl
            refreshing={medicineSearchQuery.isRefetching}
            onRefresh={() => {
              void medicineSearchQuery.refetch();
            }}
            tintColor={theme.colors.primary}
          />
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 4,
  },
  heroContent: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    gap: 4,
    minWidth: 0,
  },
  fullWidth: {
    flexBasis: '100%',
  },
  halfWidth: {
    flexBasis: '48%',
  },
  thirdWidth: {
    flexBasis: '31.5%',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultsBlock: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 3,
  },
  sectionCounter: {
    alignItems: 'center',
    minWidth: 44,
  },
  inlineLoader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryCopy: {
    flex: 1,
    gap: 3,
  },
  summaryValues: {
    alignItems: 'flex-end',
    gap: 3,
  },
  centeredText: {
    maxWidth: 420,
    textAlign: 'center',
  },
  stateBox: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
});
