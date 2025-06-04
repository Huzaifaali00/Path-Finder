// src/components/ImageUploadForm.js
import React, { useState, useRef } from 'react';

function ImageUploadForm({ onImageUpload, isLoading }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);


    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreview(null);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedFile) {
            alert('Please select an image to upload.');
            return;
        }
        onImageUpload(selectedFile, description);
        setSelectedFile(null);
        setPreview(null);
        setDescription('');
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    return (
        <form onSubmit={handleSubmit} className="image-upload-form content-box"> {/* Added content-box class */}
            <div className="form-group">
                <label htmlFor="imageFile">Choose Image:</label>
                <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    ref={fileInputRef}
                />
                {preview && <img src={preview} alt="Preview" className="image-preview" />}
            </div>
            <div className="form-group">
                <label htmlFor="imageDescription">Description (optional):</label>
                <input
                    type="text"
                    id="imageDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., My dream destination"
                    disabled={isLoading}
                />
            </div>
            <button type="submit" className="action-button" disabled={isLoading}>
                {isLoading ? <span className="spinner"></span> : 'Upload Image'}
            </button>
        </form>
    );
}
export default ImageUploadForm;