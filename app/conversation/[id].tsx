import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { BackHeader } from '../../src/components/BackHeader';
import { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../src/hooks/useConversations';
import { useAuthStore } from '../../src/store/auth';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { messages, loading, sendMessage, markRead } = useMessages(id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    markRead();
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(text);
    setText('');
    setSending(false);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#2D6A4F" size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BackHeader title="Conversation" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item: m, index }) => {
            const isMine = m.sender_id === user?.id;
            const prevMsg = messages[index - 1];
            const showName = !isMine && (!prevMsg || prevMsg.sender_id !== m.sender_id);
            return (
              <View style={[styles.msgWrapper, isMine ? styles.msgWrapperRight : styles.msgWrapperLeft]}>
                {showName && (
                  <Text style={styles.senderName}>
                    {m.profiles?.display_name ?? m.profiles?.username ?? 'Someone'}
                  </Text>
                )}
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
                    {m.body}
                  </Text>
                </View>
                <Text style={[styles.msgTime, isMine ? styles.msgTimeRight : styles.msgTimeLeft]}>
                  {formatTime(m.sent_at)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyMsg}>
              <Text style={styles.emptyMsgText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f7f7' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backText: { fontSize: 15, color: '#2D6A4F', fontWeight: '600', width: 50 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  messageList: { padding: 16, paddingBottom: 8 },
  msgWrapper: { marginBottom: 4, maxWidth: '80%' },
  msgWrapperRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgWrapperLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 11, color: '#888', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: '#2D6A4F', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextTheirs: { color: '#1a1a1a' },
  msgTime: { fontSize: 10, color: '#bbb', marginTop: 3, marginHorizontal: 4 },
  msgTimeRight: { textAlign: 'right' },
  msgTimeLeft: { textAlign: 'left' },
  emptyMsg: { alignItems: 'center', paddingTop: 80 },
  emptyMsgText: { fontSize: 14, color: '#aaa' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    backgroundColor: '#fafafa', maxHeight: 120, color: '#1a1a1a',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#2D6A4F', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#ccc' },
  sendBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
});
