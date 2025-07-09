// Test Data Factories for Tournament Management System
import { faker } from '@faker-js/faker';

export interface MockUser {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  phone: string;
  city: string;
  district: string;
  skill_level: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

export interface MockTournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  entry_fee: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MockMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  tournament_id?: string;
  status: string;
  score_player1: number;
  score_player2: number;
  winner_id?: string;
  played_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MockClub {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  user_id: string;
  verification_status: string;
  number_of_tables: number;
  created_at: string;
  updated_at: string;
}

// User Factory
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  const defaultUser: MockUser = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    display_name: faker.internet.username(),
    full_name: faker.person.fullName(),
    phone: faker.phone.number('0#########'),
    city: faker.location.city(),
    district: faker.location.streetName(),
    skill_level: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced', 'professional']),
    bio: faker.lorem.sentence(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };

  return { ...defaultUser, ...overrides };
};

// Tournament Factory
export const createMockTournament = (overrides: Partial<MockTournament> = {}): MockTournament => {
  const startDate = faker.date.future();
  const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

  const defaultTournament: MockTournament = {
    id: faker.string.uuid(),
    name: `${faker.company.name()} Pool Tournament`,
    description: faker.lorem.paragraph(),
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    max_participants: faker.number.int({ min: 8, max: 64 }),
    entry_fee: faker.number.int({ min: 100000, max: 1000000 }),
    status: faker.helpers.arrayElement(['upcoming', 'ongoing', 'completed', 'cancelled']),
    created_by: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };

  return { ...defaultTournament, ...overrides };
};

// Match Factory
export const createMockMatch = (overrides: Partial<MockMatch> = {}): MockMatch => {
  const score1 = faker.number.int({ min: 0, max: 10 });
  const score2 = faker.number.int({ min: 0, max: 10 });
  const player1Id = faker.string.uuid();
  const player2Id = faker.string.uuid();
  
  const defaultMatch: MockMatch = {
    id: faker.string.uuid(),
    player1_id: player1Id,
    player2_id: player2Id,
    tournament_id: faker.string.uuid(),
    status: faker.helpers.arrayElement(['pending', 'ongoing', 'completed', 'cancelled']),
    score_player1: score1,
    score_player2: score2,
    winner_id: score1 > score2 ? player1Id : score2 > score1 ? player2Id : undefined,
    played_at: faker.date.recent().toISOString(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };

  return { ...defaultMatch, ...overrides };
};

// Club Factory
export const createMockClub = (overrides: Partial<MockClub> = {}): MockClub => {
  const defaultClub: MockClub = {
    id: faker.string.uuid(),
    club_name: `${faker.company.name()} Pool Club`,
    address: faker.location.streetAddress(),
    phone: faker.phone.number('0#########'),
    user_id: faker.string.uuid(),
    verification_status: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
    number_of_tables: faker.number.int({ min: 2, max: 20 }),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };

  return { ...defaultClub, ...overrides };
};

// Bulk factory functions
export const createMockUsers = (count: number): MockUser[] => {
  return Array.from({ length: count }, () => createMockUser());
};

export const createMockTournaments = (count: number): MockTournament[] => {
  return Array.from({ length: count }, () => createMockTournament());
};

export const createMockMatches = (count: number): MockMatch[] => {
  return Array.from({ length: count }, () => createMockMatch());
};

export const createMockClubs = (count: number): MockClub[] => {
  return Array.from({ length: count }, () => createMockClub());
};

// Scenario-specific factories
export const createTournamentWithParticipants = (participantCount: number = 16) => {
  const tournament = createMockTournament({ max_participants: participantCount });
  const participants = createMockUsers(participantCount);
  const matches = [];

  // Create bracket matches
  for (let i = 0; i < participantCount - 1; i += 2) {
    matches.push(createMockMatch({
      player1_id: participants[i].id,
      player2_id: participants[i + 1].id,
      tournament_id: tournament.id,
    }));
  }

  return { tournament, participants, matches };
};

export const createClubWithMembers = (memberCount: number = 10) => {
  const club = createMockClub();
  const members = createMockUsers(memberCount);
  
  return { club, members };
};

// Performance testing data
export const createLargeDataset = () => {
  return {
    users: createMockUsers(1000),
    tournaments: createMockTournaments(100),
    matches: createMockMatches(5000),
    clubs: createMockClubs(50),
  };
};

// Edge case factories
export const createEdgeCaseData = () => {
  return {
    emptyTournament: createMockTournament({ 
      max_participants: 0,
      entry_fee: 0,
      status: 'cancelled' 
    }),
    longNameUser: createMockUser({
      display_name: 'a'.repeat(100),
      full_name: 'Very Long Name '.repeat(10),
    }),
    expiredTournament: createMockTournament({
      start_date: new Date('2020-01-01').toISOString(),
      end_date: new Date('2020-01-02').toISOString(),
      status: 'completed',
    }),
  };
};