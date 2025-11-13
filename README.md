# Dossier - Chrome Extension

A modern Chrome extension that opens as a side panel with an AI-powered QA chat interface. Ask questions and get intelligent responses right from your browser.

## Features

- 🧙‍♂️ **Modern Chat Interface**: Clean, responsive design with smooth animations
- 📱 **Side Panel Integration**: Opens as a Chrome side panel for easy access
- 💬 **Real-time Chat**: Type and send messages with Enter key or click
- 🗑️ **Chat History Management**: Clear chat history with one click
- 💾 **Persistent Storage**: Chat history is saved locally
- ⌨️ **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- 📊 **Character Counter**: Visual feedback for message length
- 🎨 **Beautiful UI**: Gradient design with modern styling

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** and select the `mage` folder
5. **Pin the Extension** by clicking the puzzle piece icon in Chrome toolbar and pinning Mage

### Method 2: Install from Chrome Web Store (Future)

*This extension will be published to the Chrome Web Store in the future for easy installation.*

## Usage

1. **Click the Mage icon** in your Chrome toolbar
2. **The side panel will open** on the right side of your browser
3. **Type your question** in the input field at the bottom
4. **Press Enter** or click the send button to send your message
5. **View responses** from the AI assistant
6. **Clear chat** anytime using the trash icon in the header

## Project Structure

```
mage/
├── manifest.json          # Extension configuration
├── sidepanel.html         # Main chat interface
├── styles.css            # Modern styling and animations
├── chat.js               # Chat functionality and logic
├── background.js         # Service worker for extension management
├── icons/                # Extension icons (16px, 32px, 48px, 128px)
└── README.md             # This file
```

## Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of HTML, CSS, and JavaScript

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mage
   ```

2. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `mage` folder

### Customization

#### Adding AI Integration

The current implementation includes a simulated AI response. To integrate with a real AI service:

1. **Open `chat.js`**
2. **Find the `getAIResponse()` method**
3. **Replace the simulation with your AI API call**:

```javascript
async getAIResponse(userMessage) {
    try {
        const response = await fetch('YOUR_AI_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY'
            },
            body: JSON.stringify({
                message: userMessage,
                // Add other required parameters
            })
        });
        
        const data = await response.json();
        return data.response; // Adjust based on your API response structure
    } catch (error) {
        console.error('AI API Error:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
}
```

#### Styling Customization

- **Colors**: Modify the CSS variables in `styles.css`
- **Layout**: Adjust the flexbox properties for different layouts
- **Animations**: Customize the keyframe animations

#### Adding Features

- **File Upload**: Add file input to the chat interface
- **Voice Input**: Integrate Web Speech API
- **Export Chat**: Add functionality to export chat history
- **Themes**: Implement dark/light mode toggle

## API Integration Examples

### OpenAI GPT Integration

```javascript
async getAIResponse(userMessage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 150
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

### Anthropic Claude Integration

```javascript
async getAIResponse(userMessage) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'YOUR_ANTHROPIC_API_KEY'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [
                { role: 'user', content: userMessage }
            ]
        })
    });
    
    const data = await response.json();
    return data.content[0].text;
}
```

## Browser Compatibility

- **Chrome**: 88+ (Manifest V3 support required)
- **Edge**: 88+ (Chromium-based)
- **Other Chromium browsers**: Should work with Manifest V3 support

## Permissions

This extension requires the following permissions:

- `sidePanel`: To open the chat interface in a side panel
- `activeTab`: To interact with the current tab (for future features)

## Privacy

- **No data collection**: The extension doesn't collect any personal data
- **Local storage only**: Chat history is stored locally in your browser
- **No tracking**: No analytics or tracking scripts included

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/mage/issues) page
2. Create a new issue with detailed information
3. Include browser version and error messages

## Changelog

### Version 1.0.0
- Initial release
- Side panel integration
- Modern chat interface
- Local storage for chat history
- Simulated AI responses
- Responsive design

## Future Roadmap

- [ ] Real AI API integration
- [ ] Voice input support
- [ ] File upload capability
- [ ] Dark/light theme toggle
- [ ] Chat export functionality
- [ ] Multiple conversation threads
- [ ] Custom AI model selection
- [ ] Keyboard shortcuts
- [ ] Context menu integration
- [ ] Cross-device sync

---

Made with ❤️ for the Chrome extension community
