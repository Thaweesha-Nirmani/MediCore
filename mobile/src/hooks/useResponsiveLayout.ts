import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export const responsiveBreakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type ResponsiveContentWidth = 'narrow' | 'form' | 'page' | 'wide' | 'full';

const contentMaxWidths: Record<Exclude<ResponsiveContentWidth, 'full'>, number> = {
  narrow: 520,
  form: 960,
  page: 1160,
  wide: 1320,
};

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isSmUp = width >= responsiveBreakpoints.sm;
    const isMdUp = width >= responsiveBreakpoints.md;
    const isLgUp = width >= responsiveBreakpoints.lg;
    const isXlUp = width >= responsiveBreakpoints.xl;
    const isTabletUp = isMdUp;
    const isDesktopUp = isLgUp;
    const supportsTwoColumnForm = width >= 820;
    const supportsThreeColumnGrid = width >= 1120;
    const horizontalPadding = isXlUp ? 40 : isLgUp ? 32 : isMdUp ? 24 : isSmUp ? 20 : 16;
    const topPadding = isLgUp ? 28 : isMdUp ? 24 : 20;
    const bottomPadding = isLgUp ? 152 : isMdUp ? 136 : 120;
    const sectionGap = isLgUp ? 20 : 16;

    function getContentMaxWidth(variant: ResponsiveContentWidth = 'page') {
      if (variant === 'full') {
        return undefined;
      }

      return contentMaxWidths[variant];
    }

    return {
      width,
      height,
      isSmUp,
      isMdUp,
      isLgUp,
      isXlUp,
      isTabletUp,
      isDesktopUp,
      supportsTwoColumnForm,
      supportsThreeColumnGrid,
      horizontalPadding,
      topPadding,
      bottomPadding,
      sectionGap,
      getContentMaxWidth,
    };
  }, [height, width]);
}
