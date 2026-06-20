// Augments Vitest's `expect` with jest-dom matchers (toBeInTheDocument, etc.)
import '@testing-library/jest-dom/vitest';
// Initialize i18n once for the whole test run so components that call
// useTranslation() have a ready instance (t() returns the configured strings).
import '../i18n';
