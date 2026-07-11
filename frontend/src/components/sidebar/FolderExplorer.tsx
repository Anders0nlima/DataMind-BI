import React, { useState } from 'react';
import { Folder, MessageSquare, Plus, MoreHorizontal, X, Edit2, Check } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

export function FolderExplorer() {
  const { 
    folders, 
    chats, 
    activeChatId, 
    createFolder, 
    createChat, 
    deleteFolder, 
    deleteChat, 
    setActiveChat,
    renameFolder,
    renameChat
  } = useChatStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id)));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const toggleFolder = (folderId: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderId)) newSet.delete(folderId);
    else newSet.add(folderId);
    setExpandedFolders(newSet);
  };

  const handleCreateFolder = () => {
    const id = createFolder("Nova Pasta");
    const newSet = new Set(expandedFolders);
    newSet.add(id);
    setExpandedFolders(newSet);
    
    // Auto-enter edit mode for the new folder
    setEditingId(id);
    setEditValue("Nova Pasta");
  };

  const handleCreateChat = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = createChat(folderId, "Novo Chat");
    
    // Ensure folder is expanded
    const newSet = new Set(expandedFolders);
    newSet.add(folderId);
    setExpandedFolders(newSet);
    
    // Auto-enter edit mode for new chat
    setEditingId(id);
    setEditValue("Novo Chat");
  };

  const startEdit = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentName);
  };

  const saveEdit = (id: string, type: 'folder' | 'chat') => {
    if (editValue.trim()) {
      if (type === 'folder') renameFolder(id, editValue.trim());
      else renameChat(id, editValue.trim());
    }
    setEditingId(null);
  };

  const onEditKeyDown = (e: React.KeyboardEvent, id: string, type: 'folder' | 'chat') => {
    if (e.key === 'Enter') saveEdit(id, type);
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-y-auto custom-scrollbar pr-2 space-y-4">
      {/* Header and Add Folder Button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <Folder className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Pastas</h3>
        </div>
        <button 
          onClick={handleCreateFolder}
          className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 hover:bg-brand-900/20 px-2 py-1 rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nova pasta
        </button>
      </div>

      {/* Folders List */}
      <div className="space-y-3">
        {folders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderChats = chats.filter(c => c.folderId === folder.id);

          return (
            <div key={folder.id} className="space-y-1">
              
              {/* Folder Header */}
              <div 
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => toggleFolder(folder.id)}
              >
                {editingId === folder.id ? (
                  <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => onEditKeyDown(e, folder.id, 'folder')}
                      onBlur={() => saveEdit(folder.id, 'folder')}
                      className="flex-1 bg-slate-950 border border-brand-500 rounded px-2 py-1 text-xs text-slate-200 outline-none"
                    />
                    <button onClick={() => saveEdit(folder.id, 'folder')} className="text-brand-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-slate-400 font-mono text-xs w-3 text-center shrink-0">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                      <span className="text-sm font-medium text-slate-200 truncate select-none">
                        {folder.name}
                      </span>
                    </div>
                    
                    {/* Action Menu (Visible on Hover) */}
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button 
                        onClick={(e) => handleCreateChat(folder.id, e)}
                        className="p-1 text-slate-400 hover:text-brand-400 rounded transition-colors"
                        title="Novo Chat"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => startEdit(folder.id, folder.name, e)}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded transition-colors"
                        title="Renomear"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                        title="Excluir Pasta"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Chats List (if expanded) */}
              {isExpanded && (
                <div className="pl-6 space-y-0.5">
                  {folderChats.length === 0 ? (
                    <div className="text-xs text-slate-500 italic py-1 pl-2">Vazio</div>
                  ) : (
                    folderChats.map(chat => (
                      <div 
                        key={chat.id}
                        onClick={() => setActiveChat(chat.id)}
                        className={`group flex items-center justify-between p-1.5 pl-2 rounded-lg cursor-pointer transition-colors border ${
                          activeChatId === chat.id 
                            ? 'bg-brand-900/20 border-brand-500/30' 
                            : 'border-transparent hover:bg-slate-800'
                        }`}
                      >
                        {editingId === chat.id ? (
                          <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                            <input 
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => onEditKeyDown(e, chat.id, 'chat')}
                              onBlur={() => saveEdit(chat.id, 'chat')}
                              className="flex-1 bg-slate-950 border border-brand-500 rounded px-2 py-0.5 text-xs text-slate-200 outline-none"
                            />
                            <button onClick={() => saveEdit(chat.id, 'chat')} className="text-brand-400">
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeChatId === chat.id ? 'text-brand-400' : 'text-slate-500'}`} />
                              <span className={`text-xs truncate select-none ${activeChatId === chat.id ? 'text-brand-100 font-medium' : 'text-slate-400'}`}>
                                {chat.name}
                              </span>
                            </div>

                            {/* Chat Action Menu */}
                            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                              <button 
                                onClick={(e) => startEdit(chat.id, chat.name, e)}
                                className="p-0.5 text-slate-500 hover:text-blue-400 rounded transition-colors"
                                title="Renomear"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                                className="p-0.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                                title="Excluir Chat"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {folders.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-500">
            Nenhuma pasta criada.
          </div>
        )}
      </div>
    </div>
  );
}
