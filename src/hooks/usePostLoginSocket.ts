"use client";
import { useEffect } from 'react';
import { socketClient } from '@/lib/SocketClient';

/**
 * Hook to handle socket connection after successful login
 *
 * This hook checks for the 'just_logged_in' session storage flag
 * that is set during login and ensures the socket connection
 * is established with appropriate delays for cookie processing.
 */
export function usePostLoginSocket() {
  useEffect(() => {
    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('just_logged_in');

    if (justLoggedIn === 'true') {
      console.log('[usePostLoginSocket] Detected fresh login, clearing flag and preparing socket connection');

      // Clear the flag immediately to prevent re-triggering
      sessionStorage.removeItem('just_logged_in');

      // Give time for cookies to be set, authentication middleware to process,
      // and page to fully load before attempting socket connection
      const connectionDelay = 1000; // 1 second delay

      setTimeout(() => {
        console.log('[usePostLoginSocket] Attempting socket connection after login');

        socketClient.connect()
          .then(() => {
            console.log('[usePostLoginSocket] Socket connection successful after login');
            const state = socketClient.getState();
            console.log('[usePostLoginSocket] Current socket state:', state);
          })
          .catch((error) => {
            console.error('[usePostLoginSocket] Socket connection failed after login:', error);

            // Retry once after a longer delay if first attempt fails
            console.log('[usePostLoginSocket] Retrying socket connection after 2 seconds...');
            setTimeout(() => {
              socketClient.connect()
                .then(() => {
                  console.log('[usePostLoginSocket] Socket retry connection successful');
                })
                .catch((retryError) => {
                  console.error('[usePostLoginSocket] Socket retry connection failed:', retryError);
                });
            }, 2000);
          });
      }, connectionDelay);
    }
  }, []); // Empty dependency array ensures this runs only once on mount
}