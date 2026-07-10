-- ─────────────────────────────────────────────────────────────────────────────
-- Ribbit Database Migration: Seed Species & Audit History
-- Location: C:\Ribbit\RibbitApp\supabase\migrations\20260710_seed_species.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adicionar colunas adicionais à tabela de espécies (suporta se já existirem)
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS tipo text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS som_tipo text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS imagem_url text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS habitat text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS fatos_curiosos text;

-- 2. Criar a tabela de histórico de alterações de espécies (Auditoria/Versionamento)
CREATE TABLE IF NOT EXISTS public.species_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_id uuid,
  usuario_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  acao text NOT null CHECK (acao IN ('criacao', 'edicao', 'exclusao')),
  detalhes jsonb,
  criado_em timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.species_history ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas de histórico se existirem
DROP POLICY IF EXISTS "species_history_select_policy" ON public.species_history;
DROP POLICY IF EXISTS "species_history_all_admin_revisor" ON public.species_history;

-- Criar políticas limpas para histórico
CREATE POLICY "species_history_select_policy" ON public.species_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "species_history_all_admin_revisor" ON public.species_history
  FOR ALL USING (
    public.check_user_permissao(auth.uid()) IN ('revisor', 'admin')
  );

-- 3. Limpar dados anteriores de espécies para evitar duplicações no teste
DELETE FROM public.species;

-- 4. Inserir dados de semente (10 espécies herpetológicas brasileiras)
INSERT INTO public.species (id, nome_popular, nome_cientifico, regiao, habitat, descricao, fatos_curiosos, tipo, som_tipo, imagem_url) VALUES
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0001',
  'Sapo-cururu',
  'Rhinella diptycha',
  'Todo o Brasil',
  'Áreas urbanas, quintais, beiras de lagoas e margens de brejos',
  'Um dos sapos mais conhecidos do Brasil, caracterizado por seu grande porte, pele seca e rugosa coberta de verrugas e glândulas parotoides produtoras de veneno na parte traseira da cabeça. É extremamente benéfico no controle biológico de pragas, pois consome grandes quantidades de insetos noturnos.',
  'O veneno do sapo-cururu só é liberado se as suas glândulas parotoides nas laterais da cabeça forem ativamente espremidas. Ele não consegue lançar veneno à distância e é inofensivo se respeitado.',
  'Sapo',
  'grave',
  'https://images.unsplash.com/photo-1563200921-774f2662c16c?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0002',
  'Perereca-de-banheiro',
  'Boana albopunctata',
  'Sudeste e Centro-Oeste',
  'Vegetação marginal, brejos e construções humanas úmidas',
  'Pequena perereca de coloração amarelada a acastanhada com manchas claras nas coxas. Apresenta discos adesivos desenvolvidos nas pontas dos dedos, permitindo escalar com facilidade superfícies verticais extremamente lisas como paredes e azulejos.',
  'São chamadas popularmente de pererecas-de-banheiro pois costumam entrar em banheiros de casas de campo atraídas pela alta umidade e pelos insetos que se concentram perto de lâmpadas.',
  'Perereca',
  'grilo',
  'https://images.unsplash.com/photo-1579380656108-f98e4df8ea62?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0003',
  'Rã-manteiga',
  'Leptodactylus latrans',
  'Cerrado e Caatinga',
  'Lagoas temporárias, brejos abertos e pastagens úmidas',
  'Rã terrestre robusta, de pele lisa e brilhante, marcada por dobras longitudinais e manchas escuras circulares. Excelente saltadora e nadadora ágil. Seu coaxar assemelha-se a um estalo sonoro ou gotejar metálico alto.',
  'Durante a época de reprodução, as fêmeas criam ninhos de espuma flutuantes sobre a água para depositar seus ovos, protegendo os embriões de predadores aquáticos e desidratação.',
  'Rã',
  'estalado',
  'https://images.unsplash.com/photo-1622273464529-65123d573ebc?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0004',
  'Sapinho-pingo-de-ouro',
  'Brachycephalus ephippium',
  'Mata Atlântica',
  'Serrapilheira (chão de floresta densa e úmida)',
  'Sapinho minúsculo de cor laranja-viva brilhante que vive na serrapilheira das florestas montanhosas da Mata Atlântica. Possui hábitos diurnos e se move lentamente sobre o solo florestal úmido.',
  'Eles são tão diminutos que não possuem ouvido médio funcional. Os machos cantam para fins territoriais e de acasalamento, mas são fisicamente incapazes de ouvir os próprios cantos!',
  'Sapo',
  'metálico',
  'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0005',
  'Rã-touro',
  'Lithobates catesbeianus',
  'Sul e Sudeste',
  'Lagos artificiais, açudes, represas e tanques de piscicultura',
  'Espécie de rã gigante introduzida no Brasil oriunda da América do Norte para fins de ranicultura. Tem coloração verde-escura a parda e coaxar extremamente forte e cavernoso que lembra o mugido de um touro.',
  'Considerada uma espécie exótica invasora de grande perigo ecológico. Por ser gigante, ela devora outros anfíbios nativos, peixes, cobras e até mesmo pequenos mamíferos e aves.',
  'Rã',
  'grave',
  'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0006',
  'Perereca-leiteira',
  'Trachycephalus typhonius',
  'Norte e Nordeste',
  'Dossel de florestas tropicais, troncos de árvores e bromélias',
  'Perereca de grande porte com pele muito áspera e verrugosa. Habita principalmente copas de árvores. Quando se sente ameaçada ou é capturada, ela excreta uma resina branca e pegajosa parecida com leite.',
  'Essa secreção leitosa colante é extremamente amarga e irritante para as mucosas de predadores. Ela é capaz de colar a boca de pequenas cobras e aves, permitindo a fuga da perereca.',
  'Perereca',
  'grave',
  'https://images.unsplash.com/photo-1550147760-44c9966d6bc7?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0007',
  'Sapo-cururu-amarelo',
  'Rhinella icterica',
  'Sudeste e Sul',
  'Bordas de florestas, riachos de águas limpas e áreas verdes urbanas',
  'Grande sapo terrestre intimamente relacionado ao cururu comum. Apresenta forte dimorfismo sexual de cor: os machos maduros são inteiramente amarelo-claros, enquanto as fêmeas exibem padrões cinzas com manchas pretas e brancas.',
  'Os machos reúnem-se em grandes coros reprodutivos nas margens de riachos e lagoas durante as noites mais quentes de primavera e verão, emitindo um coaxar grave rítmico contínuo.',
  'Sapo',
  'grave',
  'https://images.unsplash.com/photo-1590005354167-6da97870c913?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0008',
  'Rã-cachorrinho',
  'Physalaemus cuvieri',
  'Todo o Brasil',
  'Brejos temporários, poças d''água rasas e pastagens abertas',
  'Pequena rã terrestre de hábitos noturnos e coloração cinza a marrom. Seu coaxar é muito marcante na herpetofauna brasileira, assemelhando-se exatamente ao latido agudo e rápido de um cachorrinho novo.',
  'Fazem ninhos de espuma flutuantes e densos em poças rasas para abrigar seus ovos. Seus girinos se desenvolvem muito rápido para escapar antes que as poças temporárias sequem totalmente.',
  'Rã',
  'grilo',
  'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0009',
  'Perereca-de-vidro',
  'Teratohyla spinosa',
  'Norte e Litoral do Brasil',
  'Folhagem de arbustos e árvores baixas pendendo sobre riachos límpidos',
  'Perereca de tamanho diminuto que chama a atenção mundial por sua pele dorsal verde com pequenos pontos e sua pele ventral completamente transparente, que permite observar os ossos, intestinos e o coração batendo.',
  'Sua transparência atua como camuflagem de iluminação difusa (camuflagem disruptiva) que impede que predadores detectem sua silhueta contra a folhagem iluminada por trás.',
  'Perereca',
  'metálico',
  'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=600&auto=format&fit=crop'
),
(
  'e0d7c71e-080c-4074-ba0d-66cd5f5d0010',
  'Perereca-verde',
  'Aplastodiscus arildae',
  'Mata Atlântica',
  'Vegetação marginal lenhosa e arbustiva de riachos montanhosos',
  'Perereca de tamanho médio caracterizada por sua coloração verde-limão viva e homogênea e grandes olhos dourados saltados. Seu canto nupcial consiste em estalos isolados de tom alto produzidos na vegetação do riacho.',
  'Os machos constroem câmaras subterrâneas nas margens lamacentas dos riachos, onde atraem as fêmeas para acasalar dentro desse ninho de bacia de lama escavado.',
  'Perereca',
  'estalado',
  'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=600&auto=format&fit=crop'
);
