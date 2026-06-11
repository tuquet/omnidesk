import { isTauri } from '@tauri-apps/api/core';

/**
 * Helper to synchronously check if the current user agent belongs to a mobile OS.
 */
const isMobileUA = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
};

/**
 * Checks if the application is running in a Desktop environment (Tauri Native).
 * 
 * Future-proofing: Tauri v2 supports both Desktop and Mobile (Android/iOS).
 * We check the user agent to ensure we don't accidentally apply Desktop-only 
 * UI (like Window Controls, Resize Handles) on a Tauri Mobile app.
 */
export const isDesktop = (): boolean => {
  return isTauri() && !isMobileUA();
};

/**
 * Checks if the application is running on any Mobile device.
 * This includes BOTH Web Browsers on Mobile AND Tauri Mobile Native Apps.
 */
export const isMobile = (): boolean => {
  return isMobileUA();
};

/**
 * Checks if the application is specifically running as a Tauri Mobile Native App (Android/iOS).
 */
export const isTauriMobile = (): boolean => {
  return isTauri() && isMobileUA();
};

/**
 * Checks if the application is running in a standard Web Browser (Desktop or Mobile).
 */
export const isWeb = (): boolean => {
  return !isTauri();
};
