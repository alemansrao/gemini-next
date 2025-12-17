"use client";
import { useState, useEffect } from "react";
import { TbPrompt } from "react-icons/tb";
import Image from "next/image";
import { Input, Button, Card, addToast, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarComponent from "../components/Navbar";
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

    <>
      <NavbarComponent />
      <div className="grid grid-cols-2 grid-rows-2 gap-2 h-[calc(100vh-4em)] p-8 bg-base-200 justify-between">
        <div className="row-span-2">
          <div className="flex flex-col h-full bg-base-100 rounded-2xl p-6 gap-3">


            <div className="header flex flex-row h-12 rounded-2xl  justify-between ">
              <div className="w-fit h-full align-middle flex flex-col text-2xl font-semibold">
                System Prompt
            <p className="text-sm text-base-content/60">Set your system prompt to tailor fit model responses according to your requirements.</p>
              </div>
              <div className="w-fit h-full align-middle flex items-center font-semibold">
                <TbPrompt size={24} />
              </div>
            </div>

            <div className="flex h-full">
              <textarea name="" id="" className="w-full h-full bg-base-300 p-3 resize-none rounded-2xl">

              </textarea>
            </div>

            <div className="flex flex-row gap-3">
              <Button>Test</Button>
              <Button>Test</Button>
            </div>






          </div>
        </div>
        <div className="col-start-2  row-start-1">    <Card className="w-full h-full max-w-2xl p-6 bg-base-100">
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
              className="w-full text-black"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onSaveClick} className="btn-primary" disabled={!mounted}>
              Save
            </Button>
            <Button onClick={onClear} color="danger" className="btn-outline" disabled={!mounted}>
              Clear
            </Button>
          </div>
        </Card></div>
        <div className="col-start-2 h-full row-start-2"><Card className="h-full w-full max-w-2xl p-6 bg-base-100">
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
              className="w-full text-black"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onSaveClick} className="btn-primary" disabled={!mounted}>
              Save
            </Button>
            <Button onClick={onClear} color="danger" className="btn-outline" disabled={!mounted}>
              Clear
            </Button>
          </div>
        </Card></div>
      </div>
    </>

    // <div className="flex flex-col h-screen bg-base-200">
    //   {/* HEADER */}
    //   {/* <div className="flex flex-row items-center justify-between p-4 bg-base-100 border-b border-base-300">

    // 		<Link href="/" className="btn btn-ghost btn-sm ml-4"><Image
    // 			src="/gemini.png"
    // 			alt="Gemini Logo"
    // 			width={100}
    // 			height={50}
    // 		/></Link>
    // 		<Link href="/settings" className="btn btn-ghost btn-sm ml-4">Settings</Link>
    // 	</div>
    //    */}


    //   {/* SETTINGS CONTENT */}
    //   <div className="flex-1 flex flex-col md:flex-row items-start justify-center p-8 gap-2">


    //   </div>
    // </div>
  );
}