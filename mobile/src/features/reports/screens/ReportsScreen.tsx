import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { AppScreen } from '@/components/layout/AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import {
  useExpiryReport,
  usePurchaseReport,
  useReportsCatalog,
  useSalesReport,
  useStockReport,
} from '@/features/reports/hooks/useReports';
import { getReportPermissions } from '@/features/reports/utils/report-access';
import {
  createDefaultReportFilters,
  formatReportCurrency,
  formatReportDate,
  formatStatusLabel,
  getStockReportCaption,
  validateReportFilters,
} from '@/features/reports/utils/report-display';

import type { ReportFilterValues } from '@/features/reports/types';

const REPORT_TYPES: ReportFilterValues['reportType'][] = ['sales', 'stock', 'expiry', 'purchases'];
const EXPIRY_WINDOWS: ReportFilterValues['window'][] = ['all', '7', '30'];

export function ReportsScreen() {
  const theme = useAppTheme();
  const { user } = useAuthSession();
  const permissions = getReportPermissions(user?.role);
  const [filters, setFilters] = useState<ReportFilterValues>(createDefaultReportFilters());
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 250);
  const debouncedLocation = useDebouncedValue(filters.location.trim(), 250);
  const filterErrors = useMemo(() => validateReportFilters(filters), [filters]);
  const hasFilterErrors = Object.keys(filterErrors).length > 0;
  const reportRangeValid = !filterErrors.dateFrom && !filterErrors.dateTo;
  const topLimit = filterErrors.topLimit ? 5 : Number(filters.topLimit) || 5;
  const catalogQuery = useReportsCatalog();

  const salesReportQuery = useSalesReport({
    dateFrom: reportRangeValid ? filters.dateFrom : undefined,
    dateTo: reportRangeValid ? filters.dateTo : undefined,
    topLimit,
  });
  const stockReportQuery = useStockReport({
    search: debouncedSearch || undefined,
    location: debouncedLocation || undefined,
    status: filters.status.trim().toLowerCase() || undefined,
    page: 1,
    limit: 12,
  });
  const expiryReportQuery = useExpiryReport({
    search: debouncedSearch || undefined,
    location: debouncedLocation || undefined,
    window: filters.window,
    page: 1,
    limit: 12,
  });
  const purchaseReportQuery = usePurchaseReport({
    dateFrom: reportRangeValid ? filters.dateFrom : undefined,
    dateTo: reportRangeValid ? filters.dateTo : undefined,
    topLimit,
  });

  const activeQuery = useMemo(() => {
    switch (filters.reportType) {
      case 'stock':
        return stockReportQuery;
      case 'expiry':
        return expiryReportQuery;
      case 'purchases':
        return purchaseReportQuery;
      default:
        return salesReportQuery;
    }
  }, [expiryReportQuery, filters.reportType, purchaseReportQuery, salesReportQuery, stockReportQuery]);

  if (!permissions.canRead) {
    return (
      <ErrorState
        title="Reports restricted"
        message="Your role does not have permission to open reports."
      />
    );
  }

  function updateFilter<K extends keyof ReportFilterValues>(field: K, value: ReportFilterValues[K]) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetFilters() {
    const defaults = createDefaultReportFilters();
    setFilters({
      ...defaults,
      reportType: filters.reportType,
    });
  }

  const initialLoad = activeQuery.isLoading && !activeQuery.data && !catalogQuery.data;

  if (initialLoad) {
    return (
      <AppScreen>
        <ScrollView contentContainerStyle={styles.container}>
          <AppCard variant="hero">
            <View style={styles.hero}>
              <AppText variant="caption">Reports</AppText>
              <AppText variant="title">Loading reporting workspace</AppText>
              <AppText>Preparing report filters, summaries, and result sections.</AppText>
            </View>
          </AppCard>
        </ScrollView>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeQuery.isRefetching || catalogQuery.isRefetching}
            onRefresh={() => {
              void Promise.all([activeQuery.refetch(), catalogQuery.refetch()]);
            }}
          />
        }
      >
        <AppCard variant="hero">
          <View style={styles.hero}>
            <AppText variant="caption">Reports</AppText>
            <AppText variant="title">Focused operational reporting</AppText>
            <AppText>
              Choose one report at a time, apply only the filters you need, and keep results easy
              to scan on mobile.
            </AppText>

            <View style={styles.heroMetrics}>
              <View style={styles.metricShell}>
                <AppText variant="caption">Active report</AppText>
                <AppText variant="subtitle">{formatStatusLabel(filters.reportType)}</AppText>
              </View>
              <View style={styles.metricShell}>
                <AppText variant="caption">Available</AppText>
                <AppText variant="subtitle">{catalogQuery.data?.items.length || 4}</AppText>
              </View>
              <View style={styles.metricShell}>
                <AppText variant="caption">Status</AppText>
                <AppText variant="subtitle">
                  {activeQuery.isFetching ? 'Refreshing' : 'Ready'}
                </AppText>
              </View>
            </View>
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <AppText variant="subtitle">Report type</AppText>
          <View style={styles.chipRow}>
            {REPORT_TYPES.map((type) => (
              <InventoryFilterChip
                key={type}
                label={formatStatusLabel(type)}
                active={filters.reportType === type}
                onPress={() => updateFilter('reportType', type)}
              />
            ))}
          </View>
        </AppCard>

        <AppCard variant="subtle">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
              <AppText variant="subtitle">Filters</AppText>
              <AppText variant="caption">
                Keep filters minimal so results stay readable on mobile. Results refresh
                automatically when the current filters are valid.
              </AppText>
            </View>
            <AppButton label="Reset" variant="secondary" onPress={resetFilters} />
          </View>

          {filters.reportType === 'sales' || filters.reportType === 'purchases' ? (
            <>
              <View style={styles.row}>
                <AppTextField
                  label="Date from"
                  required
                  value={filters.dateFrom}
                  onChangeText={(value) => updateFilter('dateFrom', value)}
                  placeholder="YYYY-MM-DD"
                  containerStyle={styles.field}
                  error={filterErrors.dateFrom}
                  helperText="Start date"
                />
                <AppTextField
                  label="Date to"
                  required
                  value={filters.dateTo}
                  onChangeText={(value) => updateFilter('dateTo', value)}
                  placeholder="YYYY-MM-DD"
                  containerStyle={styles.field}
                  error={filterErrors.dateTo}
                  helperText="End date"
                />
              </View>
              <AppTextField
                label="Top results"
                required
                value={filters.topLimit}
                onChangeText={(value) => updateFilter('topLimit', value)}
                keyboardType="number-pad"
                inputMode="numeric"
                error={filterErrors.topLimit}
                helperText="How many top medicines or suppliers to show"
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <AppTextField
                  label="Search"
                  value={filters.search}
                  onChangeText={(value) => updateFilter('search', value)}
                  placeholder="Medicine, barcode, or batch"
                  containerStyle={styles.field}
                  error={filterErrors.search}
                  helperText="Optional"
                />
                <AppTextField
                  label="Location"
                  value={filters.location}
                  onChangeText={(value) => updateFilter('location', value)}
                  placeholder="MAIN_STORE"
                  containerStyle={styles.field}
                  error={filterErrors.location}
                  helperText="Optional"
                />
              </View>
              {filters.reportType === 'stock' ? (
                <AppTextField
                  label="Status"
                  value={filters.status}
                  onChangeText={(value) => updateFilter('status', value)}
                  placeholder="low_stock, available, expired"
                  error={filterErrors.status}
                  helperText="Optional stock filter"
                />
              ) : (
                <View style={styles.chipRow}>
                  {EXPIRY_WINDOWS.map((window) => (
                    <InventoryFilterChip
                      key={window}
                      label={window === 'all' ? 'All windows' : `${window} days`}
                      active={filters.window === window}
                      onPress={() => updateFilter('window', window)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </AppCard>

        {hasFilterErrors ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${theme.colors.warning}12`,
                borderColor: `${theme.colors.warning}45`,
              },
            ]}
          >
            <AppText style={{ color: theme.colors.warning }}>
              Review the highlighted filter fields. Report results keep the last valid range until
              these values are corrected.
            </AppText>
          </View>
        ) : null}

        {activeQuery.error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${theme.colors.danger}10`,
                borderColor: `${theme.colors.danger}45`,
              },
            ]}
          >
            <AppText style={{ color: theme.colors.danger }}>
              {getErrorMessage(activeQuery.error, 'Unable to load this report right now.')}
            </AppText>
          </View>
        ) : null}

        {filters.reportType === 'sales' && salesReportQuery.data ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                title="Net revenue"
                value={formatReportCurrency(salesReportQuery.data.summary.netTotal)}
              />
              <MetricCard title="Invoices" value={String(salesReportQuery.data.summary.saleCount)} />
            </View>
            <View style={styles.metricRow}>
              <MetricCard title="Units sold" value={String(salesReportQuery.data.summary.unitsSold)} />
              <MetricCard
                title="Avg sale"
                value={formatReportCurrency(salesReportQuery.data.summary.averageSaleValue)}
              />
            </View>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Payment methods</AppText>
              <View style={styles.sectionList}>
                {salesReportQuery.data.paymentMethods.map((item) => (
                  <ResultRow
                    key={item.method}
                    title={formatStatusLabel(item.method)}
                    subtitle={`${item.saleCount} sales • refunds ${formatReportCurrency(item.refundAmount)}`}
                    value={formatReportCurrency(item.totalAmount)}
                    detail={formatReportCurrency(item.grossAmount)}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Top medicines</AppText>
              <View style={styles.sectionList}>
                {salesReportQuery.data.topMedicines.map((item) => (
                  <ResultRow
                    key={`${item.medicineId}-${item.catalogMedicineId}`}
                    title={item.name || item.catalogMedicineId}
                    subtitle={`${item.unitsSold} units • ${item.invoiceCount} invoices`}
                    value={formatReportCurrency(item.revenue)}
                    detail={item.genericName || item.catalogMedicineId}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Status summary</AppText>
              <View style={styles.sectionList}>
                {salesReportQuery.data.summary.statusBreakdown.map((item) => (
                  <ResultRow
                    key={item.status}
                    title={formatStatusLabel(item.status)}
                    subtitle={`${item.count} invoices`}
                    value={formatReportCurrency(item.total)}
                  />
                ))}
              </View>
            </AppCard>
          </>
        ) : null}

        {filters.reportType === 'stock' && stockReportQuery.data ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                title="Batches"
                value={String(stockReportQuery.data.meta?.summary.totalBatches || 0)}
              />
              <MetricCard
                title="Available"
                value={String(stockReportQuery.data.meta?.summary.availableQuantity || 0)}
              />
            </View>
            <View style={styles.metricRow}>
              <MetricCard
                title="Low stock"
                value={String(stockReportQuery.data.meta?.summary.lowStockCount || 0)}
              />
              <MetricCard
                title="Expired"
                value={String(stockReportQuery.data.meta?.summary.expiredCount || 0)}
              />
            </View>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Stock results</AppText>
              <View style={styles.sectionList}>
                {stockReportQuery.data.items.map((item) => (
                  <ResultRow
                    key={item.id}
                    title={item.name || item.catalogMedicineId}
                    subtitle={getStockReportCaption(item)}
                    value={`${item.availableQuantity} available`}
                    detail={formatStatusLabel(item.stockStatus)}
                  />
                ))}
              </View>
            </AppCard>
          </>
        ) : null}

        {filters.reportType === 'expiry' && expiryReportQuery.data ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                title="Expired"
                value={String(expiryReportQuery.data.meta?.summary.expired || 0)}
              />
              <MetricCard
                title="7 days"
                value={String(expiryReportQuery.data.meta?.summary.expiringIn7Days || 0)}
              />
            </View>
            <View style={styles.metricRow}>
              <MetricCard
                title="30 days"
                value={String(expiryReportQuery.data.meta?.summary.expiringIn30Days || 0)}
              />
              <MetricCard
                title="Matches"
                value={String(expiryReportQuery.data.meta?.total || 0)}
              />
            </View>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Expiry results</AppText>
              <View style={styles.sectionList}>
                {expiryReportQuery.data.items.map((item) => (
                  <ResultRow
                    key={item.id}
                    title={item.name || item.catalogMedicineId}
                    subtitle={getStockReportCaption(item)}
                    value={formatReportDate(item.expiryDate)}
                    detail={
                      item.daysToExpire === null ? 'No expiry' : `${item.daysToExpire} days left`
                    }
                  />
                ))}
              </View>
            </AppCard>
          </>
        ) : null}

        {filters.reportType === 'purchases' && purchaseReportQuery.data ? (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                title="Spend"
                value={formatReportCurrency(purchaseReportQuery.data.summary.totalAmount)}
              />
              <MetricCard
                title="Orders"
                value={String(purchaseReportQuery.data.summary.purchaseCount)}
              />
            </View>
            <View style={styles.metricRow}>
              <MetricCard
                title="Ordered units"
                value={String(purchaseReportQuery.data.summary.unitsOrdered)}
              />
              <MetricCard
                title="Received units"
                value={String(purchaseReportQuery.data.summary.unitsReceived)}
              />
            </View>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Top suppliers</AppText>
              <View style={styles.sectionList}>
                {purchaseReportQuery.data.topSuppliers.map((item) => (
                  <ResultRow
                    key={`${item.supplierId}-${item.supplierName}`}
                    title={item.supplierName}
                    subtitle={`${item.purchaseCount} orders`}
                    value={formatReportCurrency(item.totalAmount)}
                  />
                ))}
              </View>
            </AppCard>

            <AppCard variant="subtle">
              <AppText variant="subtitle">Status summary</AppText>
              <View style={styles.sectionList}>
                {purchaseReportQuery.data.statusBreakdown.map((item, index) => (
                  <ResultRow
                    key={`${item._id || 'unknown'}-${index}`}
                    title={formatStatusLabel(item._id || 'unknown')}
                    subtitle={`${item.count} orders`}
                    value={formatReportCurrency(item.totalAmount)}
                  />
                ))}
              </View>
            </AppCard>
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <AppCard variant="subtle" style={styles.metricCardRoot}>
      <AppText variant="caption">{title}</AppText>
      <AppText variant="title" style={styles.metricValue}>
        {value}
      </AppText>
    </AppCard>
  );
}

function ResultRow({
  title,
  subtitle,
  value,
  detail,
}: {
  title: string;
  subtitle?: string;
  value: string;
  detail?: string;
}) {
  return (
    <View style={styles.resultRow}>
      <View style={styles.rowCopy}>
        <AppText>{title}</AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      <View style={styles.rightCopy}>
        <AppText>{value}</AppText>
        {detail ? <AppText variant="caption">{detail}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  hero: {
    gap: 10,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metricShell: {
    flex: 1,
    gap: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCardRoot: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 28,
  },
  sectionList: {
    gap: 12,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rightCopy: {
    alignItems: 'flex-end',
    gap: 3,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
