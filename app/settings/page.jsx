"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Input, Button, Card, addToast, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  // Keep the initial value identical on server and client to avoid hydration mismatch.
  // Read localStorage only after mount.
  const [apiKey, setApiKey] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("geminiApiKey") || "";
    setApiKey(stored);
    setMounted(true);
  }, []);

  const onChange = (e) => {
    const v = e.target.value;
    setApiKey(v);
    // update immediately in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("geminiApiKey", v);
    }
  };

  const onSaveClick = () => {
    addToast({
      title: "API Key Saved",
      color: "success",
      description: "Gemini API key saved to local storage.",
    });
  };

  const onClear = () => {
    setApiKey("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("geminiApiKey");
    }
    addToast({
      title: "API Key Removed",
      color: "warning",
      description: "Gemini API key removed from local storage.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-base-200">
      {/* HEADER */}
      <div className="p-4 shadow-md bg-base-100 sticky top-0 z-20">
        <Image src="/gemini.png" alt="Gemini Logo" width={100} height={50} />
      </div>

      {/* SETTINGS CONTENT */}
      <div className="flex-1 flex flex-col md:flex-row items-start justify-center p-8 gap-2">
        <Card className="w-full max-w-2xl p-6 bg-base-100">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          <p className="text-sm text-base-content/60 mb-4">
            Set your Gemini API key below. This value is stored locally in your browser.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Gemini API Key</label>
            {/* Render with same initial markup as server (empty string). After mount the value will be populated. */}
            <Input
              placeholder="Enter Gemini API key"
              value={apiKey}
              onChange={onChange}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onSaveClick} className="btn-primary" disabled={!mounted}>
              Save
            </Button>
            <Button onClick={onClear} color="danger" className="btn-outline" disabled={!mounted}>
              Clear
            </Button>
            <Button onClick={() => router.push("/")} className="ml-auto">
              Back
            </Button>
          </div>
        </Card>
        <Card className="w-full max-w-2xl p-6 bg-base-100">
          <h2 className="text-2xl font-semibold mb-4">Settings</h2>
          <p className="text-sm text-base-content/60 mb-4">
            Set your Gemini system prompt.
          </p>

          <div className="mb-4">
            <Textarea/>
          </div>

          <div className="flex gap-3">
            <Button onClick={onSaveClick} className="btn-primary">
              Save
            </Button>
            <Button onClick={onClear} color="danger" className="btn-outline">
              Clear
            </Button>
            <Button onClick={() => router.push("/")} className="ml-auto">
              Back
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}