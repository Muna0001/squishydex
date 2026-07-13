import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius } from "@/lib/theme";

// Web barcode scanner: getUserMedia + the browser's BarcodeDetector
// (Chrome/Edge/Android). Safari/Firefox don't ship BarcodeDetector —
// the scan screen always offers manual entry as the fallback, so this
// component only needs to degrade politely.

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
    };
  }
}

export function BarcodeScanner({ onScanned }: { onScanned: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "unsupported" | "denied">(
    "starting"
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.BarcodeDetector || !navigator.mediaDevices) {
      setStatus("unsupported");
      return;
    }

    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let done = false;

    const detector = new window.BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"],
    });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        video.play();
        setStatus("scanning");
        timer = setInterval(async () => {
          if (done || !videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              done = true;
              onScanned(codes[0].rawValue);
            }
          } catch {
            // Transient decode errors are normal between frames.
          }
        }, 400);
      })
      .catch(() => setStatus("denied"));

    return () => {
      done = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onScanned]);

  if (status === "unsupported") {
    return (
      <View style={[styles.box, styles.center]}>
        <Text style={styles.hint}>
          This browser can't scan with the camera — type the barcode below instead. (Chrome and
          most Android browsers support scanning.)
        </Text>
      </View>
    );
  }

  if (status === "denied") {
    return (
      <View style={[styles.box, styles.center]}>
        <Text style={styles.hint}>
          Camera access was blocked — allow it in the browser, or type the barcode below.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      {/* react-native-web renders on react-dom, so a raw <video> works here. */}
      {React.createElement("video", {
        ref: videoRef,
        muted: true,
        playsInline: true,
        style: { width: "100%", height: "100%", objectFit: "cover" },
      })}
      <View style={styles.reticle} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 1,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: "#1A171E",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  hint: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
  reticle: {
    position: "absolute",
    left: "15%",
    right: "15%",
    top: "35%",
    bottom: "35%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
  },
});
