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
        }
      ])
      .select();

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
      observation: data[0],
      xpResult: xpAwardedResult
    };
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

  verifyCurrentPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return false;
    return true;
  }
};
