import { useRef, useState } from 'react';
import { FiUploadCloud, FiX, FiLoader } from 'react-icons/fi';
import { uploadImageToCloudinary, validateImageFile } from '../utils/uploadImage';

export default function ImageUploadInput({
  value = '',
  onChange,
  disabled = false,
  onUploadingChange,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const setUploadState = (state) => {
    setUploading(state);
    onUploadingChange?.(state);
  };

  const handleFile = async (file) => {
    if (!file || disabled) return;

    setError('');
    try {
      validateImageFile(file);
    } catch (err) {
      setError(err.message);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setFileName(file.name);
    setUploadState(true);

    try {
      const url = await uploadImageToCloudinary(file);
      onChange?.(url);
      setPreviewUrl(url);
    } catch (err) {
      setError(err.message || 'Image upload failed. Please try again.');
      setPreviewUrl('');
      setFileName('');
      onChange?.('');
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploadState(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setFileName('');
    setError('');
    onChange?.('');
  };

  const handleRetry = () => {
    setError('');
    inputRef.current?.click();
  };

  const displayUrl = previewUrl || value;
  const hasImage = Boolean(displayUrl);

  if (error) {
    return (
      <div className="border border-dashed border-red-200 rounded-xl bg-red-50 p-6 text-center">
        <p className="text-red-500 text-xs mb-3">⚠ {error}</p>
        <button
          type="button"
          onClick={handleRetry}
          disabled={disabled}
          className="text-sm text-slate-700 underline hover:text-slate-900"
        >
          Try again
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center">
        <FiLoader className="w-6 h-6 text-slate-600 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">Uploading image...</p>
        {displayUrl && (
          <img
            src={displayUrl}
            alt="Upload preview"
            className="w-20 h-20 object-cover rounded-lg mx-auto mt-3 opacity-70"
          />
        )}
        <div className="w-full h-0.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-slate-700 animate-pulse w-2/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (hasImage) {
    return (
      <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 flex items-center gap-3">
        <img
          src={displayUrl}
          alt={fileName || 'Sheet image'}
          className="w-20 h-20 object-cover rounded-lg shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 truncate">{fileName || 'Image uploaded'}</p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="text-red-500 text-xs font-medium hover:text-red-600 shrink-0"
        >
          <FiX className="w-4 h-4 inline mr-0.5" />
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full border border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiUploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700">Upload Sheet Image</p>
        <p className="text-xs text-gray-500 mt-1">Click to browse or drag & drop</p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP • Max 5MB</p>
        <p className="text-xs text-gray-400 mt-0.5">(Optional)</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled || uploading}
      />
    </div>
  );
}
