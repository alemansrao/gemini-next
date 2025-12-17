"use client";
import { MdSend } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { LuClipboardPaste } from "react-icons/lu";
import { addToast, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import NavbarComponent from "./components/Navbar";
import { CiCircleChevUp } from "react-icons/ci";
// Added import from helper file (including constants)
import {
	updateHasScrollbar,
	createScrollHandler,
	setupResizeObserver,
	scrollToTop as helperScrollToTop,
	DEFAULT_MESSAGES,
	API_KEY_STORAGE_KEY
} from "./helpers/chatHelpers";

export default function Page() {
	const router = useRouter();
	const [messages, setMessages] = useState(DEFAULT_MESSAGES);
	const [input, setInput] = useState("");
	const [firstMessageSent, setFirstMessageSent] = useState(false);
	const [loading, setLoading] = useState(false);
	const messagesRef = useRef(null);
	const [hasScrollbar, setHasScrollbar] = useState(false);
	const [isAtTop, setIsAtTop] = useState(true);
	const [chatTitle, setChatTitle] = useState("");
	const scrollToTop = () => {
		helperScrollToTop(messagesRef.current, hasScrollbar, setIsAtTop);
	};

	// New helper: calls /api/title with API key and message passed in the JSON body, returns chat title
	const fetchChatTitle = async (apiKey, message) => {
		try {
			const res = await fetch("/api/title", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ message, apiKey })
			});
			if (!res.ok) {
				const txt = await res.text();
				throw new Error(txt || `Status ${res.status}`);
			}
			const data = await res.json();
			return data.chatTitle || data.title || null;
		} catch (e) {
			console.error("fetchChatTitle error:", e);
			return null;
		}
	};

	useEffect(() => {
		if (messagesRef.current) {
			setTimeout(() => {
				messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
				updateHasScrollbar(messagesRef.current, setHasScrollbar, setIsAtTop);
			}, 0);
		}
	}, [messages]);

	// Modified: observe size changes, window resize and scroll to keep detection accurate
	useEffect(() => {
		const el = messagesRef.current;
		if (!el) return;

		// create stable callbacks for listeners so cleanup works
		const resizeCb = () => updateHasScrollbar(el, setHasScrollbar, setIsAtTop);
		const onScroll = createScrollHandler(el, setIsAtTop);

		// Use helper to setup ResizeObserver when available
		let ro = setupResizeObserver(el, resizeCb);

		// attach scroll listener
		el.addEventListener("scroll", onScroll);

		// Also listen to window resize as a fallback
		window.addEventListener("resize", resizeCb);

		// cleanup
		return () => {
			el.removeEventListener("scroll", onScroll);
			if (ro && ro.disconnect) ro.disconnect();
			window.removeEventListener("resize", resizeCb);
		};
	}, []);

	const sendMessage = async () => {
		if (!firstMessageSent) {
			// mark as sent immediately so we don't block subsequent sends
			setFirstMessageSent(true);

			// fire off title fetch in background (do NOT await)
			const key = typeof window !== "undefined" ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
			if (key && input.trim()) {
				fetchChatTitle(key, input)
					.then((title) => {
						if (title) setChatTitle(title);
					})
					.catch((e) => {
						console.error("Error fetching title:", e);
					});
			}
		}


		if (!input.trim()) return;

		const newMessages = [
			...messages,
			{ role: "user", content: input }
		];

		setMessages(newMessages);
		setInput("");
		setLoading(true);

		// Check for stored API key using constant
		const cat = typeof window !== "undefined" ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
		if (!cat) {
			// show toast and redirect to settings
			addToast({
				title: "API Key Missing",
				description: "Please add your Gemini API key in Settings.",
				color: "warning",
			});
			router.push("/settings");
			setLoading(false);
			return;
		}

		try {
			console.log("Sending messages:", newMessages);
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-gemini-api-key": cat
				},
				body: JSON.stringify({ messages: newMessages })
			});
			console.log("Response status:", res.status);
			const data = await res.json();
			console.log("Response data:", data.error);
			if (data.reply) {
				setMessages(prev => [
					...prev,
					{ role: "model", content: data.reply }
				]);
			}
			if (data.error) {
				setMessages(prev => [
					...prev,
					{ role: "model", content: data.error }
				]);
			}
		} catch (e) {
			console.log(e);
			setMessages(prev => [
				...prev,
				{ role: "model", content: 'error' }
			]);
		}

		setLoading(false);
	};
	const copyContent = (content) => () => {
		navigator.clipboard.writeText(content);
		addToast({
			title: "Copied to Clipboard",
			description: "Content has been copied to clipboard.",
			color: "success",
		});
	};

	return (
		<div className="flex flex-col h-screen bg-base-200">
			{/* HEADER */}
			<NavbarComponent chattitle={chatTitle} />
			{ /* Render the scroll-to-top button only when a scrollbar exists AND we are not already at top */}
			{chatTitle && (
				<AnimatePresence>
					<motion.div
						key="chat-header"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						className="w-full font-bold bg-cyan-950 flex flex-row justify-between items-center text-content1 sm:hidden h-[4em] p-6"
					>
						<p>{chatTitle}</p>
						<AnimatePresence>
							{hasScrollbar && !isAtTop && (
								<motion.div
									key="scroll-top"
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -8 }}
									transition={{ duration: 0.18 }}
									className="flex items-center"
								>
									<CiCircleChevUp
										className="cursor-pointer"
										size={38}
										title="Scroll to top"
										role="button"
										tabIndex={0}
										onClick={scrollToTop}
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</motion.div>
				</AnimatePresence>
			)}

			{/* CHAT AREA */}
			<div ref={messagesRef} className="flex-1 overflow-y-auto space-y-4 px-2 md:px-24">
				{messages.slice(1).map((msg, index) => (

					<div key={index} className={`chat gap-0 md:gap-1.5 ${msg.role === "user" ? "chat-end " : "chat-start"
						}`}>
						{msg.role === "model" && (
							<div className="chat-image avatar">
								<div className="w-5 md:w-10 rounded-full">
									<img
										onClick={copyContent(msg.content)}
										alt="Tailwind CSS chat bubble component"
										src="gemini_logo.png"
									/>
								</div>
							</div>
						)}
						{msg.role === "user" && (
							<div className="chat-image avatar">
								<div className="w-5 md:w-10 rounded-full border border-white md:p-2 p-1">
									<img
										alt="Tailwind CSS chat bubble component"
										className=""
										onClick={copyContent(msg.content)}
										src="./user.png"
										//invert the colors of the image
										style={{ filter: "invert(1)" }}
									/>
								</div>
							</div>
						)}

						<AnimatePresence>
							<motion.div
								key={index}
								//if role is user, animate from right, else from left
								initial={{ opacity: 0, x: msg.role === "user" ? 50 : -50 }}
								animate={{ opacity: 1, x: 0, y: 0 }}


								className={`chat-bubble wrap-break-word rounded-4xl   ${msg.role === "user"
									? "bg-primary text-primary-content chat-bubble-info max-w-4/5 md:max-w-3/5 "
									: "  text-black max-w-4/5 md:max-w-3/5 selection:bg-yellow-400  chat-bubble-info"
									}`}
								transition={{ duration: 0.25 }}>
								<ReactMarkdown>
									{msg.content}
								</ReactMarkdown>
								{/* </div> */}
							</motion.div>
						</AnimatePresence>

					</div>
				))}
				<AnimatePresence>
					{
						loading &&

						<div className={`chat chat-start`}>
							<div className="chat-image avatar">
								<div className="w-10 rounded-full">
									<img
										alt="Tailwind CSS chat bubble component"
										src="gemini_logo.png"
									/>
								</div>
							</div>


							<AnimatePresence>
								<motion.div
									//if role is user, animate from right, else from left
									initial={{ opacity: 0, x: -50 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 50 }}


									className={`chat-bubble rounded-4xl text-black max-w-4/5 md:max-w-3/5 selection:bg-yellow-400  chat-bubble-info wrap-anywhere`}
									transition={{ duration: 0.25 }}>
									Typing...
								</motion.div>
							</AnimatePresence>

						</div>
					}
				</AnimatePresence>
			</div>

			{/* INPUT BAR */}
			<div className="p-4 flex items-center gap-3 md:px-12">
				{/* <textarea
					className="textarea flex-1 resize-none h-16"
					placeholder="Type prompt..."

					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey && !loading) {
							e.preventDefault();
							sendMessage();
						}
					}}
				/> */}
				<Textarea
					label="Prompt"
					variant="flat"
					className="dark"
					onChange={(e) => setInput(e.target.value)}
					value={input}
					maxRows={4}
					placeholder="Enter your prompt..."
					onKeyDown={(e) => {
						//only send message on Enter without Shift
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							if (input.trim() && !loading) {
								sendMessage();
							}
						}
					}}
				/>

				{!input ? (<LuClipboardPaste
					onClick={async () => {
						const text = await navigator.clipboard.readText();
						setInput(text);
					}}
					color="black"
					className="btn rounded-full bg-amber-400 h-14 w-14"
				/>
				) : (
					<MdSend
						disabled={loading}
						color="black"
						className="btn rounded-full bg-amber-400 h-14 w-14"
						onClick={sendMessage}
					/>
				)}



			</div>
		</div>
	);
}
