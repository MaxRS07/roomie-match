import express from 'express';
import cors from 'cors';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from './lib/db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
