
// Load an existing chat by id
// /app/chat/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import ChatView from '../../components/ChatView';

export default function ChatByIdPage() {
	const params = useParams();
	const chatId = params?.chatid;
	console.log('Returning ChatView with existingChatId :', chatId);
	return <ChatView existingChatId={chatId} />;
}

