import React, { useState, useRef, useEffect } from 'react';
import './InputBar.css';

function InputBar({ onSend, isLoading, onStopGenerating, initialText = '', showToast }) {
  const [text, setText] = useState(initialText);
  const [attachedFile, setAttachedFile] = useState(null);
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      textareaRef.current?.focus();
    }
  }, [initialText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [text]);

  // Load PDF.js dynamically and extract readable text from PDF pages
  const extractTextFromPDF = async (file) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map(item => item.str);
      fullText += `[Page ${i}]\n` + pageStrings.join(' ') + '\n\n';
    }

    return fullText.trim();
  };

  const readMediaFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      if (!base64) return reject(new Error('The media file could not be read.'));
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('The media file could not be read.'));
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('File too large (max 10MB)');
      return;
    }

    const isPDF = file.name.endsWith('.pdf') || file.type === 'application/pdf';

    if (isPDF) {
      setIsExtractingPDF(true);
      showToast('Parsing PDF text...');
      try {
        const extractedText = await extractTextFromPDF(file);
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: 'pdf',
          content: extractedText || 'No readable text found in PDF.'
        });
        showToast(`PDF ready: ${file.name}`);
      } catch (err) {
        console.error('PDF parsing failed:', err);
        showToast('Failed to parse PDF. Try a different file.');
      }
      setIsExtractingPDF(false);
      return;
    }

    const isMedia = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/');
    if (isMedia) {
      try {
        setIsExtractingPDF(true);
        const data = await readMediaFile(file);
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'video',
          mimeType: file.type,
          data,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        });
        showToast(`Attached: ${file.name}`);
      } catch (err) {
        console.error('Media attachment failed:', err);
        showToast('Failed to read this media file.');
      } finally {
        setIsExtractingPDF(false);
      }
      return;
    }

    // Handle Text / Code / Docs files
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: 'text',
        content: event.target.result
      });
      showToast(`Attached: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const removeAttachedFile = () => {
    if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAction = () => {
    if (isLoading) {
      onStopGenerating();
    } else {
      const userText = text.trim();

      if (!userText && !attachedFile) return;

      // Build the raw message string sent to the AI (not shown in UI)
      let aiMessage = userText;
      if (attachedFile) {
        const fileContentStr = typeof attachedFile.content === 'string'
          ? (attachedFile.content.length > 5000 ? attachedFile.content.slice(0, 5000) + '\n[Truncated]' : attachedFile.content)
          : '[Attached File Content]';

        aiMessage = `${userText}\n\n📁 [Document: ${attachedFile.name}]\n\`\`\`\n${fileContentStr}\n\`\`\``.trim();
      }

      if (attachedFile && ['image', 'audio', 'video'].includes(attachedFile.type)) {
        aiMessage = userText || `Please analyze the attached ${attachedFile.type}.`;
      }

      // Send to parent: the AI message text + file metadata for display
      const attachmentPayload = attachedFile?.data
        ? [{ mimeType: attachedFile.mimeType, data: attachedFile.data }]
        : [];
      onSend(aiMessage, attachedFile ? { name: attachedFile.name, size: attachedFile.size, type: attachedFile.type } : null, userText, attachmentPayload);

      setText('');
      if (attachedFile?.previewUrl) URL.revokeObjectURL(attachedFile.previewUrl);
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (textareaRef.current) textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAction();
    }
  };

  const canSubmit = (text.trim().length > 0 || attachedFile !== null) && !isLoading && !isExtractingPDF;

  return (
    <div className="composer-container">
      <div className="composer-box">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,audio/*,video/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv"
        />

        {attachedFile && (
          <div className="attached-file-chip">
            {attachedFile.type === 'image' && attachedFile.previewUrl ? (
              <img src={attachedFile.previewUrl} alt="Attachment preview" className="file-image-preview" />
            ) : attachedFile.type === 'pdf' ? (
              <div className="file-chip-icon pdf-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#ef4444" stroke="#ef4444" strokeWidth="0"/>
                  <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.5" fill="none"/>
                  <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="1.5"/>
                  <line x1="8" y1="17" x2="16" y2="17" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
            ) : (
              <div className="file-chip-icon txt-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#6366f1" stroke="#6366f1" strokeWidth="0"/>
                  <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
            )}
            <div className="file-chip-info">
              <span className="file-name">{attachedFile.name}</span>
              <span className="file-size">{attachedFile.type === 'pdf' ? 'PDF' : attachedFile.type === 'text' ? 'File' : attachedFile.type[0].toUpperCase() + attachedFile.type.slice(1)} · {attachedFile.size}</span>
            </div>
            <button className="remove-file-btn" onClick={removeAttachedFile} title="Remove file">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={isExtractingPDF ? 'Parsing PDF contents...' : 'Message Neura AI... (Enter to send, Shift+Enter for newline)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading || isExtractingPDF}
        />

        <div className="composer-bottom-bar">
          <div className="composer-tools-left">
            <button
              className="composer-tool-btn"
              title="Attach media, PDF, or document"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isExtractingPDF}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>

            <button
              className="composer-tool-btn"
              title="Voice Input"
              onClick={() => showToast('Voice transcription active... (Listening)')}
              disabled={isLoading || isExtractingPDF}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </button>
          </div>

          <div className="composer-tools-right">
            {isLoading ? (
              <button
                className="send-btn stop-mode active"
                onClick={handleAction}
                title="Stop generating"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>
                </svg>
              </button>
            ) : (
              <button
                className={`send-btn ${canSubmit ? 'active' : ''}`}
                onClick={handleAction}
                disabled={!canSubmit}
                title="Send message (Enter)"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="composer-disclaimer">
        Neura AI can make mistakes. Verify important information.
      </div>
    </div>
  );
}

export default InputBar;
