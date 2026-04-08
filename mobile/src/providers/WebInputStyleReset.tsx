import { useEffect } from 'react';
import { Platform } from 'react-native';

const WEB_INPUT_RESET_STYLE_ID = 'medicore-web-input-reset';

const WEB_INPUT_RESET_CSS = `
input,
textarea {
  background-color: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
}

input:focus,
textarea:focus {
  background-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus {
  -webkit-text-fill-color: inherit !important;
  caret-color: inherit !important;
  transition: background-color 999999s ease-out 0s !important;
  box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
}
`;

export function WebInputStyleReset() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    let styleTag = document.getElementById(WEB_INPUT_RESET_STYLE_ID) as HTMLStyleElement | null;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = WEB_INPUT_RESET_STYLE_ID;
      styleTag.textContent = WEB_INPUT_RESET_CSS;
      document.head.appendChild(styleTag);
    }

    return () => {
      if (styleTag?.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, []);

  return null;
}
