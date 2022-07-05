import { useCallback } from "react";
import { useLayoutEffect } from "react";
import { useRef } from "react";

export function useEvent<T extends (...args: any[]) => any>(handler: T): T {
  const handlerRef = useRef<T>();

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args: any[]) => {
    return handlerRef.current?.(...args);
  }, []) as T;
}
