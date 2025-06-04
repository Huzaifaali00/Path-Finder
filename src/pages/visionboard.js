// src/pages/VisionBoardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploadForm from '../components/ImageUploadForm'; // Ensure this path is correct
import QuoteAddForm from '../components/QuoteAddForm';     // Ensure this path is correct

const API_URL = 'http://localhost:5000/api';

// Modal component for maximizing image
function ImageModal({ src, alt, onClose }) {
  // **DEBUG LOG 1: Check if Modal receives src**
  console.log("ImageModal - received src:", src);
  if (!src) return null;

  // Construct full URL if src is relative (from backend uploads)
  const fullSrc = src.startsWith('/uploads/') ? `http://localhost:5000${src}` : src;
  // **DEBUG LOG 2: Check the fullSrc for the image tag**
  console.log("ImageModal - rendering with fullSrc:", fullSrc);

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={fullSrc} alt={alt || 'Maximized vision item'} />
        <button onClick={onClose} className="close-modal-button">×</button>
      </div>
    </div>
  );
}

function VisionBoardPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(null);
  const [maximizedImage, setMaximizedImage] = useState(null);

  const getAuthHeaders = () => { // Helper for auth token
    const token = localStorage.getItem('authToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchVisionBoardItems = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/visionboard`, getAuthHeaders());
      setItems(response.data || []);
    } catch (err) {
      setError('Failed to load vision board items. Please ensure you are logged in or try again.');
      console.error('Fetch vision board error:', err.response?.data?.message || err.message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisionBoardItems();
  }, [fetchVisionBoardItems]);

  const handleImageUpload = async (file, description) => {
    setIsSubmitting(true);
    setError('');
    const formData = new FormData();
    formData.append('imageFile', file);
    formData.append('description', description);

    try {
      const response = await axios.post(`${API_URL}/visionboard/image`, formData, {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      });
      setItems((prevItems) => [response.data.item, ...prevItems]);
      setShowForm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed. Please try again.');
      console.error('Image upload error:', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddQuote = async (text, author) => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await axios.post(
        `${API_URL}/visionboard/quote`,
        { text, author },
        getAuthHeaders()
      );
      setItems((prevItems) => [response.data.item, ...prevItems]);
      setShowForm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add quote. Please try again.');
      console.error('Add quote error:', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const originalItems = [...items];
    setItems(prevItems => prevItems.filter(item => item._id !== itemId)); // Optimistic delete

    try {
      await axios.delete(`${API_URL}/visionboard/${itemId}`, getAuthHeaders());
      toast.success('Vision board item removed!'); // Success toast
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item.'); // Keep error state
      toast.error('Failed to delete item. Reverting.'); // Error toast
      console.error('Delete item error:', err.response?.data?.message || err.message);
      setItems(originalItems); // Revert on error
    }
  };

  // **DEBUG LOG 3: Check the value of maximizedImage state before rendering modal**
  console.log("VisionBoardPage - current maximizedImage state:", maximizedImage);

  if (isLoading && items.length === 0) {
    return (
      <div className="loading-container">
        <span className="page-spinner"></span>
        <p>Loading your Vision Board...</p>
      </div>
    );
  }

  return (
    <div className="vision-board-page feature-page-container">
      <header className="feature-header">
        <h2>My Vision Board</h2>
        <p>Craft your future. Pin your dreams, quotes, and aspirations to manifest them.</p>
      </header>

      {/* Error message can be here or below forms */}
      {error && <p className="message error-message form-error-message">{error}</p>}

      {/* The Vision Board itself - MOVED UP */}
      <div className="vision-board-wall">
        {!isLoading && items.length === 0 && !showForm && (
          <div className="empty-state content-box"> {/* content-box might need different styling on this new board */}
            <h3>Your Vision Board Awaits!</h3>
            <p>This is your canvas. Click "+ Add Image" or "+ Add Quote" below to start visualizing.</p>
          </div>
        )}
        {items.map((item) => (
          <div
            key={item._id}
            className={`vision-board-item ${item.type}-item`} // Keep 'content-box' if items still need that base
            style={{
              transform: `rotate(${(Math.random() * 5 - 2.5).toFixed(1)}deg)`
            }}
            onClick={() => item.type === 'image' && item.url && setMaximizedImage(item.url)}
          >
            <div className="pin"></div>
            {item.type === 'image' && item.url && (
              <img
                src={item.url.startsWith('/') ? `http://localhost:5000${item.url}` : item.url}
                alt={item.description || 'Vision board image'}
              />
            )}
            {item.type === 'quote' && (
              <div className="quote-content-vb">
                <p className="quote-text-vb">"{item.text}"</p>
                {item.author && <p className="quote-author-vb">- {item.author}</p>}
              </div>
            )}
            {item.description && item.type === 'image' && (
              <p className="image-item-description">{item.description}</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(item._id);
              }}
              className="delete-button item-delete-button vision-item-delete"
              aria-label="Delete item"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add Item Controls Container - MOVED DOWN */}
      <div className="add-item-controls-container">
        <div className="add-item-controls">
          <button
            onClick={() => setShowForm(showForm === 'image' ? null : 'image')}
            className={`action-button toggle-form ${showForm === 'image' ? 'active' : ''}`}
            disabled={isSubmitting}
          >
            {showForm === 'image' ? 'Cancel Image' : '+ Add Image'}
          </button>
          <button
            onClick={() => setShowForm(showForm === 'quote' ? null : 'quote')}
            className={`action-button toggle-form ${showForm === 'quote' ? 'active' : ''}`}
            disabled={isSubmitting}
          >
            {showForm === 'quote' ? 'Cancel Quote' : '+ Add Quote'}
          </button>
        </div>
      </div>

      {/* Forms will appear here if toggled */}
      {showForm === 'image' && <ImageUploadForm onImageUpload={handleImageUpload} isLoading={isSubmitting} />}
      {showForm === 'quote' && <QuoteAddForm onAddQuote={handleAddQuote} isLoading={isSubmitting} />}

      <ImageModal
        src={maximizedImage}
        alt="Maximized vision board item"
        onClose={() => setMaximizedImage(null)}
      />
    </div>
  );
}

export default VisionBoardPage;