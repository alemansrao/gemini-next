"use client";
import { useState, useEffect } from "react";
import { TbPrompt,TbKeyFilled } from "react-icons/tb";
import Image from "next/image";
import { Input, Button, Card, addToast, Textarea ,Select, SelectItem} from "@heroui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarComponent from "../components/Navbar";
export default function SettingsPage() {
  const router = useRouter();

  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite"); // Default model
  const [mounted, setMounted] = useState(false);

const MODELS = [
  { key: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { key: "gemini-3-flash", label: "Gemini 3 Flash" },
  { key: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
];

  // Load data from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey") || "";
    setApiKey(storedApiKey);

    const storedSystemPrompt = localStorage.getItem("systemPrompt") || "";
    setSystemPrompt(storedSystemPrompt);

    const storedSelectedModel = localStorage.getItem("selectedModel") || "gemini-2.5-flash-lite";
    setSelectedModel(storedSelectedModel);

    setMounted(true);
  }, []);

  // Handlers for API Key
  const handleApiKeyChange = (e) => {
    const value = e.target.value;
    setApiKey(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("geminiApiKey", value);
    }
  };

  const handleSaveApiKey = () => {
    addToast({
      title: "API Key Saved",
      color: "success",
      description: "Gemini API key saved to local storage.",
    });
  };

  const handleClearApiKey = () => {
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

  // Handlers for System Prompt
  const handleSystemPromptChange = (e) => {
    const value = e.target.value;
    setSystemPrompt(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("systemPrompt", value);
    }
  };


  const handleClearPrompt = () => {
    setSystemPrompt("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("systemPrompt");
    }
    addToast({
      title: "System Prompt Cleared",
      color: "warning",
      description: "System prompt cleared from local storage.",
    });
  };

  // Handlers for Model Configuration
  const handleModelChange = (e) => {
    const value = e.target.value;
    setSelectedModel(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", value);
    }
  };

  const handleApplyModelConfig = () => {
    addToast({
      title: "Model Configuration Applied",
      color: "success",
      description: "Your model settings have been updated.",
    });
  };

  const handleResetModelConfig = () => {
    setSelectedModel("gemini-pro"); // Reset to default
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", "gemini-pro");
    }
    addToast({
      title: "Model Configuration Reset",
      color: "warning",
      description: "Model settings have been reset to default.",
    });
  };

  return (
    <>
      <NavbarComponent />
      <div className="p-8 bg-base-200 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* System Prompt Section */}
          <div className="lg:col-span-1 row-span-1 lg:row-span-2 flex flex-col">
            <Card className="flex-1 bg-base-100 rounded-xl p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-semibold">System Prompt</h3>
                  <p className="text-sm text-base-content/60">
                    Set your system prompt to tailor fit model responses according to your requirements.
                  </p>
                </div>
                <TbPrompt size={32} className="text-primary" />
              </div>
              <div className="grow">
                <Textarea
                  placeholder="Enter your system prompt here..."
                  value={systemPrompt}
                  onChange={handleSystemPromptChange}
                  className="w-full h-full resize-none rounded-lg text-black"
                />
              </div>
              <div className="flex flex-row gap-3">
                <Button onPress={() => {
                  addToast({
                    title: "System Prompt Saved",
                    color: "success",
                    description: "System prompt saved to local storage.",
                  })
                }} className="btn-primary">Save Prompt</Button>
                <Button onPress={handleClearPrompt} color="danger" className="btn-outline" disabled={!mounted}>Clear Prompt</Button>
              </div>
            </Card>
          </div>

          {/* API Key Settings Section (Top Card) */}
          <div className="lg:col-span-1 row-span-1">
            <Card className="w-full bg-base-100 rounded-xl p-6 gap-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-semibold">Gemini API Key</h3>
                  <p className="text-sm text-base-content/60">
                    Manage your Gemini API key for accessing the model services.
                  </p>
                </div>
                <TbKeyFilled size={32} className="text-primary" />
              </div>
              <div className="">
                <label className="block text-sm font-medium mb-2">Gemini API Key</label>
                <Input
                  placeholder="Enter Gemini API key"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="w-full text-black"
                  type="password" // Mask the API key
                />
                <Link href="https://developers.generativeai.google/products/gemini" target="_blank" rel="noopener noreferrer" className="text-sm text-primary mt-2 inline-block">
                  Don't have an API key? Get one here.
                </Link>
              </div>
              <div className="flex gap-3">
                <Button onPress={handleSaveApiKey} className="btn-primary" disabled={!mounted}>
                  Save
                </Button>
                <Button onPress={handleClearApiKey} color="danger" className="btn-outline" disabled={!mounted}>
                  Clear
                </Button>
              </div>
            </Card>
          </div>

          {/* Model Configuration Section (Bottom Card) */}
          <div className="lg:col-span-1 row-span-1">
            <Card className="w-full bg-base-100 rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Model Configuration</h2>
              <p className="text-sm text-base-content/60 mb-6">
                Configure your preferred model and its parameters.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Model</label>
                <Input
                  placeholder="e.g., gemini-pro"
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="w-full text-content1"
                />
              </div>
              <div className="flex gap-3">
                <Button onPress={handleApplyModelConfig} className="btn-primary">Apply</Button>
                <Button onPress={handleResetModelConfig} color="danger" className="btn-outline" disabled={!mounted}>Reset</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}