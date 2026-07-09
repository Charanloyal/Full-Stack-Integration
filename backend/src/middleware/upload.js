import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  // Create .gitkeep so git tracks the folder structure but ignores files due to root .gitignore
  fs.writeFileSync(path.join(uploadDir, '.gitkeep'), '');
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize the original file name to prevent security vulnerabilities or weird characters
    const cleanOriginalName = file.originalname
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/\s+/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${cleanOriginalName}`);
  },
});

// File filter (limits what files can be uploaded)
const fileFilter = (req, file, cb) => {
  // 1. Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-zip',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  ];

  // 2. Allowed extensions (case-insensitive)
  const allowedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.txt', '.json',
    '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
    '.c', '.cpp', '.h', '.hpp', '.java', '.py', '.js', '.jsx', '.ts', '.tsx', '.go', '.rs', '.cs', '.html', '.css', '.sh', '.sql'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const isAllowedMime = allowedMimeTypes.includes(file.mimetype);
  const isAllowedExt = allowedExtensions.includes(ext);

  // Also allow any MIME type starting with text/ (like text/x-c++src, text/x-python, etc.)
  const isTextMime = file.mimetype && file.mimetype.startsWith('text/');

  if (isAllowedMime || isAllowedExt || isTextMime) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed files: images, PDFs, DOC/DOCX, text files, source code files, and archives (ZIP/TAR).'), false);
  }
};

// Multer Upload Instances
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter,
}).single('avatar');

export const uploadAttachment = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
}).single('attachment');
