import { StyleSheet, View } from 'react-native';

import { AppDateField } from '@/components/ui/AppDateField';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

import type { MedicineFormValues } from '@/features/medicines/types';

type MedicineFormFieldsProps = {
  values: MedicineFormValues;
  errors: Partial<Record<keyof MedicineFormValues, string>>;
  onChange: (field: keyof MedicineFormValues, value: string) => void;
  isEdit?: boolean;
};

export function MedicineFormFields({
  values,
  errors,
  onChange,
  isEdit = false,
}: MedicineFormFieldsProps) {
  const responsive = useResponsiveLayout();

  return (
    <View style={styles.container}>
      <FormSection
        title="Identity"
        subtitle="Keep the medicine easy to recognize by its generic and brand labels."
      >
        <View style={styles.identityBanner}>
          <AppText variant="caption">Medicine ID</AppText>
          <AppText variant="subtitle">
            {values.medicineId || (isEdit ? 'Unavailable' : 'Auto-generated when you save')}
          </AppText>
          <AppText variant="caption">
            {isEdit
              ? 'This ID is fixed after creation and stays consistent across inventory and sales.'
              : 'You do not need to type this manually anymore.'}
          </AppText>
        </View>

        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Generic name"
            required
            value={values.genericName}
            onChangeText={(value) => onChange('genericName', value)}
            error={errors.genericName}
            helperText="Examples: Paracetamol, Amoxicillin."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Brand name"
            required
            value={values.brandName}
            onChangeText={(value) => onChange('brandName', value)}
            error={errors.brandName}
            helperText="Examples: Panadol, Augmentin."
            containerStyle={styles.field}
          />
        </View>

        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Category"
            required
            value={values.category}
            onChangeText={(value) => onChange('category', value)}
            error={errors.category}
            helperText="Examples: Analgesic, Antibiotic."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Supplier"
            required
            value={values.supplier}
            onChangeText={(value) => onChange('supplier', value)}
            error={errors.supplier}
            helperText="Supplier label used for medicine tracking."
            containerStyle={styles.field}
          />
        </View>
      </FormSection>

      <FormSection
        title="Pricing and stock"
        subtitle="Create the first inventory-ready batch at the same time as the medicine."
      >
        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Unit price (LKR)"
            required
            value={values.unitPrice}
            onChangeText={(value) => onChange('unitPrice', value)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            error={errors.unitPrice}
            helperText="Selling price in Sri Lankan Rupees."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Restock threshold"
            value={values.restockThreshold}
            onChangeText={(value) => onChange('restockThreshold', value)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            error={errors.restockThreshold}
            helperText="Dataset field: restock_threshold."
            containerStyle={styles.field}
          />
        </View>

        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Lead time (days)"
            value={values.leadTimeDays}
            onChangeText={(value) => onChange('leadTimeDays', value)}
            keyboardType="number-pad"
            inputMode="numeric"
            error={errors.leadTimeDays}
            helperText="Dataset field: lead_time_days."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Stock quantity"
            required
            value={values.stockQty}
            onChangeText={(value) => onChange('stockQty', value)}
            keyboardType="decimal-pad"
            inputMode="decimal"
            error={errors.stockQty}
            helperText="Starting quantity. Can be 0 or greater."
            containerStyle={styles.field}
          />
        </View>

        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Batch ID"
            required
            value={values.batchNumber}
            onChangeText={(value) => onChange('batchNumber', value)}
            error={errors.batchNumber}
            helperText="Matches dataset field batch_id."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Barcode"
            value={values.barcode}
            onChangeText={(value) => onChange('barcode', value)}
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.barcode}
            helperText="Optional scanner-friendly code."
            containerStyle={styles.field}
          />
        </View>
      </FormSection>

      <FormSection
        title="Dates and source"
        subtitle="These dates feed expiry alerts and the inventory status workflow."
      >
        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppDateField
            label="Manufacture date"
            required
            value={values.manufactureDate}
            onChangeText={(value) => onChange('manufactureDate', value)}
            placeholder="YYYY-MM-DD or MM/DD/YYYY"
            error={errors.manufactureDate}
            helperText="Dataset field: manufacture_date."
            containerStyle={styles.field}
          />
          <AppDateField
            label="Expiry date"
            required
            value={values.expiryDate}
            onChangeText={(value) => onChange('expiryDate', value)}
            placeholder="YYYY-MM-DD or MM/DD/YYYY"
            error={errors.expiryDate}
            helperText="Dataset field: expiry_date."
            containerStyle={styles.field}
          />
        </View>

        <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.rowStack]}>
          <AppTextField
            label="Manufacturer"
            value={values.manufacturer}
            onChangeText={(value) => onChange('manufacturer', value)}
            error={errors.manufacturer}
            helperText="Optional manufacturer reference."
            containerStyle={styles.field}
          />
          <AppTextField
            label="Description"
            value={values.description}
            onChangeText={(value) => onChange('description', value)}
            error={errors.description}
            helperText="Optional quick note for staff."
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
            containerStyle={styles.field}
          />
        </View>
      </FormSection>
    </View>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: React.PropsWithChildren<{ title: string; subtitle: string }>) {
  const theme = useAppTheme();

  return (
    <GlassSurface
      style={[
        styles.sectionShell,
        {
          borderRadius: theme.radius.lg,
        },
      ]}
      contentStyle={styles.sectionContent}
      accent="subtle"
      blurIntensity={theme.effects.blurSoft}
    >
      <View style={styles.sectionHeader}>
        <AppText variant="subtitle">{title}</AppText>
        <AppText variant="caption">{subtitle}</AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionShell: {
    borderWidth: 1,
  },
  sectionContent: {
    gap: 14,
    padding: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionBody: {
    gap: 14,
  },
  identityBanner: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowStack: {
    flexDirection: 'column',
  },
  field: {
    flex: 1,
  },
  descriptionInput: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
});
