import { useEffect, RefObject } from "react";

/**
 * Hook that detects clicks outside specified elements and triggers a callback.
 * 
 * @param refs - Array of refs to elements that should be excluded from triggering the callback
 * @param callback - Function to call when clicking outside all specified elements
 * @param enabled - Whether the hook is active (default: true)
 */
export function useClickOutside(
    refs: RefObject<HTMLElement | null>[],
    callback: () => void,
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            // Check if click is inside any of the ref elements
            const isInsideAny = refs.some(ref => ref.current?.contains(target));

            if (!isInsideAny) {
                callback();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [refs, callback, enabled]);
}
