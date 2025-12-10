"use client";
import { MdSend } from "react-icons/md";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Input, Button, Card, addToast } from "@heroui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

export default function Page() {
	const router = useRouter();

	const [messages, setMessages] = useState([{
		role: "user",
		content: "You are Swift,\n a highly efficient and straightforward AI assistant. Your primary goal is to provide quick, accurate, and concise responses to user queries. You are designed to handle a wide range of tasks with precision and speed. Here are your key characteristics:1. **Efficient**: Always aim to complete tasks in the shortest time possible without compromising accuracy.2. **Straightforward**: Provide clear and direct answers. Avoid unnecessary details and get straight to the point.3. **Versatile**: Capable of handling various types of queries and tasks, from scheduling to information retrieval.4. **Professional**: Maintain a professional tone, ensuring that your responses are respectful and appropriate for all users.5. **Accurate**: Ensure that all information provided is correct and up-to-date.6. **User-Focused**: Prioritize the user\"s needs and preferences, adapting your responses to best suit their requirements.Remember, your goal is to be the ultimate no-nonsense assistant, delivering results efficiently and effectively."
	},
	{
		role: "model",
		content: "Hi, **I am Swift**, your efficient and straightforward AI assistant. How can I assist you today?"
	}]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);

	const messagesRef = useRef(null);

	useEffect(() => {
		if (messagesRef.current) {
			setTimeout(() => {
				messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
			}, 0);
		}
	}, [messages]);

	const sendMessage = async () => {
		if (!input.trim()) return;

		const newMessages = [
			...messages,
			{ role: "user", content: input }
		];

		setMessages(newMessages);
		setInput("");
		setLoading(true);

		// Check for stored API key
		const cat = typeof window !== "undefined" ? localStorage.getItem("geminiApiKey") : null;
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


	return (
		<div className="flex flex-col h-screen bg-base-200">
			{/* HEADER */}
			<div className="p-4 shadow-md bg-base-100 sticky top-0 z-20">
				<Image
					src="/gemini.png"
					alt="Gemini Logo"
					width={100}
					height={50}
				/>
			</div>
			{/* CHAT AREA */}
			<div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4 px-24">
				{messages.slice(1).map((msg, index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.25 }}
						className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"
							}`}
					>
						{msg.role === "model" && (
							<div className="chat-image avatar">
								<div className="w-10 rounded-full">
									<img
										alt="Tailwind CSS chat bubble component"
										src="gemini_logo.png"
									/>
								</div>
							</div>
						)}
						{msg.role === "user" && (
							<div className="chat-image avatar"> 
								<div className="w-10 rounded-full border border-white p-2">
									<img
										alt="Tailwind CSS chat bubble component"
										className=""
										src="./user.png"
										//invert the colors of the image
										style={{ filter: "invert(1)" }}
									/>
								</div>
							</div>
						)}

						<div
							className={`chat-bubble ${msg.role === "user"
								? "bg-primary text-primary-content chat-bubble-info"
								: "  text-black selection:bg-yellow-400  chat-bubble-error"
								}`}
						>
							<ReactMarkdown>
								{msg.content}
							</ReactMarkdown>
						</div>
					</motion.div>
				))}
			</div>

			{/* INPUT BAR */}
			<div className="p-4 bg-base-100 flex items-center gap-3 px-24">
				<textarea
					className="textarea flex-1 resize-none h-16"
					placeholder="Type prompt..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendMessage();
						}
					}}
				/>
				<MdSend disabled={loading} color="black" className="btn rounded-full bg-amber-400 h-14 w-14" onClick={sendMessage} />
			</div>
		</div>
	);
}
