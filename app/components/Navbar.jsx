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
import { listChats, deleteChat, deleteAllChats, deleteNoTitleChats } from "../lib/db";
import { MdDelete } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";
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
	}, [chattitle, currentChatId]);

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
				<div className="flex flex-row gap-2 content-stretch">
					<Button className="flex-1" color="primary" onPress={async () => {
						await deleteNoTitleChats(currentChatId);
						loadChats();
					}}>
						Cleap Up
					</Button>
					<Button className="flex-1" color="danger" onPress={async () => {
						await deleteAllChats(currentChatId);
						loadChats();
					}}>
						Delele all chats
					</Button>
				</div>
				{!chats ? (
					<div className="flex justify-center py-6">
						<Spinner size="sm" />
					</div>
				) : chats.length === 0 ? (
					<p className="text-center text-default-500 py-6">No chats</p>
				) : (<AnimatePresence mode="popLayout">
					{chats.map((chat) => (
						<motion.div
							key={chat.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<NavbarMenuItem
								className="flex justify-between items-center gap-2"
							>
								<Link
									className={`flex-1 truncate ${chat.id === currentChatId ? "text-white" : ""
										}`}
									onPress={() => {
										router.push(`/chat/${chat.id}`);
										setIsMenuOpen(false);
									}}
								>
									{chat.title?.slice(0, 25) || "New chat"}{" "}
									{" - "}
									{new Date(chat.updatedAt).toLocaleString("en-US", {
										month: "short",
										day: "2-digit",
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									}).replace(",", "")}
								</Link>

								{chat.id !== currentChatId && (
									<Button
										isIconOnly
										size="sm"
										variant="light"
										color="danger"
										onPress={async () => {
											addToast({ title: "Deleted", color: "warning" });
											await deleteChat(chat.id);
											loadChats();
										}}
									>
										<MdDelete size={16} />
									</Button>
								)}
							</NavbarMenuItem>
						</motion.div>
					))}
				</AnimatePresence>
				)}
			</NavbarMenu>
		</Navbar>
	);
}

