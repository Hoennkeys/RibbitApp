// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Supabase Data Service
// Location: C:\Ribbit\RibbitApp\src\services\dataService.js
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import supabase from './supabaseClient';

export const dataService = {
  // --- ESPÉCIES ---
  getSpecies: async () => {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .order('nome_popular', { ascending: true });

    if (error) throw error;
    return data;
  },

  getSpeciesById: async (id) => {
    const { data, error } = await supabase
      .from('species')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // --- OBSERVAÇÕES (SONS) ---
  getObservations: async (userId = null) => {
    let query = supabase
      .from('observations')
      .select(`
        *,
        species (
          nome_popular,
          nome_cientifico
        )
      `);

    if (userId) {
      query = query.eq('usuario_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  addObservation: async (especieId, localizacao, userId, sugestao = null, audioUrl = null) => {
    // Diagnostic logs
    const sessionRes = await supabase.auth.getSession();
    const userRes = await supabase.auth.getUser();
    console.log("--- Diagnostic Log ---");
    console.log("userId passed:", userId);
    console.log("Session user ID:", sessionRes?.data?.session?.user?.id);
    console.log("User API ID:", userRes?.data?.user?.id);
    console.log("Session token exists:", !!sessionRes?.data?.session?.access_token);
    console.log("-----------------------");

    // Fetch profile bio metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('bio')
      .eq('id', userId)
      .single();
      
    let bioObj = {};
    try {
      if (profile && profile.bio) {
        bioObj = JSON.parse(profile.bio);
      }
    } catch (e) {}

    const todayStr = new Date().toISOString().split('T')[0];
    const metadata = bioObj.metadata || {};
    
    // Reset limits if new day
    if (metadata.lastActiveDate !== todayStr) {
      metadata.lastActiveDate = todayStr;
      metadata.dailyCommentsCount = 0;
      metadata.dailyObservationsCount = 0;
    }

    // Insert observation
    const { data, error } = await supabase
      .from('observations')
      .insert([
        {
          especie_id: especieId,
          usuario_id: userId,
          localizacao: localizacao,
          status_revisao: 'pendente',
          sugestao: sugestao,
          audio_url: audioUrl,
        }
      ]);

    if (error) throw error;

    let xpAwardedResult = null;
    // Award XP if under limit
    if ((metadata.dailyObservationsCount || 0) < 10) {
      metadata.dailyObservationsCount = (metadata.dailyObservationsCount || 0) + 1;
      bioObj.metadata = metadata;
      
      // Update bio metadata
      await supabase
        .from('profiles')
        .update({ bio: JSON.stringify(bioObj) })
        .eq('id', userId);
        
      // Award XP
      xpAwardedResult = await dataService.updateXp(userId, 50);
    } else {
      xpAwardedResult = { limitReached: true };
    }

    return {
      observation: null,
      xpResult: xpAwardedResult
    };
  },

  getAllObservations: async () => {
    const { data, error } = await supabase
      .from('observations')
      .select('*, species(*), profiles:usuario_id(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar todas as observações:', error);
      throw error;
    }
    return data;
  },

  // --- COMENTÁRIOS ---
  getComments: async (speciesId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('species_id', speciesId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  addComment: async (speciesId, userId, userName, text) => {
    // Fetch profile bio metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('bio')
      .eq('id', userId)
      .single();
      
    let bioObj = {};
    try {
      if (profile && profile.bio) {
        bioObj = JSON.parse(profile.bio);
      }
    } catch (e) {}

    const todayStr = new Date().toISOString().split('T')[0];
    const metadata = bioObj.metadata || {};
    
    // Reset limits if new day
    if (metadata.lastActiveDate !== todayStr) {
      metadata.lastActiveDate = todayStr;
      metadata.dailyCommentsCount = 0;
      metadata.dailyObservationsCount = 0;
    }

    // Insert comment
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          species_id: speciesId,
          usuario_id: userId,
          usuario_nome: userName,
          texto: text
        }
      ])
      .select();

    if (error) throw error;

    let xpAwardedResult = null;
    // Award XP if under limit
    if ((metadata.dailyCommentsCount || 0) < 5) {
      metadata.dailyCommentsCount = (metadata.dailyCommentsCount || 0) + 1;
      bioObj.metadata = metadata;
      
      // Update bio metadata
      await supabase
        .from('profiles')
        .update({ bio: JSON.stringify(bioObj) })
        .eq('id', userId);
        
      // Award XP
      xpAwardedResult = await dataService.updateXp(userId, 20);
    } else {
      xpAwardedResult = { limitReached: true };
    }

    return {
      comment: data[0],
      xpResult: xpAwardedResult
    };
  },

  // --- PERFIL / GAMIFICAÇÃO ---
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  updateXp: async (userId, xpToAdd) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, nivel')
      .eq('id', userId)
      .single();

    const currentXp = profile?.xp || 0;
    const newXp = Math.max(0, currentXp + xpToAdd);

    // Lógica de 5 níveis
    let newNivel = 'Bronze';
    if (newXp >= 2000) newNivel = 'Diamante';
    else if (newXp >= 1000) newNivel = 'Platina';
    else if (newXp >= 500) newNivel = 'Ouro';
    else if (newXp >= 200) newNivel = 'Prata';

    const { data, error } = await supabase
      .from('profiles')
      .update({ xp: newXp, nivel: newNivel })
      .eq('id', userId);

    if (error) throw error;
    
    return {
      success: true,
      xp: newXp,
      nivel: newNivel,
      prevLevel: profile?.nivel || 'Bronze',
      xpAdded: xpToAdd
    };
  },

  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  updateEmail: async (newEmail) => {
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;
    return data;
  },

  updateAvatar: async (userId, avatarUrl) => {
    // Check if user already had an avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;

    let xpAwardedResult = null;
    if (profile && !profile.avatar_url && avatarUrl) {
      xpAwardedResult = await dataService.updateXp(userId, 50);
    }

    return {
      data,
      xpResult: xpAwardedResult
    };
  },

  updateBio: async (userId, bioText) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio: bioText })
      .eq('id', userId);

    if (error) throw error;
    return data;
  },

  uploadAvatar: async (userId, file) => {
    const fileExt = file.uri.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    // Usando Base64 decode para ArrayBuffer (mais estável no Android)
    const base64 = file.base64;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, decode(base64), {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Erro no upload Supabase:', error);
      throw error;
    }

    const { data: result } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return result.publicUrl;
  },

  uploadChatFile: async (userId, localUri, contentType, base64 = null) => {
    try {
      const fileExt = localUri.split('.').pop() || 'jpg';
      const fileName = `chat-media-${userId}-${Date.now()}.${fileExt}`;
      
      let uploadBody;
      if (base64) {
        // Envio ultra-estável via ArrayBuffer para imagens e arquivos com base64
        uploadBody = decode(base64);
      } else {
        // Para áudios (onde não temos base64 direto), lemos o arquivo local como Blob,
        // convertemos para Base64 usando o FileReader nativo do React Native e decodificamos
        // para ArrayBuffer. Isso evita enviar Blobs na ponte de rede externa do Android,
        // o que causa o bug crônico 'Network request failed'.
        let uploadUri = localUri;
        if (Platform.OS === 'android' && !uploadUri.startsWith('file://') && !uploadUri.startsWith('content://') && !uploadUri.startsWith('http')) {
          uploadUri = `file://${uploadUri}`;
        }
        
        const response = await fetch(uploadUri);
        const blob = await response.blob();
        
        // Conversão estável de Blob para Base64 em JS
        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        const base64Pure = base64Data.split(',')[1];
        uploadBody = decode(base64Pure);
      }

      const { data, error } = await supabase.storage
        .from('avatars') // Reutiliza o bucket público 'avatars'
        .upload(fileName, uploadBody, {
          contentType: contentType || 'application/octet-stream',
          upsert: true
        });

      if (error) {
        console.error('Erro no upload de arquivo do chat:', error);
        throw error;
      }

      const { data: result } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return result.publicUrl;
    } catch (e) {
      console.error('Falha ao processar upload local:', e);
      throw e;
    }
  },

  uploadAudio: async (userId, localUri, base64 = null) => {
    try {
      const fileExt = localUri.split('.').pop() || 'mp3';
      const fileName = `observation-audio-${userId}-${Date.now()}.${fileExt}`;
      
      let uploadBody;
      if (base64) {
        uploadBody = decode(base64);
      } else {
        let uploadUri = localUri;
        if (Platform.OS === 'android' && !uploadUri.startsWith('file://') && !uploadUri.startsWith('content://') && !uploadUri.startsWith('http')) {
          uploadUri = `file://${uploadUri}`;
        }
        
        const response = await fetch(uploadUri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        const base64Pure = base64Data.split(',')[1];
        uploadBody = decode(base64Pure);
      }

      const { data, error } = await supabase.storage
        .from('sons')
        .upload(fileName, uploadBody, {
          contentType: `audio/${fileExt === 'mp3' ? 'mpeg' : fileExt}`,
          upsert: true
        });

      if (error) {
        console.error('Erro no upload do áudio da observação:', error);
        throw error;
      }

      const { data: result } = supabase.storage
        .from('sons')
        .getPublicUrl(fileName);

      return result.publicUrl;
    } catch (e) {
      console.error('Falha ao processar upload de áudio local:', e);
      throw e;
    }
  },

  verifyCurrentPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return false;
    return true;
  },

  // --- CHAT & REAL-TIME MESSAGING ---
  getOrCreateChat: async (userId, recipientId) => {
    const { data: existing, error } = await supabase
      .from('chats')
      .select('*')
      .or(`and(user_id.eq.${userId},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (existing && existing.length > 0) {
      return existing[0];
    }

    const { data: created, error: createErr } = await supabase
      .from('chats')
      .insert([
        { user_id: userId, recipient_id: recipientId, last_message: '', unread_count: 0 }
      ])
      .select()
      .single();

    if (createErr) throw createErr;
    return created;
  },

  getChats: async (userId) => {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        user:user_id ( id, full_name, avatar_url, nivel ),
        recipient:recipient_id ( id, full_name, avatar_url, nivel )
      `)
      .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getMessages: async (chatId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  sendMessage: async (chatId, senderId, text) => {
    const { data: msg, error: msgErr } = await supabase
      .from('messages')
      .insert([
        { chat_id: chatId, sender_id: senderId, text: text, status: 'sent' }
      ])
      .select()
      .single();

    if (msgErr) throw msgErr;

    const { data: chatData } = await supabase
      .from('chats')
      .select('unread_count')
      .eq('id', chatId)
      .single();

    const newUnread = (chatData?.unread_count || 0) + 1;

    const { error: chatErr } = await supabase
      .from('chats')
      .update({ last_message: text, unread_count: newUnread })
      .eq('id', chatId);

    if (chatErr) console.error('Error updating last message in chat:', chatErr);

    return msg;
  },

  markMessagesAsDelivered: async (chatId, currentUserId) => {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'delivered' })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUserId)
      .eq('status', 'sent');

    if (error) {
      console.error('Error marking messages as delivered:', error);
    }

    const { error: chatErr } = await supabase
      .from('chats')
      .update({ unread_count: 0 })
      .eq('id', chatId);

    if (chatErr) {
      console.error('Error resetting unread count:', chatErr);
    }
  },

  // --- FOLLOWERS SYSTEM ---
  followUser: async (userId, followerId) => {
    const { data, error } = await supabase
      .from('followers')
      .insert([
        { user_id: userId, follower_id: followerId }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  unfollowUser: async (userId, followerId) => {
    const { data, error } = await supabase
      .from('followers')
      .delete()
      .eq('user_id', userId)
      .eq('follower_id', followerId);

    if (error) throw error;
    return data;
  },

  getFollowers: async (userId) => {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        id,
        follower:follower_id ( id, full_name, avatar_url, nivel )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.follower).filter(Boolean);
  },

  getFollowing: async (userId) => {
    const { data, error } = await supabase
      .from('followers')
      .select(`
        id,
        user:user_id ( id, full_name, avatar_url, nivel )
      `)
      .eq('follower_id', userId);

    if (error) throw error;
    return data.map(item => item.user).filter(Boolean);
  },

  checkIfFollowing: async (userId, followerId) => {
    const { data, error } = await supabase
      .from('followers')
      .select('*')
      .eq('user_id', userId)
      .eq('follower_id', followerId)
      .limit(1);

    if (error) return false;
    return data && data.length > 0;
  },

  getLatestMessage: async (chatId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
  },

  getUnreadCount: async (chatId, currentUserId) => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('sender_id', currentUserId)
      .eq('status', 'sent');

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
    return count || 0;
  },

  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, nivel');

    if (error) throw error;
    return data;
  }
};
