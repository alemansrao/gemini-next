
// /components/ChatView.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { addToast, Textarea, Spinner, Button } from '@heroui/react';
import { MdSend } from 'react-icons/md';
import { LuClipboardPaste } from 'react-icons/lu';
import ReactMarkdown from 'react-markdown';
import NavbarComponent from '../components/Navbar';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import {
	addMessage,
	createChat,
	getChat,
	getMessages,
	upsertChatTitle,
	touchChat,
} from '../lib/db';

import Sidebar from '../components/Sidebar';

import {
	DEFAULT_MESSAGES,
	API_KEY_STORAGE_KEY,
	MODEL_STORAGE_KEY,
} from '../helpers/chatHelpers';

import { useRouter } from 'next/navigation';

export default function ChatView({ existingChatId = null }) {
	const router = useRouter();

	// --- State ---
	const [chatId, setChatId] = useState(existingChatId ?? '');
	const [chatTitle, setChatTitle] = useState('');
	const [input, setInput] = useState('');
	const [messages, setMessages] = useState(DEFAULT_MESSAGES);
	const [loading, setLoading] = useState(false);
	const [firstTurn, setFirstTurn] = useState(false);

	const isBrowser = typeof window !== 'undefined';
	const initialModel =
		isBrowser ? localStorage.getItem(MODEL_STORAGE_KEY) ?? 'gemini-2.5-flash' : 'gemini-2.5-flash';
	const [model, setModel] = useState(initialModel);


	// Inside your component:
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]); // Triggers every time messages change


	// Guard to prevent duplicate initialization in Strict Mode
	const initRef = useRef(null);

	// --- Initialization: new or existing chat ---
	useEffect(() => {
		(async () => {
			try {
				// Normalize existingChatId (can be undefined/null)
				const targetId = existingChatId ?? null;
				console.log('ChatView init, targetId:', existingChatId);
				if (targetId) {
					// Prevent re-initializing the same existing chat on Strict Mode double-render
					if (initRef.current === targetId) return;
					initRef.current = targetId;

					const chat = await getChat(targetId);
					if (!chat) {
						addToast({
							title: 'Not found',
							description: 'Chat no longer exists',
							color: 'warning',
						});
						router.push('/');
						return;
					}

					const msgs = await getMessages(targetId);
					setMessages(msgs.length ? msgs : DEFAULT_MESSAGES);
					setChatId(targetId);
					setChatTitle(chat.title ?? '');
					setModel(chat.model ?? model);
					// Existing chats should not regenerate title
					setFirstTurn(false);
				} else {
					// New chat flow, initialize only once per mount
					if (initRef.current === 'new') return;
					initRef.current = 'new';

					const id = uuidv4();
					setChatId(id);
					console.log('Creating new chat with id', id);
					await createChat({ id, model });

					// Seed initial scripted messages into store + local state for continuity
					for (const m of DEFAULT_MESSAGES) {
						await addMessage({ chatId: id, role: m.role, content: m.content });
					}
					setMessages(DEFAULT_MESSAGES);
					setFirstTurn(true);
				}
			} catch (e) {
				console.error(e);
				addToast({
					title: 'Init failed',
					description: 'Could not initialize chat',
					color: 'danger',
				});
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [existingChatId]);






	async function fetchChatTitle(apiKey, message) {
		try {
			const res = await fetch('/api/title', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, apiKey }),
			});
			if (!res.ok) {
				const txt = await res.text().catch(() => '');
				throw new Error(`Title API error (${res.status}): ${txt || 'Unknown error'}`);
			}
			const data = await res.json();
			// Accept both {title} and legacy {chatTitle}
			const title = data.title ?? data.chatTitle ?? '';
			return title ?? '';
		} catch (e) {
			console.error('fetchChatTitle failed:', e);
			return '';
		}
	}

	async function sendMessage() {
		const apiKey = isBrowser ? localStorage.getItem(API_KEY_STORAGE_KEY) : null;
		const selectedModel = isBrowser
			? localStorage.getItem(MODEL_STORAGE_KEY) ?? model
			: model;
		const systemPrompt = isBrowser ? localStorage.getItem('systemPrompt') ?? '' : '';

		if (!input.trim()) return;

		if (!apiKey) {
			addToast({
				title: 'API Key Missing',
				description: 'Add your Gemini API key in Settings.',
				color: 'warning',
			});
			router.push('/settings');
			return;
		}

		const userMsg = { role: 'user', content: input.trim() };
		setInput('');
		setLoading(true);

		try {
			// Display & persist user message
			setMessages((prev) => [...prev, userMsg]);
			await addMessage({ chatId, role: 'user', content: userMsg.content });

			// Generate title on first user turn (background)
			if (firstTurn) {
				setFirstTurn(false);
				fetchChatTitle(apiKey, userMsg.content)
					.then(async (title) => {
						const t =
							title ||
							(userMsg.content.length > 48
								? userMsg.content.slice(0, 48) + '...'
								: userMsg.content);
						setChatTitle(t);
						await upsertChatTitle(chatId, t);
					})
					.catch(() => { });
			}

			// Build payload history using current messages + new user message
			const history = [...messages, userMsg];

			const res = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-gemini-api-key': apiKey,
				},
				body: JSON.stringify({
					messages: history,
					model: selectedModel ?? 'gemini-2.5-flash',
					systemPrompt: systemPrompt || undefined,
				}),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok || !data) {
				throw new Error(
					data?.error ?? `Chat API error (${res.status}): ${JSON.stringify(data)}`
				);
			}

			const reply = (data.reply ?? '').toString();
			if (!reply) throw new Error('Empty model reply');

			const assistant = { role: 'model', content: reply };
			setMessages((prev) => [...prev, assistant]);
			await addMessage({ chatId, role: 'model', content: reply });
			await touchChat(chatId);
		} catch (e) {
			console.error(e);
			const errText =
				'Something went wrong. Please check your API key, model, or try again.';
			setMessages((prev) => [...prev, { role: 'model', content: errText }]);
			await addMessage({ chatId, role: 'model', content: errText });
			addToast({ title: 'Request failed', description: String(e), color: 'danger' });
		} finally {
			setLoading(false);
		}
	}


	return (
		<div className="flex h-screen bg-base-200">
			{/* Sidebar (hidden on mobile) */}
			<Sidebar currentChatId={chatId} />

			{/* Main column */}
			<div className="flex flex-col flex-1 min-w-0">
				<NavbarComponent chattitle={chatTitle} currentChatId={chatId} />

				{/* Chat header (mobile) */}


				{/* Messages */}
				<div
					className="flex-1 overflow-y-auto space-y-4 px-3 md:px-10 py-3"
				>
					<AnimatePresence initial={false}>
						{messages.map((msg, index) => (
							<motion.div
								key={index}
								layout
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -8 }}
								transition={{ duration: 0.3, ease: "easeOut" }}
								className={`chat gap-0 md:gap-1.5 ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}
							>
								{msg.role === 'model' && (
									<div className="chat-image avatar">
										<div className="w-6 md:w-10 rounded-full">
											<img
												onClick={() => {
													navigator.clipboard.writeText(msg.content);
													addToast({ title: 'Copied', color: 'success' });
												}}
												alt="assistant"
												src="/gemini_logo.png"
											/>
										</div>
									</div>
								)}

								{/* {msg.role === 'user' && (
								<div className="chat-image ml-1 avatar">
									<div className="w-6 md:w-10 rounded-full border border-white md:p-2 p-1">
										<img
											alt="user"
											onClick={() => {
												navigator.clipboard.writeText(msg.content);
												addToast({ title: 'Copied', color: 'success' });
											}}
											src="/user.png"
											style={{ filter: 'invert(1)' }}
										/>
									</div>
								</div>
							)} */}

								<div
									className={`chat-bubble 
									[&>h3]:text-lg [&>h3]:text-[#719de6] [&>h3]:font-bold
									[&>pre]:text-[#7686ff] [&>pre]:bg-[#1e1e1e] [&>pre]:overflow-auto [&>pre]:selection:bg-primary [&>pre]:selection:text-white
									[&>code]:bg-[#2d2d2d] [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded
									[&>ul]:list-disc [&>ul]:pl-5
									[&>ol]:list-decimal [&>ol]:pl-5
									
									
									rounded-4xl whitespace-pre-wrap ${msg.role === 'user'
											? 'bg-primary text-primary-content max-w-4/5 md:max-w-3/5'
											: 'text-content1 max-w-4/5 md:max-w-3/5 selection:bg-yellow-400'
										}`}
								>
									<ReactMarkdown>{msg.content}</ReactMarkdown>
								</div>
							</motion.div>
						))}
					</AnimatePresence>

					{loading && (
						<div className="chat chat-start">
							<div className="chat-image avatar">
								<div className="w-10 rounded-full">
									<img
										onClick={() => {
											navigator.clipboard.writeText(msg.content);
											addToast({ title: 'Copied', color: 'success' });
										}}
										alt="assistant"
										src="/gemini_logo.png"
									/>
								</div>
							</div>
							<div className="chat-bubble rounded-4xl text-content1 max-w-4/5 md:max-w-3/5 selection:bg-yellow-400">
								<div className="flex items-center gap-2">
									<span>Thinking…</span>
									<Spinner size="sm" />
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 flex items-center gap-3 md:px-10">
					<Textarea
						label="Prompt"
						variant="flat"
						className="dark"
						onChange={(e) => setInput(e.target.value)}
						value={input}
						maxRows={4}
						placeholder="Enter your prompt..."
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey && !loading) {
								e.preventDefault();
								if (input.trim()) sendMessage();
							}
						}}
					/>
					{!input ? (
						<LuClipboardPaste
							onClick={async () => {
								try {
									const text = await navigator.clipboard.readText();
									setInput(text);
								} catch {
									addToast({
										title: 'Clipboard blocked',
										description: 'Grant clipboard permission or paste manually.',
										color: 'warning',
									});
								}
							}}
							color="black"
							className="btn rounded-full bg-amber-400 h-14 w-14"
						/>
					) : (
						<MdSend
							color="black"
							className={`btn rounded-full bg-amber-400 h-14 w-14 ${loading ? 'opacity-50' : ''
								}`}
							onClick={() => !loading && sendMessage()}
						/>
					)}
				</div>
			</div>
		</div>
	);
}