import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

export function useConversations() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setConversations([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        last_read_at,
        conversations(
          id, type, title, last_message_at,
          conversation_participants(
            user_id,
            profiles(id, display_name, username)
          )
        )
      `)
      .eq('user_id', user.id)
      .is('left_at', null)
      .order('conversations(last_message_at)', { ascending: false });

    setConversations(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { conversations, loading, refetch: fetch };
}

export function useMessages(conversationId: string) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!conversationId) return;
    const { data } = await supabase
      .from('messages')
      .select('id, body, sent_at, edited_at, is_deleted, sender_id, profiles(display_name, username)')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('sent_at', { ascending: true });
    setMessages(data ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        () => { fetch(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, fetch]);

  async function sendMessage(body: string) {
    if (!user || !body.trim()) return null;
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim() })
      .select()
      .single();
    if (!error) fetch();
    return error;
  }

  async function markRead() {
    if (!user) return;
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }

  return { messages, loading, sendMessage, markRead, refetch: fetch };
}

export async function startDirectConversation(currentUserId: string, otherUserId: string): Promise<string | null> {
  // Check if DM already exists between these two users
  const { data: existing } = await supabase
    .from('conversation_participants')
    .select('conversation_id, conversations(type)')
    .eq('user_id', currentUserId)
    .eq('conversations.type', 'direct');

  if (existing) {
    for (const row of existing) {
      const convId = row.conversation_id;
      const { data: other } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', convId)
        .eq('user_id', otherUserId)
        .single();
      if (other) return convId;
    }
  }

  // Create new conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({ type: 'direct', created_by: currentUserId })
    .select()
    .single();
  if (convErr || !conv) return null;

  await supabase.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: currentUserId },
    { conversation_id: conv.id, user_id: otherUserId },
  ]);

  return conv.id;
}
