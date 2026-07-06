// ─────────────────────────────────────────────────────────────────────────────
// RibbitApp — Mock Data Service
// Location: C:\Ribbit\RibbitApp\src\services\mockDataService.js
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_SPECIES = [
  {
    id: 'sp-1',
    nome_popular: 'Sapo-cururu',
    nome_cientifico: 'Rhinella diptycha',
    regiao: 'Cerrado e Caatinga',
    habitat: 'Área Urbana e Brejos',
    descricao: 'Grande anfíbio terrestre com pele rugosa. É conhecido pelo seu coaxar grave e compassado que se assemelha a um "rô-rô-rô". Muito comum em quintais e áreas próximas a rios e brejos.',
    dicas_identificacao: 'Geralmente marrom-acinzentado, com glândulas paratóides proeminentes atrás dos olhos. Prefere solos úmidos à noite.',
    fatos_curiosos: 'Suas glândulas produzem uma toxina de defesa, mas ele é inofensivo se não for manuseado de forma agressiva.'
  },
  {
    id: 'sp-2',
    nome_popular: 'Perereca-verde',
    nome_cientifico: 'Aplastodiscus argyreornatus',
    regiao: 'Mata Atlântica',
    habitat: 'Florestas e Bromélias',
    descricao: 'Uma pequena perereca de coloração verde brilhante adaptada para a vida arbórea. O seu coaxar é um som curto e agudo, parecido com um assobio metálico rápido.',
    dicas_identificacao: 'Corpo verde limão uniforme com olhos pretos salientes. Ventosas bem desenvolvidas nas pontas dos dedos para escalar folhas.',
    fatos_curiosos: 'Esta espécie camufla-se perfeitamente entre as folhas de bromélias, onde também deposita seus ovos na água acumulada.'
  },
  {
    id: 'sp-3',
    nome_popular: 'Rã-pimenta',
    nome_cientifico: 'Leptodactylus labyrinthicus',
    regiao: 'Sudeste e Centro-Oeste',
    habitat: 'Margens de Lagoas e Pastagens',
    descricao: 'Anfíbio robusto de comportamento semi-aquático. Seu canto é forte e ecoante, como um "whip" estalado ouvido no início das noites chuvosas.',
    dicas_identificacao: 'Coloração marrom com padrões labirínticos e pregas cutâneas longitudinais. Interior das coxas avermelhado com manchas pretas.',
    fatos_curiosos: 'Recebe o nome "rã-pimenta" devido a uma secreção ácida na pele que pode causar leve ardência ao contato.'
  },
  {
    id: 'sp-4',
    nome_popular: 'Sapinho-adornado',
    nome_cientifico: 'Brachycephalus alniphilus',
    regiao: 'Mata Atlântica (Serra do Mar)',
    habitat: 'Serrapilheira de Floresta',
    descricao: 'Sapinho minúsculo que vive no chão da floresta sob as folhas caídas. Emite um som estridente e contínuo, semelhante ao canto de um grilo.',
    dicas_identificacao: 'Tamanho extremamente reduzido (menos de 2 cm), coloração amarela ou alaranjada vibrante, marcha lenta.',
    fatos_curiosos: 'Muitos sapinhos deste gênero têm ossos fluorescentes que brilham sob luz ultravioleta.'
  }
];

export const MOCK_USER = {
  id: 'usr-default',
  nome: 'Alex Silva',
  email: 'alex@ribbitapp.com',
  permissao: 'usuario', // 'usuario', 'revisor', 'admin'
  xp: 250,
  nivel: 'Coaxador Prata',
  contribuicoes_aprovadas: 3
};

// Histórico inicial de observações enviadas (sons)
let localSons = [
  {
    id: 'snd-1',
    especie_id: 'sp-1',
    usuario_id: 'usr-default',
    usuario_nome: 'Alex Silva',
    arquivo_url: 'snd_cururu_record.mp3',
    localizacao: 'Parque Ibirapuera, SP',
    data_captura: '2026-07-01T20:30:00Z',
    status_revisao: 'aprovado',
    comentarios_revisor: 'Identificação correta. Espectrograma de áudio limpo.'
  },
  {
    id: 'snd-2',
    especie_id: 'sp-2',
    usuario_id: 'usr-default',
    usuario_nome: 'Alex Silva',
    arquivo_url: 'snd_perereca_record.mp3',
    localizacao: 'Ubatuba, SP',
    data_captura: '2026-07-04T22:15:00Z',
    status_revisao: 'pendente',
    comentarios_revisor: null
  }
];

// Comentários das espécies
let localComentarios = [
  {
    id: 'c-1',
    som_id: 'snd-1',
    usuario_nome: 'Prof. Carlos (Revisor)',
    texto: 'Incrível registro acústico! É perceptível a frequência de 1.2 kHz típica do Rhinella diptycha.',
    criado_em: '2026-07-02T08:00:00Z'
  },
  {
    id: 'c-2',
    som_id: 'snd-1',
    usuario_nome: 'Alex Silva',
    texto: 'Obrigado professor! Encontrei perto da lagoa após uma chuva forte de verão.',
    criado_em: '2026-07-02T10:30:00Z'
  }
];

export const mockDataService = {
  getSpecies: () => MOCK_SPECIES,
  
  getSpeciesById: (id) => MOCK_SPECIES.find(s => s.id === id),
  
  getSons: () => localSons,

  getSonsBySpecies: (speciesId) => localSons.filter(s => s.especie_id === speciesId),

  getComentarios: (somId) => localComentarios.filter(c => c.som_id === somId),

  addComentario: (somId, texto, usuarioNome = 'Alex Silva') => {
    const newComment = {
      id: `c-${Date.now()}`,
      som_id: somId,
      usuario_nome: usuarioNome,
      texto: texto,
      criado_em: new Date().toISOString()
    };
    localComentarios.push(newComment);
    return newComment;
  },

  addSon: (especieId, localizacao, arquivoUrl = 'new_capture.mp3') => {
    const newSon = {
      id: `snd-${Date.now()}`,
      especie_id: especieId,
      usuario_id: MOCK_USER.id,
      usuario_nome: MOCK_USER.nome,
      arquivo_url: arquivoUrl,
      localizacao: localizacao || 'Coordenadas Atuais',
      data_captura: new Date().toISOString(),
      status_revisao: 'pendente',
      comentarios_revisor: null
    };
    localSons.push(newSon);
    // Ganha XP ao enviar
    MOCK_USER.xp += 50;
    return newSon;
  },

  reviewSon: (sonId, aprovado, comentarios) => {
    const son = localSons.find(s => s.id === sonId);
    if (son) {
      son.status_revisao = aprovado ? 'aprovado' : 'rejeitado';
      son.comentarios_revisor = comentarios;
      
      if (aprovado && son.usuario_id === MOCK_USER.id) {
        MOCK_USER.xp += 100;
        MOCK_USER.contribuicoes_aprovadas += 1;
        // Atualiza títulos/nível de gamificação
        if (MOCK_USER.contribuicoes_aprovadas >= 5) {
          MOCK_USER.nivel = 'Coaxador de Ouro';
        } else if (MOCK_USER.contribuicoes_aprovadas >= 3) {
          MOCK_USER.nivel = 'Coaxador Prata';
        }
      }
    }
    return son;
  },

  getUserProfile: () => MOCK_USER
};
