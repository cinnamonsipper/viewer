import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads folder exists with absolute path
const uploadsDir = path.resolve(__dirname, 'uploads');
console.log('Server startup - Current working directory:', process.cwd());
console.log('Server startup - __dirname:', __dirname);
console.log('Server startup - Uploads directory:', uploadsDir);

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory successfully');
    // Verify directory was created
    const stats = fs.statSync(uploadsDir);
    console.log('Uploads directory stats:', {
      isDirectory: stats.isDirectory(),
      permissions: stats.mode,
      owner: stats.uid
    });
  } catch (error) {
    console.error('Failed to create uploads directory:', error);
    process.exit(1); // Exit if we can't create the directory
  }
}

const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'], // Allow all Vite ports
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer destination called:', {
      uploadsDir,
      file: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    console.log('Multer filename called:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    // Sanitize filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, sanitizedName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, true);
  }
});

// Simple upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  console.log('Upload request received:', {
    headers: req.headers,
    fileDetails: req.file || 'No file received'
  });
  
  try {
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const savedFilePath = path.resolve(uploadsDir, req.file.filename);
    
    // Verify file was actually saved
    if (!fs.existsSync(savedFilePath)) {
      console.error('File not saved to disk:', savedFilePath);
      return res.status(500).json({ error: 'File not saved to disk' });
    }
    
    console.log('File saved successfully:', {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      path: savedFilePath,
      size: req.file.size
    });
    
    res.json({ 
      success: true, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: savedFilePath,
      size: req.file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// List files in uploads folder
app.get('/uploads-list', (req, res) => {
  console.log('Uploads list request received');
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log('Uploads directory does not exist');
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(uploadsDir);
    console.log('Files in uploads:', files);
    res.json({ files });
  } catch (error) {
    console.error('Error listing uploads:', error);
    res.status(500).json({ error: 'Failed to list files: ' + error.message });
  }
});

// Serve files from uploads folder
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  console.log('File request received:', {
    requestedFile: req.params.filename,
    fullPath: filePath
  });
  
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.sendFile(filePath);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads folder: ${uploadsDir}`);
  // List any existing files
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log('Existing files in uploads:', files);
  }
});