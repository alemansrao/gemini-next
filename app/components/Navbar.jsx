'use client';

import React, { useEffect, useState } from "react";
import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenuToggle,
	NavbarMenu,
	NavbarMenuItem,
	Link,
	Button,
	Spinner,
	addToast,
} from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listChats, deleteChat } from "../lib/db";
import { MdDelete } from "react-icons/md";

export const AcmeLogo = () => (
	<Image
		src="/gemini.png"
		alt="Gemini Logo"
		width={100}
		height={50}
		priority
	/>
);

export default function NavbarComponent({ chattitle, currentChatId }) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [chats, setChats] = useState(null);
	const router = useRouter();

	async function loadChats() {
		const rows = await listChats();
		setChats(rows);
	}

	useEffect(() => {
		loadChats();
	}, []);

	return (
		<Navbar onMenuOpenChange={setIsMenuOpen}>
			<NavbarContent>
				<NavbarMenuToggle className="md:hidden" />
				<NavbarBrand>
					<Link href="/"><AcmeLogo /></Link>
				</NavbarBrand>
			</NavbarContent>

			{/* Center title (desktop) */}
			<NavbarContent className="hidden sm:flex" justify="center">
				<NavbarItem>{chattitle}</NavbarItem>
			</NavbarContent>

			{/* Right */}
			<NavbarContent justify="end">
				<NavbarItem>
					<Button as={Link} color="primary" href="/settings" variant="bordered">
						Settings
					</Button>
				</NavbarItem>
			</NavbarContent>

			{/* Mobile menu = chat list */}
			<NavbarMenu>
				{!chats ? (
					<div className="flex justify-center py-6">
						<Spinner size="sm" />
					</div>
				) : chats.length === 0 ? (
					<p className="text-center text-default-500 py-6">No chats</p>
				) : (
					chats.map((chat) => (
						<NavbarMenuItem
							key={chat.id}
							className={`flex justify-between items-center gap-2 ${chat.id === currentChatId ? "bg-primary/20 rounded-lg" : ""
								}`}
						>
							<Link
								className="flex-1 truncate"
								onPress={() => {
									router.push(`/chat/${chat.id}`);
									setIsMenuOpen(false);
								}}
							>
								{chat.title?.slice(0, 25) || "New chat"}
								 {' - '}
								{new Date(chat.updatedAt).toLocaleString('en-US', {
									month: 'short',   // Dec
									day: '2-digit',   // 31
									hour: '2-digit',  // 17
									minute: '2-digit',// 30
									hour12: false     // 24-hour time
								}).replace(',', '')
								}

							</Link>

							<Button
								isIconOnly
								size="sm"
								variant="light"
								color="danger"
								onPress={async () => {
									addToast({ title: 'Deleted', color: 'warning' });
									await deleteChat(chat.id);
									loadChats();
								}}
							>
								<MdDelete size={16} />
							</Button>
						</NavbarMenuItem>
					))
				)}
			</NavbarMenu>
		</Navbar>
	);
}

