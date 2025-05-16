// Toggle chatbot visibility
function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    chatbotContainer.style.display = chatbotContainer.style.display === 'flex' ? 'none' : 'flex';
}

// Chatbot Configuration
const GEMINI_API_KEY = 'AIzaSyCvsCNeVCbhKc1BF-NRG9iuON-xj-ZFQ_s';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Initialize chatbot
function initChatbot() {
    // Create chatbot toggle button if it doesn't exist
    if (!document.getElementById('chatbot-toggle')) {
        const toggleButton = document.createElement('div');
        toggleButton.id = 'chatbot-toggle';
        toggleButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
        toggleButton.onclick = toggleChatbot;
        document.body.appendChild(toggleButton);
    }

    // Create chatbot container if it doesn't exist
    if (!document.getElementById('chatbot-container')) {
        const container = document.createElement('div');
        container.id = 'chatbot-container';
        container.innerHTML = `
            <div id="chatbot-header">
                <span>AI Financial Assistant</span>
                <button onclick="toggleChatbot()" style="background: none; border: none; color: white; cursor: pointer;">×</button>
            </div>
            <div id="chatbot-messages"></div>
            <div id="typing-indicator" style="display: none;">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div id="chatbot-input">
                <input type="text" id="chatbot-input-field" placeholder="Type your message...">
                <button id="chatbot-send">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        `;
        document.body.appendChild(container);
    }

    const chatbotInput = document.getElementById('chatbot-input-field');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const typingIndicator = document.getElementById('typing-indicator');

    // Add initial greeting
    addMessage("Hello! I'm your AI Financial Assistant. How can I help you today?", 'bot');

    // Handle sending messages
    async function sendMessage() {
        const message = chatbotInput.value.trim();
        if (message === '') return;

        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';

        // Show typing indicator
        typingIndicator.style.display = 'block';
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

        try {
            const response = await getGeminiResponse(message);
            typingIndicator.style.display = 'none';
            addMessage(response, 'bot');
        } catch (error) {
            console.error('Error getting response:', error);
            typingIndicator.style.display = 'none';
            addMessage('I apologize, but I encountered an error. Please try again.', 'bot');
        }
    }

    // Get response from Gemini API
    async function getGeminiResponse(message) {
        try {
            // Add financial context to the prompt
            const enhancedPrompt = `You are a financial assistant helping users with Spendr, a personal finance management app. The user asks: ${message}. 
            Focus your response on financial advice, budgeting, investments, or tax planning as appropriate. Keep responses concise and practical.`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: enhancedPrompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract the response text from the Gemini API response
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }

    // Add message to chat
    function addMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Format message text (handle newlines)
        const formattedMessage = message.replace(/\n/g, '<br>');
        
        // Add message content with appropriate styling
        messageDiv.innerHTML = `
            <div class="message-content">${formattedMessage}</div>
            <span class="message-time">${getCurrentTime()}</span>
        `;
        
        // Add to chat
        chatbotMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Get current time for message timestamp
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Event listeners
    chatbotSend.addEventListener('click', sendMessage);
    
    chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add suggestion chips
    const suggestions = [
        'How can I save more money?',
        'Help me create a budget',
        'Investment advice',
        'Tax saving tips'
    ];

    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    suggestions.forEach(suggestion => {
        const chip = document.createElement('button');
        chip.className = 'suggestion-chip';
        chip.textContent = suggestion;
        chip.onclick = () => {
            chatbotInput.value = suggestion;
            sendMessage();
        };
        suggestionsContainer.appendChild(chip);
    });
    chatbotMessages.appendChild(suggestionsContainer);
}

// Add styles for chatbot layout and scrolling
const style = document.createElement('style');
style.textContent = `
    #chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        z-index: 1000;
    }

    #chatbot-header {
        padding: 15px;
        background: #3498db;
        color: white;
        border-radius: 15px 15px 0 0;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    #chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    #chatbot-input {
        padding: 15px;
        border-top: 1px solid #eee;
        background: white;
        border-radius: 0 0 15px 15px;
        display: flex;
        gap: 10px;
    }

    #chatbot-input-field {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
    }

    #chatbot-send {
        background: #3498db;
        color: white;
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;
    }

    #chatbot-send:hover {
        background: #2980b9;
    }

    .suggestions-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 10px 0;
        padding: 10px;
    }

    .suggestion-chip {
        background-color: #e8f0fe;
        border: none;
        border-radius: 15px;
        padding: 8px 15px;
        font-size: 14px;
        color: #3498db;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .suggestion-chip:hover {
        background-color: #d0e3fa;
    }

    .message {
        max-width: 80%;
        margin: 10px;
        padding: 12px 15px;
        border-radius: 15px;
        position: relative;
        word-wrap: break-word;
    }

    .user-message {
        background-color: #3498db;
        color: white;
        margin-left: auto;
        border-radius: 15px 15px 0 15px;
    }

    .bot-message {
        background-color: #f0f2f5;
        color: #2c3e50;
        margin-right: auto;
        border-radius: 15px 15px 15px 0;
    }

    .message-time {
        font-size: 12px;
        color: #999;
        margin-top: 5px;
        display: block;
    }

    #typing-indicator {
        display: flex;
        gap: 5px;
        padding: 10px 15px;
        background: #f0f2f5;
        border-radius: 15px;
        margin: 10px;
        width: fit-content;
    }

    #typing-indicator span {
        width: 8px;
        height: 8px;
        background: #3498db;
        border-radius: 50%;
        animation: bounce 1.3s linear infinite;
    }

    #typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
    #typing-indicator span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
    }

    #chatbot-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: #3498db;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 999;
    }

    #chatbot-toggle:hover {
        background: #2980b9;
    }
`;

document.head.appendChild(style);

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', initChatbot); 