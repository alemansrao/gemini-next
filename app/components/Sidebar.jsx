
// Sidebar to browse chats
// /components/Sidebar.jsx
'use client';
import { Card, CardHeader, CardBody, CardFooter, Divider, Link, Image } from "@heroui/react";
import { useEffect, useState } from 'react';
import { listChats, deleteChat, deleteAllChats } from '../lib/db';
import { useRouter } from 'next/navigation';
import { addToast, Button, Input, Spinner } from '@heroui/react';
import { MdAdd, MdDelete, MdSettings } from 'react-icons/md';

export default function Sidebar({ currentChatId }) {
	const router = useRouter();
	const [chats, setChats] = useState(null);
	const [filter, setFilter] = useState('');

	async function load() {
		try {
			const rows = await listChats();
			setChats(rows);
		} catch (e) {
			console.error(e);
			addToast({ title: 'Load failed', description: 'Could not load chat list', color: 'danger' });
		}
	}

	useEffect(() => {
		load();
		const id = setInterval(load, 1500); // lightweight polling for live updates (Dexie liveQuery alt.)
		return () => clearInterval(id);
	}, []);

	const filtered = (chats || []).filter((c) =>
		(c.title || '(no title)').toLowerCase().includes(filter.toLowerCase()),
	);

	return (
		<aside className="w-72 shrink-0 border-r border-neutral-800 bg-base-200 hidden md:flex md:flex-col py-3">


			<div className="px-3 pb-2">
				<Input
					placeholder="Search chats..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
					size="sm"
				/>
			</div>

			<div className="flex-1 overflow-y-auto">
				{!chats ? (
					<div className="flex items-center justify-center h-full">
						<Spinner size="sm" color="default" />
					</div>
				) : filtered.length === 0 ? (
					<p className="text-center text-content3 px-3 py-8">No chats yet</p>
				) : (
					<>
						<Card className={`max-w-[400px] dark cursor-pointer`}>
							<CardHeader className="flex  gap-3 justify-end">
								<Button className="opacity-60 hover:opacity-100 p-1 px-3 hover:bg-zinc-200 rounded-3xl bg-zinc-700 hover:text-danger">Testing</Button>
								<Button
									className="opacity-60 hover:opacity-100 p-1 px-3 hover:bg-zinc-200 rounded-3xl bg-zinc-700 hover:text-danger"
									onPress={async () => {
										const ok = window.confirm(
											'Delete all chats? This action cannot be undone.'
										);
										if (!ok) {
											addToast({ title: 'Deletion cancelled', color: 'success' });
											return;
										}

										await deleteAllChats();
										addToast({ title: 'Deleted all chats', color: 'danger' });
										await load();
									}}
									title="Delete chat"
								>
									Delete All <MdDelete size={18} />
								</Button>

							</CardHeader>
						</Card>
						{filtered.map((chat) => (
							<Card key={chat.id} className={`max-w-[400px] dark cursor-pointer  ${chat.id === currentChatId ? 'bg-primary/20' : 'hover:bg-gray-800'}`}>
								<CardHeader className="flex gap-3 justify-between " onClick={() => router.push(`/chat/${chat.id}`)}>
									<div className="flex flex-col">
										<p className="text-md">{chat.title.slice(0, 15).trim() || 'New chat'}</p>
										<p className="text-small text-default-500">{new Date(chat.updatedAt).toLocaleString()}</p>
									</div>
									<Button
										className="opacity-60 hover:opacity-100 p-1 hover:bg-zinc-200 rounded-3xl bg-zinc-700 hover:text-danger"
										onPress={async () => {
											await deleteChat(chat.id);
											addToast({ title: 'Deleted', color: 'warning' });
											load();
											if (chat.id === currentChatId) router.push('/');
										}}
										title="Delete chat"
									>
										<MdDelete size={18} />
									</Button>
								</CardHeader>
							</Card>

						))}
					</>
				)}
			</div>
		</aside>
	);
}