"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function usePushNotifications(user: User | null) {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  useEffect(() => {
    if (!user || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch {
        // SW not ready yet — ignore
      }
    })();
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key not configured");

      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pushSub.toJSON()),
      });

      if (!res.ok) throw new Error("Failed to save subscription");
      setSubscribed(true);
    } catch (err) {
      console.error("push subscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const pushSub = await reg.pushManager.getSubscription();
      if (!pushSub) { setSubscribed(false); return; }

      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: pushSub.endpoint }),
      });

      await pushSub.unsubscribe();
      setSubscribed(false);
    } catch (err) {
      console.error("push unsubscribe error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
