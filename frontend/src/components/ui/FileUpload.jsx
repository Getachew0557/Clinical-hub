import React, { useState, useCallback } from 'react';
import { Box, Typography, LinearProgress, IconButton } from '@mui/material';
import { Upload, X, FileImage, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const FileUpload = ({
  onFileSelect,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 1,
  multiple = false,
  preview = true,
  className = '',
}) => {
  const { error: toastError } = useToast();
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // Validate file
  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      toastError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return false;
    }

    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map((type) => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()}`;

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        if (type.includes('/*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType);
        }
        return fileType === type;
      });

      if (!isValidType) {
        toastError(`File type not accepted. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  };

  // Handle file selection
  const handleFiles = useCallback(
    (newFiles) => {
      const validFiles = [];

      for (const file of newFiles) {
        if (validateFile(file)) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // Limit number of files
      const remainingSlots = maxFiles - files.length;
      const filesToAdd = multiple
        ? validFiles.slice(0, remainingSlots)
        : validFiles.slice(0, 1);

      if (filesToAdd.length < validFiles.length && !multiple) {
        toastError('Only one file is allowed');
      }

      if (filesToAdd.length < validFiles.length && multiple && remainingSlots <= 0) {
        toastError(`Maximum ${maxFiles} files allowed`);
      }

      const updatedFiles = multiple ? [...files, ...filesToAdd] : filesToAdd;
      setFiles(updatedFiles);
      onFileSelect(multiple ? updatedFiles : filesToAdd[0]);
    },
    [files, maxFiles, multiple, onFileSelect, validateFile, toastError]
  );

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  // Handle file input change
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Remove file
  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFileSelect(multiple ? updatedFiles : updatedFiles[0] || null);
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <FileImage size={24} className="text-teal-600" />;
    }
    return <FileText size={24} className="text-slate-600" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box className={className}>
      {/* Upload Area */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        sx={{
          border: `2px dashed ${dragActive ? '#0d9488' : '#e2e8f0'}`,
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: dragActive ? '#f0fdfa' : '#f8fafc',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: '#0d9488',
            bgcolor: '#f0fdfa',
          },
        }}
      >
        <Upload size={48} className={dragActive ? 'text-teal-600' : 'text-slate-400'} />
        <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
          {dragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
          Max size: {maxSize / 1024 / 1024}MB • Accepted: {accept}
        </Typography>
        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />
      </Box>

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
              }}
            >
              {/* Preview */}
              {preview && file.type.startsWith('image/') && (
                <Box
                  component="img"
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  sx={{
                    width: 48,
                    height: 48,
                    objectFit: 'cover',
                    borderRadius: 1,
                  }}
                />
              )}

              {/* File Info */}
              {!preview || !file.type.startsWith('image/') ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, bgcolor: '#f1f5f9', borderRadius: 1 }}>
                  {getFileIcon(file)}
                </Box>
              ) : null}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" className="fw-600" noWrap>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(file.size)}
                </Typography>
              </Box>

              {/* Progress */}
              {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                <Box sx={{ width: 100, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress[index]}
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                </Box>
              )}

              {/* Remove Button */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                sx={{ color: '#dc2626' }}
              >
                <X size={18} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
