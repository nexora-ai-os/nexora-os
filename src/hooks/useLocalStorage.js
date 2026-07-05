import { useEffect, useState } from "react";

function readValue(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function useLocalStorage(key, fallback, onSaved) {
  const [value, setValue] = useState(() => readValue(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      onSaved?.(new Date().toLocaleTimeString("ja-JP"));
    } catch {
      onSaved?.("保存失敗");
    }
  }, [key, value, onSaved]);

  return [value, setValue];
}
