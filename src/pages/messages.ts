import { getChatMessages, getCurrentUser, getProfilePhoto, getUserById, getUserChats, sendMessage } from "../lib/db.js";
import { Header } from "../lib/header.js";
import { arrayToMessage, arrayToUser, type Message, type User } from "../types/entities.js";
import type { Page } from "./routes.js";

export const MessagesPage: Page = {
    name: 'messages' as const,
    render: () => {
        const app = document.getElementById('app')!;
        app.innerHTML =
            Header.getHTML({ pageName: 'messages', showProfileDropdown: true }) + `
            <div class="messages-container">
                <div class="messages-sidebar">
                    <h2>Conversations</h2>
                    <p>Loading conversations...</p>
                </div>
                <div class="messages-content">
                <p>Select a conversation to view messages</p>
            </div>
        `;

        const loadConversation = async (userId: string) => {
            const messagesContent = document.querySelector('.messages-content')!;
            const currentUser = await getCurrentUser();
            const resp = await getUserById(userId);
            console.log(userId, resp);
            if (!currentUser) {
                messagesContent.innerHTML = `<p>Please log in to view messages.</p>`;
                return;
            }
            if (!resp.success || !resp.data || resp.data.length === 0) {
                messagesContent.innerHTML = `<p>Something went wrong.</p>`;
                return;
            }
            const sender = arrayToUser(resp.data[0]);
            const res = await getChatMessages(userId, currentUser.user_id);
            console.log('Chat messages result:', res);
            if (res.success && res.data) {
                const messageObjects: Message[] = res.data.map((message: any) => arrayToMessage(message));
                updateMessagesUI(messagesContent, currentUser, messageObjects, sender);
            }
        };
        const updateMessagesUI = (container: Element, currentUser: User, messages: Message[], otherUser: User) => {
            document.getElementById('send-message-button')?.removeEventListener('click', () => { });
            document.getElementById('message-input-field')?.removeEventListener('keypress', () => { });
            const messagesHTML = messages.map(message => {
                const isSentByCurrentUser = message.sender_id === currentUser.user_id;
                return `
                        <div class="message-container">
                            <div class="message ${isSentByCurrentUser ? 'sent' : 'received'}">
                                <p>${message.content}</p>
                            </div>
                            <span class="timestamp">${new Date(message.sent_at).toLocaleString()}</span>
                        </div>
                    `;
            }).join('');
            container.innerHTML = `
                    <div class="conversation-header">
                        <h2>${otherUser.name}</h2>
                    </div>
                    <div class="messages-list">
                        ${messagesHTML}
                    </div>
                    <div class="message-input">
                        <input type="text" placeholder="Type your message..." id="message-input-field">
                        <button id="send-message-button">Send</button>
                    </div>
                `;
            document.getElementById('send-message-button')?.addEventListener('click', (e) => handleSendMessage(e, currentUser, otherUser));
            document.getElementById('message-input-field')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSendMessage(e, currentUser, otherUser);
                }
            });
        };

        const getAllChats = async () => {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                return;
            }
            const userId = currentUser.user_id;
            const result = await getUserChats(userId)
            if (result.success) {

                if (!result.data || result.data.length === 0) {
                    const sidebar = document.querySelector('.messages-sidebar')!;
                    sidebar.innerHTML = `
                        <h2>Conversations</h2>
                        <p>No conversations yet, start matching to begin chatting!</p>
                    `;
                    return;
                }
                var fchats = result.data.filter(([senderId, count]) => senderId !== userId).map(async ([senderId, count]) => {
                    const senderResult = await getUserById(senderId);
                    if (senderResult.success && senderResult.data && senderResult.data.length > 0) {
                        const sender = arrayToUser(senderResult.data[0]);
                        const avatar = await getProfilePhoto(senderId);
                        return { userId: senderId, count, name: sender.name, avatar: avatar };
                    } else {
                        return { userId: senderId, count, name: 'Unknown User', avatar: null };
                    }
                })

                const sidebar = document.querySelector('.messages-sidebar')!;
                sidebar.innerHTML = `<h2 class="sidebar-title">Conversations</h2>`;

                fchats.forEach(chatPromise => {
                    chatPromise.then(({ userId, count, name, avatar }) => {
                        const conversationHTML = `
                            <div class="chat-item" id="chat-item-${userId}">
                                <img src="${avatar}" alt="User Avatar" class="avatar">
                                <div class="conversation-info">
                                    <h3>${name}</h3>
                                    <div class="notif">${count}</div>
                                </div>
                            </div>
                        `;
                        sidebar.insertAdjacentHTML('beforeend', conversationHTML);

                        const chatItem = document.getElementById(`chat-item-${userId}`);
                        if (chatItem) {
                            chatItem.addEventListener('click', () => {
                                console.log('Clicked chat with userId:', userId);
                                sidebar.querySelectorAll('.chat-item').forEach(item => {
                                    item.classList.remove('active');
                                });
                                chatItem.classList.add('active');
                                loadConversation(userId);
                            });
                        }
                    });
                });
            } else {
                console.error('Failed to fetch user chats:', result.error);
            }
        };

        getAllChats();

        const handleSendMessage = async (e: Event, currentUser: User, otherUser: User) => {
            e.preventDefault();
            const messageInput = document.getElementById('message-input-field') as HTMLInputElement;
            if (messageInput.value.trim() === '') {
                return;
            }
            const content = messageInput.value.trim();
            if (content) {
                console.log('Message to send:', content);
                messageInput.value = '';
            }
            sendMessage({
                message_id: '',
                sender_id: currentUser.user_id,
                receiver_id: otherUser.user_id,
                content: content,
                sent_at: new Date().toISOString(),
                read: 'False'
            });
            await loadConversation(otherUser.user_id);
        }

        Header.setupListeners(MessagesPage, { pageName: 'messages', showProfileDropdown: true });
    },
    cleanup: () => {
        Header.cleanup(MessagesPage);
        document.getElementById('send-message-button')?.removeEventListener('click', () => { });
    }
};