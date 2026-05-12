
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, ConsignmentType, ChatMessage, Port, TypingStatus, SystemSettings } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import * as FB from '../firebaseService';
import { 
  Mic, 
  Send, 
  Paperclip, 
  Search, 
  Smile, 
  Reply, 
  X, 
  Play, 
  Pause, 
  Trash2,
  CheckCheck,
  MoreVertical,
  Image as ImageIcon,
  FileText,
  User as UserIcon,
  Users,
  Anchor,
  Globe,
  PawPrint,
  Leaf,
  Utensils,
  Clock,
  Calendar,
  Pin,
  AlertCircle,
  Info,
  MessageSquare,
  ShieldCheck,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './AudioPlayer';

interface ChatSystemProps {
  currentUser: User;
  activeSector: ConsignmentType;
  ports: Port[];
  users: User[];
  systemSettings?: SystemSettings;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ currentUser, activeSector, ports, users, systemSettings }) => {
  const [currentSector, setCurrentSector] = useState<ConsignmentType>(activeSector);
  const [selectedPort, setSelectedPort] = useState<string | undefined>(() => {
      if (currentUser.role === 'ADMIN') return undefined;
      if (currentUser.assignedPorts && currentUser.assignedPorts.length > 0) {
          const assignedPortId = currentUser.assignedPorts[0];
          const port = ports.find(p => p.id === assignedPortId);
          return port ? port.name : undefined;
      }
      return undefined;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState<string | null>(null); // messageId
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Available sectors based on user permissions
  const availableSectors = currentUser.role === 'ADMIN' 
    ? Object.values(ConsignmentType) 
    : currentUser.allowedSectors;

  // Sync prop changes
  useEffect(() => {
      if (availableSectors.includes(activeSector)) {
          setCurrentSector(activeSector);
      }
  }, [activeSector]);

  const prevSectorRef = useRef<ConsignmentType>(currentSector);

  useEffect(() => {
      if (prevSectorRef.current !== currentSector) {
          const sectorLabel = systemSettings?.customLabels?.[`sector_${currentSector.toLowerCase()}`] || CONSIGNMENT_LABELS[currentSector];
          const systemMsg: ChatMessage = {
              id: `sys_${Date.now()}`,
              sector: currentSector,
              port: selectedPort,
              senderId: 'system',
              senderName: 'النظام',
              senderRole: 'تلقائي',
              content: `تم الانتقال إلى قطاع ${sectorLabel}`,
              type: 'SYSTEM',
              timestamp: new Date().toISOString()
          };
          // FB.sendChatMessage(systemMsg); // Only if we want it to be persistent
          prevSectorRef.current = currentSector;
      }
  }, [currentSector]);

  // Subscribe to real-time updates
  useEffect(() => {
      // Send a system message when user joins (simulated)
      const sendSystemWelcome = async () => {
          const welcomeMsg: ChatMessage = {
              id: `sys_${Date.now()}`,
              sector: currentSector,
              port: selectedPort,
              senderId: 'system',
              senderName: 'النظام',
              senderRole: 'تلقائي',
              content: `انضم ${currentUser.name} إلى المحادثة`,
              type: 'SYSTEM',
              timestamp: new Date().toISOString()
          };
          // We don't want to spam the DB with join messages every time, 
          // so maybe just show it locally or only once per session.
          // For now, let's just keep it as a thought.
      };
      // sendSystemWelcome();
  }, []);

  useEffect(() => {
      const unsubscribeChat = FB.subscribeToSectorChat(currentSector, selectedPort, (msgs) => {
          setMessages(msgs);
          
          // Mark unread messages as read
          const unreadIds = msgs
            .filter(m => m.senderId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id)))
            .map(m => m.id);
          
          if (unreadIds.length > 0) {
              FB.markMessagesAsRead(unreadIds, currentUser.id);
          }
      });
      
      const unsubscribeTyping = FB.subscribeToTypingStatus(currentSector, selectedPort, (statuses) => {
          setTypingUsers(statuses.filter(s => s.userId !== currentUser.id));
      });

      const unsubscribeUsers = FB.subscribeToCollection('users', (allUsers: User[]) => {
          setOnlineUsers(allUsers.filter(u => u.isOnline));
      });

      return () => {
          unsubscribeChat();
          unsubscribeTyping();
          unsubscribeUsers();
      };
  }, [currentSector, selectedPort]);

  // Handle typing status
  const handleTyping = () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      FB.updateTypingStatus({
          userId: currentUser.id,
          userName: currentUser.name,
          sector: currentSector,
          port: selectedPort,
          isTyping: true,
          lastUpdated: new Date().toISOString()
      });

      typingTimeoutRef.current = setTimeout(() => {
          FB.updateTypingStatus({
              userId: currentUser.id,
              userName: currentUser.name,
              sector: currentSector,
              port: selectedPort,
              isTyping: false,
              lastUpdated: new Date().toISOString()
          });
      }, 3000);
  };

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
      let msgs = messages;
      if (searchTerm.trim()) {
          const lowerSearch = searchTerm.toLowerCase();
          msgs = msgs.filter(msg => 
              msg.content.toLowerCase().includes(lowerSearch) || 
              msg.senderName.toLowerCase().includes(lowerSearch)
          );
      }
      return msgs;
  }, [messages, searchTerm]);

  // Auto-scroll to bottom
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages, typingUsers]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
  };

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!inputText.trim() && !audioBlob) return;

      let type: ChatMessage['type'] = 'TEXT';
      let url: string | undefined = undefined;
      let content = inputText;

      if (audioBlob) {
          type = 'VOICE';
          content = 'رسالة صوتية';
          // Convert blob to base64 for storage-less environment
          url = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(audioBlob);
          });
          setAudioBlob(null);
          setRecordingDuration(0);
      }

      const newMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sector: currentSector,
          port: selectedPort,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.jobTitle,
          content: content,
          type: type,
          url: url,
          duration: type === 'VOICE' ? recordingDuration : undefined,
          timestamp: new Date().toISOString(),
          replyTo: replyTo?.id,
          reactions: {}
      };

      await FB.sendChatMessage(newMessage);
      setInputText('');
      setReplyTo(null);
      
      // Clear typing status immediately
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      FB.updateTypingStatus({
          userId: currentUser.id,
          userName: currentUser.name,
          sector: currentSector,
          port: selectedPort,
          isTyping: false,
          lastUpdated: new Date().toISOString()
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');

      if (file.size > 1 * 1024 * 1024) {
          alert('حجم الملف كبير جداً. الحد الأقصى 1 ميجابايت.');
          e.target.value = '';
          return;
      }

      setIsUploading(true);
      try {
          const base64Data = await FB.uploadFile(file, `chat/${currentSector}`);
          
          const newMessage: ChatMessage = {
              id: Math.random().toString(36).substr(2, 9),
              sector: currentSector,
              port: selectedPort,
              senderId: currentUser.id,
              senderName: currentUser.name,
              senderRole: currentUser.jobTitle,
              content: isImage ? 'صورة' : 'مستند',
              type: isImage ? 'IMAGE' : 'DOC',
              url: base64Data,
              fileName: file.name,
              timestamp: new Date().toISOString(),
              replyTo: replyTo?.id,
              reactions: {}
          };

          await FB.sendChatMessage(newMessage);
      } catch (err) {
          console.error(err);
          alert('حدث خطأ أثناء رفع الملف');
      } finally {
          setIsUploading(false);
          e.target.value = '';
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          const chunks: Blob[] = [];
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
              setAudioBlob(blob);
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          timerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);
      } catch (err) {
          console.error('Error accessing microphone:', err);
          alert('لا يمكن الوصول إلى الميكروفون');
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setAudioBlob(null);
          setRecordingDuration(0);
      }
  };

    const handleReaction = async (messageId: string, emoji: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const reactions = { ...(message.reactions || {}) };
        const users = reactions[emoji] || [];

        if (users.includes(currentUser.id)) {
            reactions[emoji] = users.filter(id => id !== currentUser.id);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji] = [...users, currentUser.id];
        }

        await FB.updateMessageReactions(messageId, reactions);
        setShowEmojiPicker(null);
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
            await FB.deleteChatMessage(messageId);
            setShowOptions(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setShowOptions(null);
        // Could add a toast here
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const groupMessagesByDate = (msgs: ChatMessage[]) => {
        const groups: { [key: string]: ChatMessage[] } = {};
        msgs.forEach(msg => {
            const date = new Date(msg.timestamp).toLocaleDateString('ar-EG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <mark key={i} className="bg-amber-200 text-slate-900 rounded-sm px-0.5">{part}</mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    const pinnedMessages = useMemo(() => messages.filter(m => m.isPinned), [messages]);

    const unreadCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        messages.forEach(m => {
            if (m.senderId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id))) {
                const key = m.port ? `${m.sector}_${m.port}` : m.sector;
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }, [messages, currentUser.id]);

    const quickActions = [
        "تمت المعاينة بنجاح",
        "يرجى إرفاق المستندات المطلوبة",
        "الإرسالية مطابقة للمواصفات",
        "يوجد اشتباه في الصنف",
        "تم سحب العينة للمختبر",
        "بانتظار نتائج التحليل"
    ];

    const handlePinMessage = async (messageId: string, isPinned: boolean) => {
        await FB.pinChatMessage(messageId, isPinned);
        setShowOptions(null);
    };

    const handleQuickAction = (text: string) => {
        setInputText(text);
        setShowQuickActions(false);
    };

    const groupedMessages = useMemo(() => groupMessagesByDate(filteredMessages), [filteredMessages]);

    return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in relative">
        
        {/* Sidebar */}
        <div className="w-20 md:w-80 border-l border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="font-black text-lg text-slate-800 hidden md:block">المجموعات</h3>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={20} />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                {/* Ports Selection for Admin */}
                {currentUser.role === 'ADMIN' && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase px-2 mb-2 tracking-widest">المنفذ</p>
                        <div className="space-y-1">
                            <button
                                onClick={() => setSelectedPort(undefined)}
                                className={`w-full p-3 rounded-xl text-right text-xs font-bold transition-all flex items-center justify-between ${
                                    selectedPort === undefined ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-white text-slate-600'
                                }`}
                            >
                                <span className="flex items-center gap-2"><Globe size={14} /> جميع المنافذ</span>
                            </button>
                            {ports.map(port => {
                                const unreadCount = unreadCounts[`${currentSector}_${port.name}`];
                                return (
                                    <button
                                        key={port.id}
                                        onClick={() => setSelectedPort(port.name)}
                                        className={`w-full p-3 rounded-xl text-right text-xs font-bold transition-all flex items-center justify-between ${
                                            selectedPort === port.name ? 'bg-slate-800 text-white shadow-md' : 'hover:bg-white text-slate-600'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2"><Anchor size={14} /> {port.name}</span>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                                    {unreadCount}
                                                </span>
                                            )}
                                            {onlineUsers.some(u => u.assignedPorts?.includes(port.id)) && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase px-2 mb-2 tracking-widest">القطاعات</p>
                            {availableSectors.map(sector => {
                                const sectorLabel = systemSettings?.customLabels?.[`sector_${sector.toLowerCase()}`] || CONSIGNMENT_LABELS[sector];
                                const unreadCount = unreadCounts[sector];
                                return (
                                    <button
                                        key={sector}
                                        onClick={() => setCurrentSector(sector)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                                            currentSector === sector 
                                            ? 'bg-white shadow-md border border-slate-100' 
                                            : 'hover:bg-white hover:shadow-sm border border-transparent'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                                            sector === ConsignmentType.VETERINARY ? 'bg-amber-100 text-amber-600' :
                                            sector === ConsignmentType.AGRICULTURAL ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                            {sector === ConsignmentType.VETERINARY ? <PawPrint size={24} /> :
                                             sector === ConsignmentType.AGRICULTURAL ? <Leaf size={24} /> : <Utensils size={24} />}
                                        </div>
                                        <div className="hidden md:block text-right flex-1">
                                            <h4 className="font-bold text-sm text-slate-800">{sectorLabel}</h4>
                                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">مجموعة الفريق الفني</p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                        {onlineUsers.filter(u => u.id !== currentUser.id && u.allowedSectors.includes(sector)).length > 0 && (
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        )}
                                    </button>
                                );
                            })}
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase px-2 mb-2 tracking-widest">
                        المستخدمون في {CONSIGNMENT_LABELS[currentSector]}
                    </p>
                    <div className="space-y-1">
                        {users
                            .filter(u => u.id !== currentUser.id && u.allowedSectors.includes(currentSector))
                            .map(user => {
                                const isOnline = onlineUsers.some(u => u.id === user.id);
                                return (
                                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all cursor-default group">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                                {user.avatar ? <img referrerPolicy="no-referrer" src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                            </div>
                                            {isOnline && <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-slate-50 rounded-full"></span>}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="text-xs font-bold text-slate-700 truncate">{user.name}</h4>
                                            <p className="text-[9px] text-slate-400 truncate">
                                                {isOnline ? 'متصل الآن' : user.lastSeen ? `آخر ظهور ${new Date(user.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'غير متصل'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        {users.filter(u => u.id !== currentUser.id && u.allowedSectors.includes(currentSector)).length === 0 && (
                            <p className="text-[10px] text-slate-400 text-center py-4 italic">لا يوجد مستخدمون آخرون في هذا القطاع</p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#e5ddd5] relative">
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat' }}></div>

            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        currentSector === ConsignmentType.VETERINARY ? 'bg-amber-500' :
                        currentSector === ConsignmentType.AGRICULTURAL ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}>
                        {currentSector === ConsignmentType.VETERINARY ? <PawPrint size={20} /> :
                         currentSector === ConsignmentType.AGRICULTURAL ? <Leaf size={20} /> : <Utensils size={20} />}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800">
                            {systemSettings?.customLabels?.[`sector_${currentSector.toLowerCase()}`] || CONSIGNMENT_LABELS[currentSector]} 
                            {selectedPort ? ` | ${selectedPort}` : ''}
                        </h3>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 font-bold">
                                {typingUsers.length > 0 
                                    ? `${typingUsers.map(u => u.userName).join(', ')} يكتب الآن...` 
                                    : <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-green-600" /> محادثة آمنة ومشفرة</span>}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث في الرسائل..."
                            className="bg-slate-100 border-none rounded-full py-2 pr-10 pl-10 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200 w-40 md:w-64 transition-all"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowUsersModal(true)}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                        title="المشاركون"
                    >
                        <Users size={18} />
                    </button>
                    <button 
                        onClick={() => setShowInfoModal(true)}
                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                        title="معلومات المجموعة"
                    >
                        <Info size={18} />
                    </button>
                </div>
            </div>

            {/* Pinned Messages Bar */}
            <AnimatePresence>
                {pinnedMessages.length > 0 && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-2 flex items-center justify-between z-20 shadow-sm"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Pin size={14} className="text-blue-500 shrink-0" />
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">رسالة مثبتة</p>
                                <p className="text-xs text-slate-600 truncate font-medium">{pinnedMessages[pinnedMessages.length - 1].content}</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase">عرض الكل</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages List */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar z-10"
            >
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="space-y-4">
                        <div className="flex justify-center">
                            <div className="bg-white/50 backdrop-blur-sm px-4 py-1 rounded-full border border-white/20 shadow-sm flex items-center gap-2">
                                <Calendar size={12} className="text-slate-400" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{date}</span>
                            </div>
                        </div>

                        {msgs.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                            
                            if (msg.type === 'SYSTEM') {
                                return (
                                    <div key={msg.id} className="flex justify-center my-2">
                                        <div className="bg-slate-800/10 backdrop-blur-sm px-4 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-2">
                                            <Info size={12} className="text-slate-500" />
                                            <span className="text-[10px] font-bold text-slate-600">{msg.content}</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={msg.id} 
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`group max-w-[85%] md:max-w-[60%] rounded-2xl p-1 shadow-sm relative ${
                                        isMe ? 'bg-[#d9fdd3] rounded-tl-none' : 'bg-white rounded-tr-none'
                                    }`}>
                                        {/* Triangle */}
                                        <div className={`absolute top-0 w-3 h-3 ${isMe ? '-left-2 bg-[#d9fdd3]' : '-right-2 bg-white'} [clip-path:polygon(0_0,100%_0,100%_100%)] ${isMe ? '' : 'transform scale-x-[-1]'}`}></div>

                                        <div className="px-2 pt-1 pb-1">
                                            <div className="flex justify-between items-start gap-4 mb-1">
                                                <p className={`text-[10px] font-black ${
                                                    msg.senderRole?.includes('Admin') ? 'text-red-600' : isMe ? 'text-blue-600' : 'text-orange-600'
                                                }`}>
                                                    {msg.senderName} <span className="opacity-50 font-normal">~ {msg.senderRole}</span>
                                                </p>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    <button onClick={() => setReplyTo(msg)} className="text-slate-400 hover:text-blue-600" title="رد"><Reply size={14} /></button>
                                                    <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="text-slate-400 hover:text-amber-500" title="تفاعل"><Smile size={14} /></button>
                                                    <div className="relative">
                                                        <button onClick={() => setShowOptions(showOptions === msg.id ? null : msg.id)} className="text-slate-400 hover:text-slate-600"><MoreVertical size={14} /></button>
                                                        <AnimatePresence>
                                                            {showOptions === msg.id && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                                    className={`absolute top-full mt-1 z-50 bg-white shadow-xl rounded-xl py-1 border border-slate-100 min-w-[120px] ${isMe ? 'left-0' : 'right-0'}`}
                                                                >
                                                                    <button onClick={() => setReplyTo(msg)} className="w-full text-right px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">
                                                                            رد <Reply size={12} />
                                                                        </button>
                                                                        <button onClick={() => handlePinMessage(msg.id, !msg.isPinned)} className="w-full text-right px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">
                                                                            {msg.isPinned ? 'إلغاء التثبيت' : 'تثبيت'} <Pin size={12} />
                                                                        </button>
                                                                        {msg.type === 'TEXT' && (
                                                                            <button onClick={() => copyToClipboard(msg.content)} className="w-full text-right px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">
                                                                                نسخ النص <i className="far fa-copy"></i>
                                                                            </button>
                                                                        )}
                                                                    {isMe && (
                                                                        <button onClick={() => handleDeleteMessage(msg.id)} className="w-full text-right px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center justify-between">
                                                                            حذف <Trash2 size={12} />
                                                                        </button>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reply Preview */}
                                            {msg.isPinned && (
                                                <div className="flex items-center gap-1 mb-1 text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                                    <Pin size={10} /> مثبتة
                                                </div>
                                            )}
                                            {replyMsg && (
                                                <div className="mb-2 p-2 bg-black/5 border-r-4 border-slate-400 rounded-lg text-xs">
                                                    <p className="font-black text-slate-500 mb-1">{replyMsg.senderName}</p>
                                                    <p className="text-slate-600 truncate">{replyMsg.content}</p>
                                                </div>
                                            )}

                                            {msg.type === 'TEXT' && (
                                                <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                                                    <HighlightText text={msg.content} highlight={searchTerm} />
                                                </p>
                                            )}

                                            {msg.type === 'IMAGE' && (
                                                <div className="mt-1 mb-1">
                                                    <img referrerPolicy="no-referrer" 
                                                        src={msg.url} 
                                                        alt="Attachment" 
                                                        className="rounded-lg max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" 
                                                        onClick={() => setSelectedImage(msg.url || null)} 
                                                    />
                                                </div>
                                            )}

                                            {msg.type === 'DOC' && (
                                                <div className="flex items-center gap-3 bg-black/5 p-3 rounded-xl mt-1 mb-1 border border-black/5">
                                                    <div className="w-10 h-10 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-xs font-bold text-slate-700 truncate">{msg.fileName || 'مستند'}</p>
                                                        <p className="text-[9px] text-slate-400 uppercase">DOCUMENT</p>
                                                    </div>
                                                    <a href={msg.url} download={msg.fileName} className="mr-auto w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-500 hover:text-blue-600 transition-colors">
                                                        <MoreVertical size={14} />
                                                    </a>
                                                </div>
                                            )}

                                            {msg.type === 'VOICE' && msg.url && (
                                                <AudioPlayer url={msg.url} duration={msg.duration} />
                                            )}

                                    {/* Reactions */}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                                                <button 
                                                    key={emoji}
                                                    onClick={() => handleReaction(msg.id, emoji)}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all ${
                                                        userIds.includes(currentUser.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="font-black">{userIds.length}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Emoji Picker Popup */}
                                    <AnimatePresence>
                                        {showEmojiPicker === msg.id && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className={`absolute bottom-full mb-2 z-50 bg-white shadow-xl rounded-full p-1 border border-slate-100 flex gap-1 ${isMe ? 'left-0' : 'right-0'}`}
                                            >
                                                {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => handleReaction(msg.id, emoji)}
                                                        className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-lg transition-all hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                                        <span className="text-[9px] font-medium text-slate-500">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {isMe && (
                                            <CheckCheck 
                                                size={12} 
                                                className={msg.readBy && msg.readBy.length > 0 ? "text-blue-500" : "text-slate-400"} 
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        ))}
            <div ref={messagesEndRef} />
            
            {/* Scroll to Bottom Button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-24 left-8 z-30 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all"
                    >
                        <i className="fas fa-chevron-down"></i>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>

            {/* Input Area */}
            <div className="p-3 bg-[#f0f2f5] z-20 flex flex-col gap-2">
                {/* Quick Actions Bar */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    <button 
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${showQuickActions ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                        <MessageSquare size={14} />
                    </button>
                    <AnimatePresence>
                        {showQuickActions && quickActions.map((action, idx) => (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: idx * 0.05 }}
                                key={`${action}-${idx}`}
                                onClick={() => handleQuickAction(action)}
                                className="shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all shadow-sm"
                            >
                                {action}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Reply Preview in Input */}
                <AnimatePresence>
                    {replyTo && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-white/80 backdrop-blur-sm border-r-4 border-blue-500 p-3 rounded-xl flex justify-between items-center"
                        >
                            <div>
                                <p className="text-[10px] font-black text-blue-600 mb-1">الرد على {replyTo.senderName}</p>
                                <p className="text-xs text-slate-600 truncate max-w-md">{replyTo.content}</p>
                            </div>
                            <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2">
                    <div className="flex gap-1 pb-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center"
                            title="إرفاق ملف"
                        >
                            {isUploading ? <i className="fas fa-circle-notch fa-spin"></i> : <Paperclip size={20} />}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf"
                        />
                    </div>
                    
                    <div className="flex-1 bg-white rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center px-4 py-1">
                        {isRecording ? (
                            <div className="flex-1 flex items-center justify-between h-10 px-2">
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-black text-slate-700">{formatDuration(recordingDuration)}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400">جاري التسجيل...</p>
                                <button onClick={cancelRecording} className="text-red-500 hover:bg-red-50 p-2 rounded-full"><Trash2 size={18} /></button>
                            </div>
                        ) : (
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    handleTyping();
                                }}
                                placeholder="اكتب رسالة..." 
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-800 h-10"
                            />
                        )}
                    </div>

                    {inputText.trim() || audioBlob ? (
                        <button 
                            onClick={() => handleSendMessage()}
                            className="w-12 h-12 rounded-full bg-[#005c4b] text-white flex items-center justify-center shadow-md hover:bg-[#004f40] transition-all pb-1"
                        >
                            <Send size={20} className="rtl:rotate-180" />
                        </button>
                    ) : (
                        <button 
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all ${
                                isRecording ? 'bg-red-500 text-white scale-125' : 'bg-[#005c4b] text-white hover:bg-[#004f40]'
                            }`}
                        >
                            <Mic size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Info Modal */}
        <AnimatePresence>
            {showInfoModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className={`h-32 flex items-center justify-center text-white text-4xl ${
                            currentSector === ConsignmentType.VETERINARY ? 'bg-amber-500' :
                            currentSector === ConsignmentType.AGRICULTURAL ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}>
                            {currentSector === ConsignmentType.VETERINARY ? <PawPrint size={64} /> :
                             currentSector === ConsignmentType.AGRICULTURAL ? <Leaf size={64} /> : <Utensils size={64} />}
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                {systemSettings?.customLabels?.[`sector_${currentSector.toLowerCase()}`] || CONSIGNMENT_LABELS[currentSector]}
                            </h3>
                            <p className="text-slate-500 font-bold mb-6 flex items-center justify-center gap-2">
                                <MapPin size={16} /> {selectedPort || 'جميع المنافذ'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الرسائل</p>
                                    <p className="text-xl font-black text-slate-800">{messages.length}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">المشاركون</p>
                                    <p className="text-xl font-black text-slate-800">{users.filter(u => u.allowedSectors.includes(currentSector)).length}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-right">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <ShieldCheck size={18} className="text-green-500" />
                                    <span className="text-xs font-bold text-slate-700">تشفير تام بين الأطراف</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Info size={18} className="text-blue-500" />
                                    <span className="text-xs font-bold text-slate-700">مجموعة الفريق الفني المعتمدة</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowInfoModal(false)}
                                className="w-full mt-8 bg-slate-800 text-white py-4 rounded-2xl font-black hover:bg-slate-900 transition-all shadow-lg"
                            >
                                إغلاق
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Users Modal */}
        <AnimatePresence>
            {showUsersModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-lg text-slate-800">المشاركون في المجموعة</h3>
                            <button onClick={() => setShowUsersModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {users
                                .filter(u => u.allowedSectors.includes(currentSector))
                                .map(user => {
                                    const isOnline = onlineUsers.some(u => u.id === user.id);
                                    return (
                                        <div key={user.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg overflow-hidden">
                                                    {user.avatar ? <img referrerPolicy="no-referrer" src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                                </div>
                                                {isOnline && <span className="absolute bottom-0 left-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                            </div>
                                            <div className="flex-1 text-right">
                                                <h4 className="font-black text-slate-800">{user.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.jobTitle} | {user.role}</p>
                                            </div>
                                            <div className="text-left">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {isOnline ? 'متصل' : 'غير متصل'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default ChatSystem;
