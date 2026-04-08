import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';
import { KeyboardAwareScreen } from '@/components/layout/KeyboardAwareScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { getRoleLabel } from '@/constants/auth';
import { appRoutes } from '@/constants/routes';
import { useAuthSession } from '@/features/auth/hooks/useAuthSession';
import { InventoryFilterChip } from '@/features/inventory/components/InventoryFilterChip';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';
import { getErrorMessage } from '@/utils/error';

import { useCreateUser, useUpdateUser, useUserDetail } from '@/features/users/hooks/useUsers';
import { getUserPermissions } from '@/features/users/utils/user-access';
import {
  createEmptyUserFormValues,
  createUserFormValues,
  toCreateUserPayload,
  toUpdateUserPayload,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  validateUserForm,
} from '@/features/users/utils/user-form';

import type { UserFormValues } from '@/features/users/types';

type UserFormScreenProps = {
  userId?: string;
};

const userFieldLabels: Record<keyof UserFormValues, string> = {
  name: 'Full name',
  email: 'Email address',
  password: 'Temporary password',
  contactNumber: 'Contact number',
  role: 'Role',
  status: 'Initial status',
  color: 'Color',
};

export function UserFormScreen({ userId }: UserFormScreenProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { user } = useAuthSession();
  const isEdit = Boolean(userId);
  const permissions = getUserPermissions(user?.role, user?.id, userId || null);
  const userQuery = useUserDetail(userId);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(userId || '');
  const [values, setValues] = useState<UserFormValues>(createEmptyUserFormValues());
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
  const errorFieldSummary = getUserErrorSummary(errors);

  useEffect(() => {
    if (userQuery.data && isEdit) {
      setValues(createUserFormValues(userQuery.data));
    }
  }, [isEdit, userQuery.data]);

  const submitError = createMutation.error || updateMutation.error;

  if ((!isEdit && !permissions.canCreate) || (isEdit && !permissions.canManage)) {
    return (
      <ErrorState
        title="Access restricted"
        message="Only administrators can create or update staff profiles from mobile."
        actionLabel="Back to staff"
        onAction={() => router.replace(appRoutes.users as Href)}
      />
    );
  }

  if (isEdit && userQuery.isLoading) {
    return (
      <LoadingState
        title="Loading staff profile"
        message="Preparing the latest staff account details for editing."
      />
    );
  }

  if (isEdit && (userQuery.isError || !userQuery.data)) {
    return (
      <ErrorState
        title="Staff profile unavailable"
        message={getErrorMessage(userQuery.error, "We couldn't load this staff record for editing.")}
        actionLabel="Back to staff"
        onAction={() => router.replace(appRoutes.users as Href)}
      />
    );
  }

  function updateField(field: keyof UserFormValues, value: string) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    createMutation.reset();
    updateMutation.reset();
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    const nextErrors = validateUserForm(values, isEdit ? 'edit' : 'create');
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    if (isEdit && userId) {
      const updated = await updateMutation.mutateAsync(toUpdateUserPayload(values));
      router.replace(`/(tabs)/more/users/${updated.id}` as Href);
      return;
    }

    const created = await createMutation.mutateAsync(toCreateUserPayload(values));
    router.replace(`/(tabs)/more/users/${created.id}` as Href);
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <KeyboardAwareScreen contentWidth="form" contentContainerStyle={styles.container}>
          <View style={[styles.headerRow, !responsive.isMdUp && styles.stackColumn]}>
            <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
            <AppButton
              label={
                pending
                  ? isEdit
                    ? 'Saving profile'
                    : 'Creating staff'
                  : isEdit
                    ? 'Save changes'
                    : 'Create staff'
              }
              loading={pending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={pending}
            />
          </View>

          <AppCard variant="hero">
            <View style={styles.copyBlock}>
              <AppText variant="caption">
                {isEdit ? 'Edit staff profile' : 'Staff provisioning'}
              </AppText>
              <AppText variant="title">
                {isEdit ? 'Update staff account details' : 'Create a new staff account'}
              </AppText>
              <AppText>
                {isEdit
                  ? 'Keep role, contact, and account details current without changing backend behavior.'
                  : 'Create a staff account using the existing auth register API so the mobile app aligns with the web workflow.'}
              </AppText>
            </View>
          </AppCard>

          {submitError ? (
            <AppCard variant="subtle">
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: `${theme.colors.danger}10`,
                    borderColor: `${theme.colors.danger}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.danger }}>
                  {getErrorMessage(submitError, 'Unable to save this staff profile.')}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          {Object.keys(errors).length ? (
            <AppCard variant="subtle">
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor: `${theme.colors.warning}12`,
                    borderColor: `${theme.colors.warning}45`,
                  },
                ]}
              >
                <AppText style={{ color: theme.colors.warning }}>
                  {`${Object.keys(errors).length} field${Object.keys(errors).length === 1 ? '' : 's'} still need attention before you save this staff profile.`}
                </AppText>
                {errorFieldSummary ? <AppText>{errorFieldSummary}</AppText> : null}
              </View>
            </AppCard>
          ) : null}

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Identity</AppText>
              <AppText variant="caption">Basic staff identity and login details.</AppText>
            </View>

            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Full name"
                required
                value={values.name}
                onChangeText={(value) => updateField('name', value)}
                error={errors.name}
                containerStyle={styles.field}
                placeholder="Enter full name"
              />
              <AppTextField
                label="Email address"
                required
                value={values.email}
                onChangeText={(value) => updateField('email', value)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                error={errors.email}
                containerStyle={styles.field}
                placeholder="name@example.com"
              />
            </View>

            <View style={[styles.row, !responsive.supportsTwoColumnForm && styles.stackColumn]}>
              <AppTextField
                label="Contact number"
                value={values.contactNumber}
                onChangeText={(value) => updateField('contactNumber', value)}
                error={errors.contactNumber}
                containerStyle={styles.field}
                helperText="Optional. Use 10 to 15 digits."
                placeholder="+94771234567"
              />
              {!isEdit ? (
                <AppTextField
                  label="Temporary password"
                  required
                  value={values.password}
                  onChangeText={(value) => updateField('password', value)}
                  secureTextEntry
                  error={errors.password}
                  containerStyle={styles.field}
                  helperText="Minimum 6 characters."
                  placeholder="Create password"
                />
              ) : (
                <View style={styles.field} />
              )}
            </View>
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.sectionHeader}>
              <AppText variant="subtitle">Role and status</AppText>
              <AppText variant="caption">
                Match the same permissions intent used throughout the rest of the app.
              </AppText>
            </View>

            <View style={styles.optionGroup}>
              <AppText variant="caption">Role</AppText>
              <View style={styles.chipRow}>
                {USER_ROLE_OPTIONS.map((role) => (
                  <InventoryFilterChip
                    key={role}
                    label={getRoleLabel(role)}
                    active={values.role === role}
                    onPress={() => updateField('role', role)}
                  />
                ))}
              </View>
              {errors.role ? (
                <AppText variant="caption" style={{ color: theme.colors.danger }}>
                  {errors.role}
                </AppText>
              ) : null}
            </View>

            {!isEdit ? (
              <View style={styles.optionGroup}>
                <AppText variant="caption">Initial status</AppText>
                <View style={styles.chipRow}>
                  {USER_STATUS_OPTIONS.map((status) => (
                    <InventoryFilterChip
                      key={status}
                      label={status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Inactive'}
                      active={values.status === status}
                      onPress={() => updateField('status', status)}
                    />
                  ))}
                </View>
                {errors.status ? (
                  <AppText variant="caption" style={{ color: theme.colors.danger }}>
                    {errors.status}
                  </AppText>
                ) : null}
              </View>
            ) : (
              <View
                style={[
                  styles.statusNote,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.borderStrong,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <AppText variant="caption">
                  Status changes stay on the detail screen so they are deliberate and easier to review.
                </AppText>
              </View>
            )}
          </AppCard>

          <AppCard variant="subtle">
            <View style={styles.footerActions}>
              <View style={styles.footerCopy}>
                <AppText variant="subtitle">
                  {isEdit ? 'Ready to save this profile?' : 'Ready to create this staff account?'}
                </AppText>
                <AppText variant="caption">
                  {isEdit
                    ? 'The update keeps the existing auth flow and role-based access intact.'
                    : 'This will create a real account using the existing backend registration flow.'}
                </AppText>
              </View>
              <View style={[styles.footerButtons, !responsive.isMdUp && styles.stackColumn]}>
                <AppButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => router.back()}
                  style={styles.footerButton}
                />
                <AppButton
                  label={isEdit ? 'Save changes' : 'Create staff'}
                  loading={pending}
                  onPress={() => {
                    void handleSubmit();
                  }}
                  disabled={pending}
                  style={styles.footerButton}
                />
              </View>
            </View>
          </AppCard>
    </KeyboardAwareScreen>
  );
}

function getUserErrorSummary(errors: Partial<Record<keyof UserFormValues, string>>) {
  const labels = (Object.keys(userFieldLabels) as Array<keyof UserFormValues>).filter((field) =>
    Boolean(errors[field])
  );

  if (!labels.length) {
    return '';
  }

  return `Needs attention: ${labels.map((field) => userFieldLabels[field]).join(', ')}.`;
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  stateBox: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  stackColumn: {
    flexDirection: 'column',
  },
  copyBlock: {
    gap: 8,
  },
  sectionHeader: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  optionGroup: {
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusNote: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  footerActions: {
    gap: 14,
  },
  footerCopy: {
    gap: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
