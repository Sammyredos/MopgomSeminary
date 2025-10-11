'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useToast } from '@/contexts/ToastContext'
import { useUser } from '@/contexts/UserContext'
import { useMessages } from '@/contexts/MessageContext'
import { MessageInput } from '@/components/admin/MessageInput'
import { ChatMessage } from '@/components/admin/ChatMessage'
import { Search, MessageSquare, Mail, MailOpen, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentLayout } from '@/components/student/StudentLayout'
import { ProtectedRoute } from '@/components/student/ProtectedRoute'
import { StatsCard, StatsGrid } from '@/components/ui/stats-card'
import { PageTransition } from '@/components/ui/page-transition'
import { DateSeparator } from '@/components/admin/DateSeparator'
import { UserDirectory } from '@/components/admin/UserDirectory'

interface Message {
  id: string
  subject: string
  content: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  senderType: 'admin' | 'user'
  recipientType: 'admin' | 'user'
  status: string
  sentAt: string
  readAt: string | null
  createdAt: string
}

interface ChatConversation {
  id: string
  participantEmail: string
  participantName: string
  participantType: 'admin' | 'user'
  messages: Message[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export default function StudentMessagesPage() {
  const { success, error } = useToast()
  const { currentUser } = useUser()
  const { refreshStats, markAsRead: markMessageAsRead } = useMessages()

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sending, setSending] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [startingAdminChat, setStartingAdminChat] = useState(false)
  const [showUserDirectory, setShowUserDirectory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && selectedConversation?.messages?.length) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [selectedConversation?.messages?.length])

  const buildConversationsFromInbox = (messages: Message[]): ChatConversation[] => {
    const me = currentUser?.email || ''
    const map = new Map<string, ChatConversation>()

    messages.forEach(msg => {
      const isMine = msg.senderEmail === me
      const participantEmail = isMine ? msg.recipientEmail : msg.senderEmail
      const participantName = isMine ? msg.recipientName : msg.senderName
      const participantType = isMine ? msg.recipientType : msg.senderType

      const key = participantEmail
      const existing = map.get(key)
      const unreadIncrement = !msg.readAt && msg.senderEmail !== me ? 1 : 0

      if (existing) {
        existing.messages.push(msg)
        existing.unreadCount += unreadIncrement
        if (new Date(msg.sentAt) > new Date(existing.lastMessageTime)) {
          existing.lastMessage = msg.content || msg.subject || ''
          existing.lastMessageTime = msg.sentAt
        }
      } else {
        map.set(key, {
          id: key,
          participantEmail,
          participantName,
          participantType,
          messages: [msg],
          lastMessage: msg.content || msg.subject || '',
          lastMessageTime: msg.sentAt,
          unreadCount: unreadIncrement,
          isOnline: false
        })
      }
    })

    // Sort by lastMessageTime desc
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }

  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/messages/inbox', {
        headers: { 'Cache-Control': 'max-age=30' }
      })
      if (response.ok) {
        const data = await response.json()
        const msgs: Message[] = data.messages || []
        const convs = buildConversationsFromInbox(msgs)
        setConversations(convs)
        refreshStats()
      } else {
        throw new Error('Failed to fetch inbox')
      }
    } catch (e) {
      error('Failed to load messages', 'Please refresh or try again later.')
    } finally {
      setLoading(false)
      setInitialLoadComplete(true)
    }
  }, [currentUser?.email])

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  const selectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation)
    setShowMobileChat(true)

    try {
      const response = await fetch(`/api/admin/messages/conversation?participant=${encodeURIComponent(conversation.participantEmail)}`)
      if (response.ok) {
        const data = await response.json()
        const msgs: Message[] = data.messages || []

        const updated = {
          ...conversation,
          messages: msgs,
          unreadCount: 0
        }
        setSelectedConversation(updated)
        setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))

        // Mark unread messages as read in local state and context
        msgs.filter(m => !m.readAt && m.senderEmail !== currentUser?.email).forEach(m => {
          markMessageAsRead(m.id)
        })
      }
    } catch (e) {
      // non-blocking
    }
  }

  const handleUserSelect = (user: { email: string; name: string; type: 'admin' | 'user' }) => {
    const existingConversation = conversations.find(conv => conv.participantEmail === user.email)
    if (existingConversation) {
      selectConversation(existingConversation)
    } else {
      const newConversation: ChatConversation = {
        id: user.email,
        participantEmail: user.email,
        participantName: user.name,
        participantType: user.type,
        messages: [],
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false
      }
      setConversations(prev => [newConversation, ...prev])
      setSelectedConversation(newConversation)
      setShowMobileChat(true)
    }
    setShowUserDirectory(false)
  }

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      subject: `Message from ${currentUser?.name}`,
      content,
      senderEmail: currentUser?.email || '',
      senderName: currentUser?.name || '',
      recipientEmail: selectedConversation.participantEmail,
      recipientName: selectedConversation.participantName,
      senderType: 'user',
      recipientType: selectedConversation.participantType,
      status: 'sending',
      sentAt: new Date().toISOString(),
      readAt: null,
      createdAt: new Date().toISOString()
    }

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, optimistic],
      lastMessage: content,
      lastMessageTime: optimistic.sentAt
    } : null)

    setConversations(prev => prev.map(conv => conv.id === selectedConversation.id ? {
      ...conv,
      messages: [...conv.messages, optimistic],
      lastMessage: content,
      lastMessageTime: optimistic.sentAt
    } : conv))

    setSending(true)
    try {
      const response = await fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: selectedConversation.participantEmail,
          recipientType: selectedConversation.participantType,
          subject: `Message from ${currentUser?.name}`,
          message: content
        })
      })

      if (response.ok) {
        const data = await response.json()
        const actual: Message = {
          ...optimistic,
          id: data.messageId || Date.now().toString(),
          status: 'sent'
        }

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === optimistic.id ? actual : m)
        } : null)
        setConversations(prev => prev.map(conv => conv.id === selectedConversation.id ? {
          ...conv,
          messages: conv.messages.map(m => m.id === optimistic.id ? actual : m)
        } : conv))

        refreshStats()
        success('Message sent successfully')
      } else {
        throw new Error('Send failed')
      }
    } catch (e) {
      // remove optimistic on error
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(m => m.id !== optimistic.id)
      } : null)
      setConversations(prev => prev.map(conv => conv.id === selectedConversation.id ? {
        ...conv,
        messages: conv.messages.filter(m => m.id !== optimistic.id)
      } : conv))
      error('Send Failed', 'Unable to send the message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const startAdminChat = async () => {
    try {
      setStartingAdminChat(true)
      const res = await fetch('/api/admin/users/directory')
      if (!res.ok) throw new Error('Failed to load admins')
      const data = await res.json()
      const users = Array.isArray(data?.users) ? data.users : []
      const admins = users.filter((u: any) => {
        const roleName = u?.role?.name || ''
        return ['Admin', 'Lecturer'].includes(roleName)
      })
      const admin = admins[0]
      if (!admin) {
        error('No admin available', 'Please try again later.')
        return
      }

      const participantEmail = admin.email
      const participantName = admin.name || admin.email

      const convRes = await fetch(`/api/admin/messages/conversation?participant=${encodeURIComponent(participantEmail)}`)
      let msgs: Message[] = []
      if (convRes.ok) {
        const convData = await convRes.json()
        msgs = Array.isArray(convData?.messages) ? convData.messages : []
      }

      const conversation: ChatConversation = {
        id: participantEmail,
        participantEmail,
        participantName,
        participantType: 'admin',
        messages: msgs,
        lastMessage: msgs.length ? (msgs[msgs.length - 1].content || msgs[msgs.length - 1].subject || '') : '',
        lastMessageTime: msgs.length ? msgs[msgs.length - 1].sentAt : new Date().toISOString(),
        unreadCount: 0,
        isOnline: false
      }

      setSelectedConversation(conversation)
      setShowMobileChat(true)
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id)
        if (exists) {
          return prev.map(c => (c.id === conversation.id ? conversation : c))
        }
        return [conversation, ...prev]
      })
    } catch (e) {
      error('Unable to start admin chat', 'Please try again later.')
    } finally {
      setStartingAdminChat(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!selectedConversation) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('recipientId', selectedConversation.participantEmail)
      formData.append('recipientType', selectedConversation.participantType)
      formData.append('subject', `File from ${currentUser?.name}`)

      const response = await fetch('/api/admin/messages/send-file', { method: 'POST', body: formData })
      if (response.ok) {
        const newMsg: Message = {
          id: Date.now().toString(),
          subject: `File from ${currentUser?.name}`,
          content: `📎 ${file.name}`,
          senderEmail: currentUser?.email || '',
          senderName: currentUser?.name || '',
          recipientEmail: selectedConversation.participantEmail,
          recipientName: selectedConversation.participantName,
          senderType: 'user',
          recipientType: selectedConversation.participantType,
          status: 'sent',
          sentAt: new Date().toISOString(),
          readAt: null,
          createdAt: new Date().toISOString()
        }

        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: newMsg.sentAt } : null)
        setConversations(prev => prev.map(conv => conv.id === selectedConversation.id ? { ...conv, messages: [...conv.messages, newMsg], lastMessage: newMsg.content, lastMessageTime: newMsg.sentAt } : conv))

        refreshStats()
        success('File sent successfully')
      } else {
        throw new Error('Upload failed')
      }
    } catch (e) {
      error('Upload Failed', 'Unable to send the file. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return conversations
    const s = debouncedSearchTerm.toLowerCase()
    return conversations.filter(conv =>
      conv.participantName.toLowerCase().includes(s) ||
      conv.participantEmail.toLowerCase().includes(s) ||
      conv.lastMessage.toLowerCase().includes(s)
    )
  }, [conversations, debouncedSearchTerm])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Skeleton components to match admin inbox experience
  const StatsSkeleton = () => (
    <StatsGrid columns={4}>
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCard
          key={i}
          title=""
          value=""
          icon={MessageSquare}
          gradient="bg-gradient-to-r from-gray-400 to-gray-500"
          bgGradient="bg-gradient-to-br from-white to-gray-50"
          loading={true}
        />
      ))}
    </StatsGrid>
  )

  const ConversationsSkeleton = () => (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden h-[calc(100vh-280px)]">
      <div className="flex h-full">
        <div className="flex flex-col w-full lg:w-1/3 border-r border-gray-200 bg-white">
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between p-4 bg-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="h-6 w-20 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
            <div className="p-3">
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex flex-col w-full lg:w-2/3 bg-white">
          <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="h-32 w-32 mx-auto mb-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading && !initialLoadComplete) {
    return (
      <ProtectedRoute>
        <StudentLayout title="Messages" description="View and reply to communications">
          <PageTransition>
            <div className="space-y-6">
              <div className="px-6">
                <StatsSkeleton />
              </div>
              <div className="px-6">
                <ConversationsSkeleton />
              </div>
            </div>
          </PageTransition>
        </StudentLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <StudentLayout title="Messages" description="View and reply to communications">
        <PageTransition>
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="px-6">
              <StatsGrid columns={4}>
                <StatsCard
                  title="Conversations"
                  value={conversations.length}
                  subtitle="Active message threads"
                  icon={MessageSquare}
                  gradient="bg-gradient-to-r from-blue-500 to-cyan-600"
                  bgGradient="bg-gradient-to-br from-white to-blue-50"
                />
                <StatsCard
                  title="Unread Messages"
                  value={conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                  subtitle="Pending your attention"
                  icon={MailOpen}
                  gradient="bg-gradient-to-r from-red-500 to-pink-600"
                  bgGradient="bg-gradient-to-br from-white to-red-50"
                />
                <StatsCard
                  title="Total Messages"
                  value={conversations.reduce((acc, c) => acc + (c.messages?.length || 0), 0)}
                  subtitle="All message history"
                  icon={Mail}
                  gradient="bg-gradient-to-r from-green-500 to-emerald-600"
                  bgGradient="bg-gradient-to-br from-white to-green-50"
                />
                <StatsCard
                  title="Online Users"
                  value={conversations.filter(conv => conv.isOnline).length}
                  subtitle="Currently active"
                  icon={CheckCircle}
                  gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
                  bgGradient="bg-gradient-to-br from-white to-purple-50"
                />
              </StatsGrid>
            </div>

            {/* Chat Interface */}
            <div className="px-6">
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden h-[calc(100vh-280px)]">
                <div className="flex h-full">
                  {/* Left Sidebar - Conversations List */}
                  <div className={`${showMobileChat ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-1/3 border-r border-gray-200 bg-white`}>
                    {/* Header with Search and New Chat */}
                    <div className="bg-gray-50 border-b border-gray-200">
                      {/* Top Header */}
                      <div className="flex items-center justify-between p-4 bg-indigo-600">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                          </div>
                          <h1 className="font-apercu-bold text-lg text-white">Messages</h1>
                        </div>
                        <button
                          onClick={() => setShowUserDirectory(true)}
                          className="h-10 w-10 bg-indigo-500 hover:bg-indigo-400 rounded-full flex items-center justify-center transition-colors"
                          title="New Chat"
                        >
                          <Plus className="h-5 w-5 text-white" />
                        </button>
                      </div>

                      {/* Search Bar */}
                      <div className="p-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search or start new chat"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 font-apercu-regular bg-gray-100 border-0 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto bg-white">
                      {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="font-apercu-medium text-gray-600 mb-2">No conversations yet</p>
                          <p className="font-apercu-regular text-sm text-gray-500 max-w-xs">
                            {searchTerm ? 'No results found. Try a different search term.' : 'Click the + button to start a new conversation'}
                          </p>
                        </div>
                      ) : (
                        <div>
                          {filteredConversations.map(conversation => (
                            <div
                              key={conversation.id}
                              onClick={() => selectConversation(conversation)}
                              className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 border-b border-gray-100 ${
                                selectedConversation?.id === conversation.id ? 'bg-indigo-50 border-r-4 border-indigo-500' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="relative flex-shrink-0">
                                  <div className="h-12 w-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                                    <span className="font-apercu-bold text-white text-sm">
                                      {conversation.participantName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  {conversation.isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-indigo-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-apercu-medium text-gray-900 truncate text-base">
                                      {conversation.participantName}
                                    </h3>
                                    <span className="font-apercu-regular text-xs text-gray-500 flex-shrink-0 ml-2">
                                      {formatDate(conversation.lastMessageTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="font-apercu-regular text-sm text-gray-600 truncate">
                                      {conversation.lastMessage || 'No messages yet'}
                                    </p>
                                    {conversation.unreadCount > 0 && (
                                      <div className="bg-indigo-500 text-gray text-xs font-apercu-bold rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0 min-w-[20px]">
                                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Chat Area */}
                  <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-2/3 bg-white`}>
                    {selectedConversation ? (
                      <>
                        {/* Chat Header */}
                        <div className="bg-gray-50 border-b border-gray-200 p-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setShowMobileChat(false)}
                              className="lg:hidden p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <div className="relative flex-shrink-0">
                              <div className="h-10 w-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                                <span className="font-apercu-bold text-white text-sm">
                                  {selectedConversation.participantName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {selectedConversation.isOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-indigo-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h2 className="font-apercu-medium text-gray-900 truncate">
                                {selectedConversation.participantName}
                              </h2>
                              <p className="font-apercu-regular text-sm text-gray-500">
                                {selectedConversation.isOnline ? 'Online' : 'Last seen recently'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <Search className="h-5 w-5 text-gray-600" />
                              </button>
                              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Messages Area with Date Separators and gradient */}
                        <div
                          className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-indigo-50 to-indigo-100"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                          }}
                        >
                          <div className="space-y-1">
                            {selectedConversation.messages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                <div className="bg-white rounded-full p-4 mb-3 shadow-sm">
                                  <MessageSquare className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="font-apercu-medium text-gray-600">No messages yet</p>
                                <p className="font-apercu-regular text-sm text-gray-500">Start the conversation below</p>
                              </div>
                            ) : (
                              selectedConversation.messages
                                .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
                                .map((message, index, arr) => {
                                  const isFromCurrentUser = message.senderEmail === currentUser?.email
                                  const prevMessage = index > 0 ? arr[index - 1] : null
                                  const showDateSeparator = !prevMessage ||
                                    new Date(message.sentAt).toDateString() !== new Date(prevMessage.sentAt).toDateString()

                                  return (
                                    <div key={message.id}>
                                      {showDateSeparator && (
                                        <DateSeparator date={message.sentAt} />
                                      )}
                                      <ChatMessage
                                        id={message.id}
                                        content={message.content}
                                        timestamp={message.sentAt}
                                        isFromUser={isFromCurrentUser}
                                        isRead={!!message.readAt}
                                        senderName={isFromCurrentUser ? undefined : message.senderName}
                                        status={message.readAt ? 'read' : message.status === 'sending' ? 'sent' : 'delivered'}
                                      />
                                    </div>
                                  )
                                })
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>

                        {/* Input */}
                        <MessageInput onSend={sendMessage} onFileUpload={handleFileUpload} disabled={sending} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-indigo-50 to-indigo-100">
                        <div className="mb-8">
                          <div className="h-32 w-32 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <MessageSquare className="h-16 w-16 text-gray-400" />
                          </div>
                          <h2 className="font-apercu-bold text-2xl text-gray-900 mb-3">
                            Welcome to Messages
                          </h2>
                          <p className="font-apercu-regular text-gray-600 max-w-md text-base leading-relaxed">
                            Select a Contact to start a conversation.
                          </p>
                        </div>
                        <div className="text-center">
                          <button
                            onClick={() => setShowUserDirectory(true)}
                            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 transition-colors font-apercu-medium"
                          >
                            <Plus className="h-5 w-5" />
                            <span className="text-white">Start New Conversation</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>

        {/* User Directory Modal */}
        <UserDirectory
          isOpen={showUserDirectory}
          onClose={() => setShowUserDirectory(false)}
          onSendMessage={handleUserSelect}
          allowedRoles={["Admin", "Lecturer"]}
          excludeRoles={["Super Admin"]}
        />
      </StudentLayout>
    </ProtectedRoute>
  )
}