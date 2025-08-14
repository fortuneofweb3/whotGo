const functions = require('firebase-functions');
const admin = require('firebase-admin');

const REGION = 'europe-west1';

try {
  admin.initializeApp({
    databaseURL: 'https://xashmarkets-1-default-rtdb.europe-west1.firebasedatabase.app'
  });
} catch (e) {}
const db = admin.database();

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 1,  name: 'First Victory',        check: u => (u.gamesWon || 0) >= 1 },
  { id: 2,  name: 'Card Master',          check: u => (u.gamesPlayed || 0) >= 10 },
  { id: 3,  name: 'Shadow Warrior',       check: u => (u.currentWinStreak || 0) >= 5 },
  { id: 4,  name: 'Strategic Mind',       check: u => (u.gamesWon || 0) >= 20 },
  { id: 5,  name: 'Century Club',         check: u => (u.gamesPlayed || 0) >= 100 },
  { id: 6,  name: 'Ultimate Champion',    check: u => levelFromXP(u.xp || 0) >= 50 },
  { id: 7,  name: 'Legendary Player',     check: u => levelFromXP(u.xp || 0) >= 75 },
  { id: 8,  name: 'Whot Grandmaster',     check: u => levelFromXP(u.xp || 0) >= 100 }
];
// Callable function to claim an achievement reward securely
exports.claimAchievement = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const userId = context.auth?.uid || data.userId;
    const achievementId = Number(data.achievementId);
    if (!userId || !achievementId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing userId or achievementId');
    }
    const userRef = db.ref(`users/${userId}`);
    const snap = await userRef.get();
    if (!snap.exists()) throw new functions.https.HttpsError('not-found', 'User not found');
    const user = snap.val();
    // Ensure achievement is unlocked
    const unlocked = user.achievementsUnlocked || [];
    if (!unlocked.includes(achievementId)) {
      throw new functions.https.HttpsError('failed-precondition', 'Achievement not unlocked');
    }
    const alreadyClaimed = (user.claimedAchievements || []).includes(achievementId);
    if (alreadyClaimed) return { ok: true, xp: user.xp || 0 };
    // Reward table (match UI text)
    const rewardById = { 1: 100, 2: 200, 3: 500, 4: 1200, 5: 1500, 6: 2000, 7: 3000, 8: 5000 };
    const xpReward = rewardById[achievementId] || 0;
    const newXP = (user.xp || 0) + xpReward;
    const newClaimed = [...(user.claimedAchievements || []), achievementId];
    await userRef.update({ xp: newXP, claimedAchievements: newClaimed, lastActive: Date.now() });
    return { ok: true, xp: newXP };
  });


function levelFromXP(xp) {
  return Math.floor((xp || 0) / 100) + 1;
}

// Scheduled function to purge inactive rooms (waiting or countdown) with lastActive older than 5 minutes
exports.purgeInactiveRooms = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Etc/UTC')
  .onRun(async () => {
  const now = Date.now();
  const thresholdMs = 5 * 60 * 1000;
  const roomsRef = db.ref('rooms');
  const snapshot = await roomsRef.get();
  if (!snapshot.exists()) return null;
  const updates = {};
  snapshot.forEach(roomSnap => {
    const room = roomSnap.val();
    const roomId = roomSnap.key;
    const status = room?.status;
    const lastActive = typeof room?.lastActive === 'number' ? room.lastActive : 0;
    const shouldDelete = (status === 'waiting' || status === 'countdown') && lastActive && (now - lastActive > thresholdMs);
    if (shouldDelete) {
      updates[roomId] = null;
    }
  });
  if (Object.keys(updates).length > 0) {
    await roomsRef.update(updates);
  }
  return null;
});

// Update a numeric lastActive timestamp for any write inside a room
exports.markRoomActivity = functions
  .region(REGION)
  .database
  .instance('xashmarkets-1-default-rtdb')
  .ref('rooms/{roomId}/{rest=**}')
  .onWrite(async (change, context) => {
  const rest = context.params.rest || '';
  // avoid recursion when we write lastActive
  if (rest === 'lastActive') return null;
  const lastActiveRef = db.ref(`rooms/${context.params.roomId}/lastActive`);
  await lastActiveRef.set(Date.now());
  return null;
});

// Maintain per-user leaderboard entry on user profile/stat changes
exports.syncLeaderboardOnUserWrite = functions
  .region(REGION)
  .database
  .instance('xashmarkets-1-default-rtdb')
  .ref('users/{userId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists() ? change.after.val() : null;
    if (!after) {
      // remove from leaderboard on delete
      await db.ref(`leaderboard/users/${context.params.userId}`).remove();
      return null;
    }
    const xp = after.xp || 0;
    const gamesPlayed = after.gamesPlayed || 0;
    const gamesWon = after.gamesWon || 0;
    const level = levelFromXP(xp);
    const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;
    // Score prioritizes wins, then xp, then recent activity
    const score = gamesWon * 1_000_000 + xp * 100 + Math.floor(Date.now() / 1000) % 100; 
    const entry = {
      id: context.params.userId,
      username: after.username || context.params.userId,
      xp,
      level,
      gamesPlayed,
      gamesWon,
      winRate,
      score,
      updatedAt: Date.now()
    };
    await db.ref(`leaderboard/users/${context.params.userId}`).set(entry);
    return null;
  });

// Evaluate achievements server-side on user stat changes
exports.evaluateAchievementsOnUserWrite = functions
  .region(REGION)
  .database
  .instance('xashmarkets-1-default-rtdb')
  .ref('users/{userId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists() ? change.after.val() : null;
    if (!after) return null;
    const unlocked = ACHIEVEMENTS.filter(a => a.check(after)).map(a => a.id);
    await db.ref(`users/${context.params.userId}/achievementsUnlocked`).set(unlocked);
    return null;
  });

// Finalize multiplayer match and record history when a room's game ends
exports.finalizeRoomOnGameEnd = functions
  .region(REGION)
  .database
  .instance('xashmarkets-1-default-rtdb')
  .ref('rooms/{roomId}/gameData/gamePhase')
  .onWrite(async (change, context) => {
    const after = change.after.val();
    if (after !== 'gameEnd') return null;
    const roomId = context.params.roomId;
    const roomRef = db.ref(`rooms/${roomId}`);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists()) return null;
    const room = roomSnap.val();
    if (room.finalizedMatchId) return null; // already finalized
    const gameData = room.gameData || {};
    const players = Array.isArray(gameData.players) ? gameData.players : Object.values(gameData.players || {});
    const winner = gameData.winner;
    if (!winner || !players || players.length === 0) return null;
    // create match entry
    const matchRef = db.ref('matches').push();
    const startedAt = room.createdAt || Date.now();
    const finishedAt = Date.now();
    const matchId = matchRef.key;
    const playerSummaries = players.map(p => ({ id: p.id, name: p.name, won: p.id === winner.id }));
    await matchRef.set({ id: matchId, roomId, startedAt, finishedAt, winner: { id: winner.id, name: winner.name }, players: playerSummaries });
    // update each user's stats and history
    const updates = [];
    for (const p of players) {
      const uid = p.id;
      if (!uid) continue;
      const userRef = db.ref(`users/${uid}`);
      const userSnap = await userRef.get();
      const u = userSnap.exists() ? userSnap.val() : {};
      const won = p.id === winner.id;
      const xpGain = won ? 150 : 50;
      const newGamesPlayed = (u.gamesPlayed || 0) + 1;
      const newGamesWon = (u.gamesWon || 0) + (won ? 1 : 0);
      const newXP = (u.xp || 0) + xpGain;
      const newStreak = won ? (u.currentWinStreak || 0) + 1 : 0;
      const newBest = won ? Math.max(newStreak, u.bestWinStreak || 0) : (u.bestWinStreak || 0);
      updates.push(userRef.update({
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        xp: newXP,
        currentWinStreak: newStreak,
        bestWinStreak: newBest,
        lastMatchAt: finishedAt,
        lastActive: finishedAt
      }));
      updates.push(db.ref(`users/${uid}/history/${matchId}`).set({
        matchId,
        roomId,
        at: finishedAt,
        won,
        players: playerSummaries
      }));
    }
    await Promise.all(updates);
    // mark room finalized and ended
    await roomRef.update({ finalizedMatchId: matchId, status: 'ended' });
    return null;
  });


