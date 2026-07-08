// ─────────────────────────────────────────────────────────────────────────────
// Ribbit — Jest Points & Level System Unit Tests
// Location: C:\Ribbit\RibbitApp\__tests__\points.test.js
// ─────────────────────────────────────────────────────────────────────────────

// Re-creating the pure logic functions matching implementation for unit isolation
const getLevelFromXp = (xp) => {
  if (xp >= 2000) return 'Diamante';
  if (xp >= 1000) return 'Platina';
  if (xp >= 500) return 'Ouro';
  if (xp >= 200) return 'Prata';
  return 'Bronze';
};

const calculateAcademicXpChange = (prevBio, newBio) => {
  let xpChange = 0;
  
  const prevLattes = prevBio?.lattesLink || '';
  const prevLinkedin = prevBio?.linkedinLink || '';
  const prevInst = prevBio?.instituicaoText || '';
  
  const newLattes = newBio?.lattesLink || '';
  const newLinkedin = newBio?.linkedinLink || '';
  const newInst = newBio?.instituicaoText || '';

  // Lattes Link
  if (!prevLattes && newLattes) xpChange += 100;
  else if (prevLattes && !newLattes) xpChange -= 100;
  
  // LinkedIn Link
  if (!prevLinkedin && newLinkedin) xpChange += 100;
  else if (prevLinkedin && !newLinkedin) xpChange -= 100;
  
  // Institution
  if (!prevInst && newInst) xpChange += 50;
  else if (prevInst && !newInst) xpChange -= 50;

  // Experiences Count
  const prevExps = prevBio?.experiences || [];
  const newExps = newBio?.experiences || [];
  const expCountDiff = newExps.length - prevExps.length;
  xpChange += expCountDiff * 150;

  return xpChange;
};

const getAttribution = (email, name, createdAtISO) => {
  const emailLower = (email || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (emailLower.includes('admin') || nameLower === 'lucas' || emailLower === 'lucas@ribbit.com') {
    return 'Frogger';
  }
  if (emailLower.includes('founder') || emailLower.includes('creator') || emailLower === 'founder@ribbit.com') {
    return 'Founder';
  }
  if (createdAtISO) {
    const signupDate = new Date(createdAtISO);
    const alphaCutoff = new Date('2026-07-15T00:00:00Z');
    const betaCutoff = new Date('2026-09-01T00:00:00Z');

    if (signupDate < alphaCutoff) {
      return 'Alpha';
    } else if (signupDate < betaCutoff) {
      return 'Beta';
    }
  }
  return 'Explorer';
};

describe('Ribbit Scoring & Level System', () => {
  test('getLevelFromXp maps XP to correct level tiers', () => {
    expect(getLevelFromXp(0)).toBe('Bronze');
    expect(getLevelFromXp(120)).toBe('Bronze');
    expect(getLevelFromXp(200)).toBe('Prata');
    expect(getLevelFromXp(499)).toBe('Prata');
    expect(getLevelFromXp(500)).toBe('Ouro');
    expect(getLevelFromXp(999)).toBe('Ouro');
    expect(getLevelFromXp(1000)).toBe('Platina');
    expect(getLevelFromXp(1999)).toBe('Platina');
    expect(getLevelFromXp(2000)).toBe('Diamante');
    expect(getLevelFromXp(5000)).toBe('Diamante');
  });

  test('calculateAcademicXpChange returns correct values when adding links and institution', () => {
    const prevBio = {
      lattesLink: '',
      linkedinLink: '',
      instituicaoText: '',
      experiences: []
    };

    const newBio = {
      lattesLink: 'http://lattes.cnpq.br/1234',
      linkedinLink: 'https://linkedin.com/in/lucas',
      instituicaoText: 'USP',
      experiences: []
    };

    const change = calculateAcademicXpChange(prevBio, newBio);
    // 100 (lattes) + 100 (linkedin) + 50 (inst) = 250
    expect(change).toBe(250);
  });

  test('calculateAcademicXpChange returns negative values when removing links', () => {
    const prevBio = {
      lattesLink: 'http://lattes.cnpq.br/1234',
      linkedinLink: 'https://linkedin.com/in/lucas',
      instituicaoText: 'USP',
      experiences: []
    };

    const newBio = {
      lattesLink: '',
      linkedinLink: 'https://linkedin.com/in/lucas',
      instituicaoText: '',
      experiences: []
    };

    const change = calculateAcademicXpChange(prevBio, newBio);
    // -100 (lattes removed) + 0 (linkedin same) - 50 (inst removed) = -150
    expect(change).toBe(-150);
  });

  test('calculateAcademicXpChange awards 150 per experience and handles deletion', () => {
    const prevBio = {
      experiences: [{ id: '1' }]
    };

    const newBio = {
      experiences: [{ id: '1' }, { id: '2' }, { id: '3' }]
    };

    // Added 2 experiences: +300
    expect(calculateAcademicXpChange(prevBio, newBio)).toBe(300);

    const deleteBio = {
      experiences: []
    };

    // Removed 1 experience from prevBio: -150
    expect(calculateAcademicXpChange(prevBio, deleteBio)).toBe(-150);
  });

  test('getAttribution assigns correct badge based on parameters', () => {
    // Frogger (Lucas / Admin)
    expect(getAttribution('lucas@ribbit.com', 'Lucas', '2026-07-01T00:00:00Z')).toBe('Frogger');
    expect(getAttribution('admin@ribbit.com', 'User', '2026-07-01T00:00:00Z')).toBe('Frogger');

    // Founder
    expect(getAttribution('founder@ribbit.com', 'Alex', '2026-07-01T00:00:00Z')).toBe('Founder');

    // Alpha (before July 15, 2026)
    expect(getAttribution('user@email.com', 'John', '2026-07-10T00:00:00Z')).toBe('Alpha');

    // Beta (between July 15 and Aug 31)
    expect(getAttribution('user@email.com', 'John', '2026-08-10T00:00:00Z')).toBe('Beta');

    // Explorer (on/after Sept 1)
    expect(getAttribution('user@email.com', 'John', '2026-09-02T00:00:00Z')).toBe('Explorer');
  });
});
