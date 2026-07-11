import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GenerativeUIPayload } from '../components/canvas/GenerativeCanvas';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export interface Chat {
  id: string;
  folderId: string;
  name: string;
  messages: ChatMessage[];
  visuals: GenerativeUIPayload[];
  datasetPath: string | null;
  datasetSchema: any | null;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

interface ChatState {
  folders: Folder[];
  chats: Chat[];
  activeChatId: string | null;

  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;

  createChat: (folderId: string, name?: string) => string;
  renameChat: (id: string, name: string) => void;
  deleteChat: (id: string) => void;

  setActiveChat: (id: string | null) => void;

  addMessage: (chatId: string, message: ChatMessage) => void;
  setVisuals: (chatId: string, visuals: GenerativeUIPayload[]) => void;
  setDataset: (chatId: string, datasetPath: string, datasetSchema: any) => void;
  
  autoCreateChatAndFolder: (initialMessage: string) => string;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      folders: [],
      chats: [],
      activeChatId: null,

      createFolder: (name) => {
        const id = generateId();
        set((state) => ({
          folders: [...state.folders, { id, name, createdAt: Date.now() }],
        }));
        return id;
      },

      renameFolder: (id, name) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        }));
      },

      deleteFolder: (id) => {
        set((state) => {
          // Find all chats in this folder
          const chatsToDelete = state.chats.filter((c) => c.folderId === id);
          const chatIdsToDelete = new Set(chatsToDelete.map((c) => c.id));
          
          let newActiveId = state.activeChatId;
          if (newActiveId && chatIdsToDelete.has(newActiveId)) {
            newActiveId = null;
          }

          return {
            folders: state.folders.filter((f) => f.id !== id),
            chats: state.chats.filter((c) => c.folderId !== id),
            activeChatId: newActiveId,
          };
        });
      },

      createChat: (folderId, name = 'Novo Chat') => {
        const id = generateId();
        set((state) => ({
          chats: [
            ...state.chats,
            {
              id,
              folderId,
              name,
              messages: [{ id: generateId(), role: 'ai', content: 'Olá! Sou seu assistente de BI. Faça o upload de um dataset para começar.' }],
              visuals: [],
              datasetPath: null,
              datasetSchema: null,
              createdAt: Date.now(),
            },
          ],
          activeChatId: id,
        }));
        return id;
      },

      renameChat: (id, name) => {
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, name } : c)),
        }));
      },

      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          activeChatId: state.activeChatId === id ? null : state.activeChatId,
        }));
      },

      setActiveChat: (id) => {
        set({ activeChatId: id });
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
          ),
        }));
      },

      setVisuals: (chatId, visuals) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, visuals } : c
          ),
        }));
      },

      setDataset: (chatId, datasetPath, datasetSchema) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, datasetPath, datasetSchema } : c
          ),
        }));
      },

      autoCreateChatAndFolder: (initialMessage) => {
        const state = get();
        // Generate a folder name
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        
        // 1. Create Folder
        const folderId = generateId();
        const folderName = `Análises de ${dateStr}`;
        
        // 2. Create Chat
        const chatId = generateId();
        const chatName = initialMessage.length > 20 ? initialMessage.substring(0, 20) + '...' : initialMessage;

        set((state) => ({
          folders: [...state.folders, { id: folderId, name: folderName, createdAt: Date.now() }],
          chats: [
            ...state.chats,
            {
              id: chatId,
              folderId,
              name: chatName,
              messages: [{ id: generateId(), role: 'ai', content: 'Olá! Sou seu assistente de BI. Faça o upload de um dataset para começar.' }],
              visuals: [],
              datasetPath: null,
              datasetSchema: null,
              createdAt: Date.now(),
            },
          ],
          activeChatId: chatId,
        }));

        return chatId;
      },
    }),
    {
      name: 'datamind-chat-storage', // key in localStorage
    }
  )
);
