// server.js - Hamara Main Engine

const express = require('express');
const path = require('path'); 
const multer = require('multer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express(); 
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;

// Supabase setup
const supabase = createClient(
    'https://jrwqjtmmhzanpawcydde.supabase.co',
    'sb_secret_Q8zlTZcq6Kt-f2f4-bPeiQ_ZvVWJMxP'
);

app.use(express.static(__dirname));
app.use('/public', express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/student_dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'student_dashboard.html'));
});

app.get('/views/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile', 'index.html'));
});

// Upload Route
app.post('/api/upload-to-drive', upload.single('noteFile'), async (req, res) => {
    console.log('REQ FILE:', req.file);

    if (!req.file) {
        return res.status(400).json({ success: false, error: "File nahi mili!" });
    }

    try {
        // File read karo
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileName = `${Date.now()}_${req.file.originalname}`;

        // Supabase Storage mein upload karo
        const { data, error } = await supabase.storage
            .from('noteverse')
            .upload(fileName, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ success: false, error: error.message });
        }

        // Public URL banao
        const { data: urlData } = supabase.storage
            .from('noteverse')
            .getPublicUrl(fileName);

        // Temp file delete karo
        fs.unlinkSync(req.file.path);

        console.log('Upload Success! URL:', urlData.publicUrl);
        res.json({ success: true, fileUrl: urlData.publicUrl });

    } catch (error) {
        console.error("Upload Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`NoteVerse Server Start`);
    console.log(` link: http://localhost:${PORT}`);
});