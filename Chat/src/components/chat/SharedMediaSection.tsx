import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, FileText, Link as LinkIcon, Film, Headphones, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { chatService } from '../../services/chat.service';
import { useChat } from '../../context/ChatContext';

interface SharedMediaSectionProps {
  targetUserId: string;
}

export const SharedMediaSection: React.FC<SharedMediaSectionProps> = ({ targetUserId }) => {
  const { openModal } = useChat();
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchSharedMedia = useCallback(
    async (tab: 'media' | 'files' | 'links', pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await chatService.getSharedMedia(targetUserId, tab, pageNum);
        if (append) {
          setItems((prev) => [...prev, ...(data.items || [])]);
        } else {
          setItems(data.items || []);
        }
        setHasNext(data.has_next);
        setTotalCount(data.total_count);
        setPage(data.page);
      } catch (err: any) {
        setError('Unable to load shared media. Try again.');
      } finally {
        setLoading(false);
      }
    },
    [targetUserId]
  );

  useEffect(() => {
    fetchSharedMedia(activeTab, 1, false);
  }, [activeTab, fetchSharedMedia]);

  const handleTabChange = (tab: 'media' | 'files' | 'links') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasNext) {
      fetchSharedMedia(activeTab, page + 1, true);
    }
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-[#1a2234] rounded-2xl border border-slate-200/60 dark:border-white/5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Shared Content ({totalCount})
        </span>
        <button
          onClick={() => fetchSharedMedia(activeTab, 1, false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          title="Refresh Shared Media"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl gap-1">
        <button
          onClick={() => handleTabChange('media')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'media'
              ? 'bg-white dark:bg-[#111827] text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Media
        </button>
        <button
          onClick={() => handleTabChange('files')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'files'
              ? 'bg-white dark:bg-[#111827] text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Files
        </button>
        <button
          onClick={() => handleTabChange('links')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'links'
              ? 'bg-white dark:bg-[#111827] text-violet-600 dark:text-violet-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" /> Links
        </button>
      </div>

      {/* Content Area */}
      {error ? (
        <div className="py-6 text-center text-xs text-rose-500 space-y-2">
          <p>{error}</p>
          <button
            onClick={() => fetchSharedMedia(activeTab, 1, false)}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 rounded-lg text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
          {activeTab === 'media' && 'No media shared yet'}
          {activeTab === 'files' && 'No files shared yet'}
          {activeTab === 'links' && 'No links shared yet'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Media Grid */}
          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                  {item.type === 'image' && (
                    <img
                      src={item.url}
                      alt={item.name || 'Shared Media'}
                      onClick={() => openModal('media_viewer', { url: item.url, name: item.name, type: 'image' })}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    />
                  )}
                  {item.type === 'video' && (
                    <div
                      onClick={() => openModal('media_viewer', { url: item.url, name: item.name, type: 'video' })}
                      className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <Film className="w-6 h-6 text-rose-400" />
                      <span className="text-[10px] font-semibold truncate max-w-[90%] mt-1 px-1">{item.name}</span>
                    </div>
                  )}
                  {item.type === 'audio' && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-amber-950/40 text-amber-300 p-1">
                      <Headphones className="w-5 h-5 mb-1" />
                      <span className="text-[9px] truncate max-w-full font-medium">{item.name}</span>
                      <a href={item.url} download={item.name} className="mt-1 p-0.5 hover:text-white" title="Download Audio">
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Files List */}
          {activeTab === 'files' && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  download={item.name}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
                >
                  <FileText className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400">{item.size}</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}

          {/* Links List */}
          {activeTab === 'links' && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/60 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-violet-600 dark:text-violet-400 font-semibold gap-2">
                    <span className="truncate flex-1">{item.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </div>
                  {item.snippet && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{item.snippet}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{item.domain}</span>
                    <span>Shared by {item.sender_name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasNext && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-1.5 text-center text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline transition-colors"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
