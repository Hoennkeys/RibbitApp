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

  addObservation: async (especieId, localizacao, userId) => {
    const { data, error } = await supabase
      .from('observations')
      .insert([
        {
          especie_id: especieId,
          usuario_id: userId,
          localizacao: localizacao,
          status_revisao: 'pendente',
        }
      ])
      .select();

    if (error) throw error;

    // Ganha XP ao enviar
    await dataService.updateXp(userId, 50);

    return data[0];
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
    return data[0];
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
    const newXp = currentXp + xpToAdd;

    // Lógica simples de nível
    let newNivel = profile?.nivel || 'Coaxador Bronze';
    if (newXp >= 500) newNivel = 'Coaxador Ouro';
    else if (newXp >= 200) newNivel = 'Coaxador Prata';

    const { data, error } = await supabase
      .from('profiles')
      .update({ xp: newXp, nivel: newNivel })
      .eq('id', userId);

    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) throw error;
    return data;
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

  verifyCurrentPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return false;
    return true;
  }
};
