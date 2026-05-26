import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Payload emitted when FCM mints or refreshes a registration token.
 */
export type TokenReceivedEvent = {
  /**
   * The current FCM registration token. This is the same value that
   * `FCMPlugin.getToken()` would return immediately after this event fires.
   * Receiving it via the listener avoids the iOS race between APNs
   * registration completing and FCM exchanging the APNs token for an FCM
   * registration token.
   */
  token: string;
};

export interface FirebaseOptions {
  /**
   * The Firebase app ID (mobilesdk_app_id on Android, GOOGLE_APP_ID on iOS).
   */
  applicationId: string;
  /**
   * The GCM sender ID (project_number on Android / iOS).
   * Required on iOS; ignored on Android (deprecated in Firebase Android SDK 29+).
   */
  gcmSenderId: string;
  /**
   * The Firebase API key.
   */
  apiKey: string;
  /**
   * The Firebase project ID.
   */
  projectId: string;
}

export interface FCMPlugin {
  /**
   * Subscribe to fcm topic
   * @param options
   */
  subscribeTo(options: { topic: string }): Promise<{ message: string }>;

  /**
   * Unsubscribe from fcm topic
   * @param options
   */
  unsubscribeFrom(options: { topic: string }): Promise<{ message: string }>;

  /**
   * Get fcm token to eventually use from a serve
   *
   * Recommended to use this instead of
   * @usage
   * ```typescript
   * PushNotifications.addListener("registration", (token) => {
   *   console.log(token.data);
   * });
   * ```
   * because the native capacitor method, for apple, returns the APN's token
   */
  getToken(): Promise<{ token: string }>;

  /**
   * Refresh fcm token to eventually use from a serve
   *
   * Recommended to use this instead of
   * @usage
   * ```typescript
   * PushNotifications.addListener("registration", (token) => {
   *   console.log(token.data);
   * });
   * ```
   * because the native capacitor method, for apple, returns the APN's token
   */
  refreshToken(): Promise<{ token: string }>;

  /**
   * Remove local fcm instance completely
   */
  deleteInstance(): Promise<boolean>;

  /**
   * Enabled/disabled auto initialization.
   * @param options
   */
  setAutoInit(options: { enabled: boolean }): Promise<void>;

  /**
   * Retrieve the auto initialization status.
   */
  isAutoInitEnabled(): Promise<{ enabled: boolean }>;

  /**
   * Subscribe to fresh FCM registration tokens.
   *
   * The `tokenReceived` event fires whenever the underlying Firebase
   * Messaging SDK delivers a new or refreshed token to the device.
   *
   * **iOS only.** Emitted from
   * `MessagingDelegate.messaging(_:didReceiveRegistrationToken:)`. This fires
   * shortly after `PushNotifications.register()` succeeds (once FCM has
   * exchanged the APNs device token for an FCM registration token), and
   * again on any subsequent token rotation (e.g. `refreshToken()`, app
   * reinstall, restored from backup).
   *
   * **Android**: this event does not fire. Use the `registration` event from
   * `@capacitor/push-notifications` instead. On Android its `value` is already
   * the FCM token, and it fires again whenever FCM rotates the token:
   *
   * ```ts
   * PushNotifications.addListener('registration', ({ value }) => saveFcmToken(value));
   * ```
   *
   * **When to use this listener over `getToken()`:**
   * Prefer this event for persisting the token to your backend.
   * `getToken()` can return a stale value on iOS if called immediately after
   * `PushNotifications.register()` because the FCM ↔ APNs exchange has not
   * yet completed.
   *
   * @example
   * ```ts
   * const handle = await FCM.addListener('tokenReceived', async ({ token }) => {
   *   await saveFcmToken(token);
   * });
   * // later: await handle.remove();
   * ```
   */
  addListener(
    eventName: 'tokenReceived',
    listenerFunc: (event: TokenReceivedEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all event listeners registered on this plugin.
   */
  removeAllListeners(): Promise<void>;

  /**
   * Initialize Firebase with runtime credentials instead of relying on a
   * static google-services.json / GoogleService-Info.plist. Intended for
   * multi-tenant apps where the correct Firebase project is only known after
   * the user authenticates.
   *
   * Must be called before PushNotifications.register() / getToken().
   *
   * Platform notes:
   * - Android: creates a named secondary FirebaseApp ("FCM") so it does not
   *   conflict with any default app already initialized from google-services.json.
   *   getToken() / refreshToken() are automatically routed through it.
   * - iOS: configures the default FirebaseApp when no GoogleService-Info.plist
   *   is present. Do not ship GoogleService-Info.plist when using this method
   *   on iOS. Re-initialization after first configure is not supported (Firebase
   *   SDK limitation).
   */
  setFirebaseOptions(options: FirebaseOptions): Promise<void>;
}
