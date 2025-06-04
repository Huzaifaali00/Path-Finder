// src/components/QuoteAddForm.js
import React, { useState } from 'react';

function QuoteAddForm({ onAddQuote, isLoading }) {
    const [quoteText, setQuoteText] = useState('');
    const [author, setAuthor] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!quoteText.trim()) return;
        onAddQuote(quoteText, author);
        setQuoteText('');
        setAuthor('');
    };

    return (
        <form onSubmit={handleSubmit} className="quote-add-form content-box"> {/* Added content-box class */}
            <div className="form-group">
                <label htmlFor="quoteText">Quote:</label>
                <textarea
                    id="quoteText"
                    placeholder="Enter your motivational quote"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    rows="3"
                    disabled={isLoading}
                ></textarea>
            </div>
            <div className="form-group">
                <label htmlFor="quoteAuthor">Author (optional):</label>
                <input
                    type="text"
                    id="quoteAuthor"
                    placeholder="e.g., Lao Tzu"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            <button type="submit" className="action-button" disabled={isLoading}>
                {isLoading ? <span className="spinner"></span> : 'Add Quote'}
            </button>
        </form>
    );
}
export default QuoteAddForm;