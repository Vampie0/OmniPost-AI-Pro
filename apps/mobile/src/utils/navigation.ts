import type { Href } from 'expo-router';

/**
 * router.back() logs an unhandled `GO_BACK` error when the current screen is
 * the first entry in the navigation stack — e.g. after a browser refresh or
 * when a URL was opened directly. In that case fall back to a stable
 * destination instead of firing a dead navigation action.
 */
type BackCapableRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => unknown;
};

export function goBackOr(router: BackCapableRouter, fallback: Href = '/(tabs)'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
