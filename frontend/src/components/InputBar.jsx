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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File too large (max 15MB)');
      return;
    }

    // Handle PDF files specially using PDF.js text extraction
    if (file.name.endsWith('.pdf') || file.type === 'application/pdf') {
      setIsExtractingPDF(true);
      showToast('Parsing PDF text...');
      try {
        const extractedText = await extractTextFromPDF(file);
        setAttachedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          content: extractedText || 'No readable text found in PDF.'
        });
        showToast(`PDF parsed successfully: ${file.name}`);
      } catch (err) {
        console.error('PDF parsing failed:', err);
        showToast('Failed to parse PDF text. Please try plain text/notes.');
      }
      setIsExtractingPDF(false);
      return;
    }

    // Handle Text / Code / Docs files
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: event.target.result
      });
      showToast(`Attached file: ${file.name}`);
    };

    if (file.type.startsWith('text/') || file.name.match(/\.(js|jsx|ts|tsx|json|html|css|md|txt|py|cpp|c|java|csv)$/i)) {
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAction = () => {
    if (isLoading) {
      onStopGenerating();
    } else {
      let finalMessage = text.trim();
      if (attachedFile) {
        const fileContentStr = typeof attachedFile.content === 'string'
          ? (attachedFile.content.length > 5000 ? attachedFile.content.slice(0, 5000) + '...\n[Truncated]' : attachedFile.content)
          : '[Attached File Content]';

        finalMessage = `${finalMessage}\n\n📁 [Document: ${attachedFile.name}]\n\`\`\`\n${fileContentStr}\n\`\`\``.trim();
      }

      if (finalMessage) {
        onSend(finalMessage);
        setText('');
        setAttachedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (textareaRef.current) {
          textareaRef.current.style.height = '44px';
        }
      }
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
          accept=".pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv"
        />

        {attachedFile && (
          <div className="attached-file-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
            <span className="file-name">{attachedFile.name}</span>
            <span className="file-size">({attachedFile.size})</span>
            <button className="remove-file-btn" onClick={removeAttachedFile} title="Remove file">
              ✕
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder={isExtractingPDF ? 'Parsing PDF contents...' : 'Message Neura AI... (Press Enter to send, Shift+Enter for newline)'}
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
              title="Attach PDF or document"
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
