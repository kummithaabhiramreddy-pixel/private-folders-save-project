const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const connectionString = "postgresql://neondb_owner:npg_njLO3IsN6bRC@ep-square-smoke-aq66lkub-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString: connectionString });

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_files (
                id VARCHAR(255) PRIMARY KEY,
                user_email VARCHAR(255),
                name TEXT,
                size BIGINT,
                type VARCHAR(255),
                category VARCHAR(255),
                upload_date VARCHAR(255),
                data_url TEXT,
                folder TEXT
            )
        `);
    } catch (err) {
        console.error("DB Init Error:", err);
    }
}
initDB();

app.get(['/api/files', '/files', '/'], async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
        const result = await pool.query('SELECT * FROM user_files WHERE user_email = $1 ORDER BY upload_date DESC', [email]);
        const files = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            size: parseInt(row.size),
            type: row.type,
            category: row.category,
            date: row.upload_date,
            dataUrl: row.data_url,
            folder: row.folder
        }));
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post(['/api/files', '/files', '/'], async (req, res) => {
    const { email, file } = req.body;
    if (!email || !file) return res.status(400).json({ error: 'Missing data' });
    try {
        await pool.query(
            'INSERT INTO user_files (id, user_email, name, size, type, category, upload_date, data_url, folder) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [file.id, email, file.name, file.size, file.type, file.category, file.date, file.dataUrl, file.folder]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete(['/api/files/:id', '/files/:id', '/:id'], async (req, res) => {
    const id = req.params.id;
    try {
        await pool.query('DELETE FROM user_files WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
