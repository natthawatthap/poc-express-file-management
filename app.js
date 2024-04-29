const express = require('express');
const multer  = require('multer');
const SftpClient = require('ssh2-sftp-client');

const app = express();
const PORT = 3000;

// Configuration
const sftpConfig = {
  host: '192.168.130.50',
  port: 22,
  username: 'varuna-root',
  password: 'Gasd234tSggASf2rgafw3512@'
};

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Upload function
async function uploadFile(file, remoteDirectory) {
    const sftp = new SftpClient();
  
    try {
      await sftp.connect(sftpConfig);
      const remoteFilePath = `${remoteDirectory}/${file.originalname}`;
      await sftp.put(file.buffer, remoteFilePath);
      console.log(`File uploaded successfully: ${file.originalname} -> ${remoteFilePath}`);
      return true;
    } catch (err) {
      console.error(`Error uploading file: ${err.message}`);
      return false;
    } finally {
      sftp.end();
    }
  }
  
// List files function
async function listFiles(remotePath) {
  const sftp = new SftpClient();

  try {
    await sftp.connect(sftpConfig);
    const files = await sftp.list(remotePath);
    console.log('Files listed successfully:', files);
    return files;
  } catch (err) {
    console.error(`Error listing files: ${err.message}`);
    return [];
  } finally {
    sftp.end();
  }
}

// Route for uploading files
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const remoteFilePath = req.body.remoteFilePath;
  
      if (!file || !remoteFilePath) {
        return res.status(400).json({ error: 'Missing file or remoteFilePath' });
      }
  
      const result = await uploadFile(file, remoteFilePath);
      if (result) {
        return res.status(200).json({ message: 'File uploaded successfully' });
      } else {
        return res.status(500).json({ error: 'Failed to upload file' });
      }
    } catch (err) {
      console.error(`Error uploading file: ${err.message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

// Route for listing files
app.get('/list', async (req, res) => {
  const remotePath = req.query.path || '/'; // Default path is root directory

  try {
    const files = await listFiles(remotePath);
    return res.status(200).json(files);
  } catch (err) {
    console.error(`Error listing files: ${err.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
