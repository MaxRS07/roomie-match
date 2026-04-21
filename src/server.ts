import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setSession, getSession, deleteSession } from '../Redis/sessionCache.ts';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    authenticateUser,
    updateUserProfile,
    getUserPreferences,
    updateUserPreferences,
    getProfilePhoto,
    updateProfilePhoto,
    getListingPhoto,
    getActiveListings,
    getUserListings,
    createUserInterest,
    getInterestsForListing,
    getUserSentInterests,
    getUserChats,
    getChatMessages,
    sendMessage,
    getUnreadMessageCount,
} from './lib/db.server.ts';

const app = express();
app.use(cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// User endpoints
app.get('/api/users', async (req, res) => {
    const result = await getAllUsers();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id', async (req, res) => {
    const result = await getUserById(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/api/users', async (req, res) => {
    const result = await createUser(req.body);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const result = await updateUser(req.params.id, req.body);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const result = await deleteUser(req.params.id);
    if (result.success) {
        res.json({ message: 'User deleted' });
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/api/auth/authenticate', async (req, res) => {
    const { email, password } = req.body ?? {};
    const result = await authenticateUser(email, password);
    if (result.success) {
        await setSession(String(result.data.user_id), result.data);
        res.cookie('sessionId', String(result.data.user_id), {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json(result.data);
    } else {
        res.status(401).json({ error: result.error });
    }
});

app.get('/api/session/me', async (req, res) => {
    const userId = req.cookies?.sessionId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await getSession(userId);
    if (!user) return res.status(401).json({ error: 'Session expired' });
    res.json(user);
});

app.delete('/api/session', async (req, res) => {
    const userId = req.cookies?.sessionId;
    if (userId) await deleteSession(userId);
    res.clearCookie('sessionId');
    res.json({ success: true });
});

app.put('/api/users/:id/profile', async (req, res) => {
    const result = await updateUserProfile(req.params.id, req.body ?? {});
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/preferences', async (req, res) => {
    const result = await getUserPreferences(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.put('/api/users/:id/preferences', async (req, res) => {
    const result = await updateUserPreferences(req.params.id, req.body ?? {});
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/profile-photo', async (req, res) => {
    const data = await getProfilePhoto(req.params.id);
    res.json({ data });
});

app.put('/api/users/:id/profile-photo', async (req, res) => {
    const dataUrl = req.body?.dataUrl;
    const result = await updateProfilePhoto(req.params.id, dataUrl);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/listings/active', async (_req, res) => {
    const result = await getActiveListings();
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/listings', async (req, res) => {
    const result = await getUserListings(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/listings/:id/photo', async (req, res) => {
    const data = await getListingPhoto(req.params.id);
    res.json({ data });
});

app.post('/api/interests', async (req, res) => {
    const { renterId, listingId } = req.body ?? {};
    const result = await createUserInterest(renterId, listingId);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/listings/:id/interests', async (req, res) => {
    const result = await getInterestsForListing(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/interests/sent', async (req, res) => {
    const result = await getUserSentInterests(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/chats', async (req, res) => {
    const result = await getUserChats(req.params.id);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/messages/chat', async (req, res) => {
    const from = String(req.query.from ?? '');
    const to = String(req.query.to ?? '');
    const result = await getChatMessages(from, to);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.post('/api/messages', async (req, res) => {
    const result = await sendMessage(req.body);
    if (result.success) {
        res.json(result.data);
    } else {
        res.status(500).json({ error: result.error });
    }
});

app.get('/api/users/:id/messages/unread-count', async (req, res) => {
    const count = await getUnreadMessageCount(req.params.id);
    res.json({ count });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
