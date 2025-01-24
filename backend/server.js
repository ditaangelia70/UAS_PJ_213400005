require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Only declare once at the top
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Koneksi ke database MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dita_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Middleware untuk memverifikasi token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(403).json({ message: 'Token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.userId = decoded.id;
    next();
  });
};

// Fungsi untuk hashing password
const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed Password:', hashedPassword);
};

hashPassword('dita123'); // Ganti 'password123' dengan password asli.

// Route untuk hashing password manual (hanya untuk testing/admin)
app.post('/hash', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    res.json({ hashedPassword });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route untuk Register Pengguna
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, hashedPassword], (err) => {
      if (err) {
        console.error('Error registering user:', err);
        return res.status(500).json({ message: 'Error registering user' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route untuk Login Pengguna
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Error logging in:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ message: 'Login successful', token });
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
});

// Route untuk mengambil data makeup (memerlukan token)
app.get('/makeup', verifyToken, (req, res) => {
  const query = 'SELECT * FROM makeup';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).json({ message: 'Error fetching data' });
    }

    res.json({
      message: 'Berhasil mendapat data',
      data: results,
    });
  });
});

// Route untuk menambahkan makeup (memerlukan token)
app.post('/makeup', verifyToken, (req, res) => {
  const { jenisMakeup, merkMakeup, expired } = req.body;
  if (!jenisMakeup || !merkMakeup || !expired) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const query = 'INSERT INTO makeup (jenisMakeup, merkMakeup, expired) VALUES (?, ?, ?)';
  db.query(query, [jenisMakeup, merkMakeup, expired], (err) => {
    if (err) {
      console.error('Error inserting makeup data:', err);
      return res.status(500).json({ message: 'Error inserting data' });
    }
    res.status(201).json({ message: 'Data added successfully' });
  });
});

// Route untuk menghapus data makeup (memerlukan token)
app.delete('/makeup/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM makeup WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error('Error deleting makeup data:', err);
      return res.status(500).json({ message: 'Error deleting data' });
    }
    res.json({ message: 'Data deleted successfully' });
  });
});

// Membuat HTTP server dan WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  ws.send('Welcome to the WebSocket server!');

  ws.on('message', (message) => {
    console.log(`Received from client: ${message}`);
    ws.send(`You said: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Menjalankan server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
