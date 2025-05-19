# Real-Time Collaborative Code Editor

A powerful real-time collaborative code editor that supports multi-user editing and live code execution. Built with modern web technologies to provide a seamless coding experience.
![Screenshot 2025-05-18 225728](https://github.com/user-attachments/assets/7c9ee0ee-92ca-431c-ace6-d7a517ed08f2)


## Technology Stack

### Frontend
- **React.js** (v19.1.0) - Frontend framework for building the user interface
- **Socket.IO Client** (v4.7.2) - Real-time bidirectional communication
- **Monaco Editor** (v4.6.0) - The code editor that powers VS Code
- **React-Toastify** - For displaying notifications
- **CSS3** - Modern styling with CSS variables and flexbox

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **Python** - For executing Python code
- **Node.js VM** - For executing JavaScript code in a sandboxed environment

## Features

- Real-time collaborative code editing
- Support for JavaScript and Python
- Live code execution
- Room-based collaboration
- Modern and intuitive UI
- Syntax highlighting
- Error handling and output display
- Real-time user presence
- Code execution status indicators
- Responsive design for mobile devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.x (for Python code execution)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-code-editor
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

## Running the Application

### Step 1: Start the Backend Server
1. Open a terminal in the project root directory
2. Run the following command:
```bash
npm start
```
The server will start on http://localhost:5000

### Step 2: Start the Frontend Development Server
1. Open a new terminal
2. Navigate to the client directory:
```bash
cd client
```
3. Start the React development server:
```bash
npm start
```
The frontend will be available at http://localhost:3000

### Step 3: Access the Application
1. Open your web browser
2. Navigate to http://localhost:3000
3. You should see the collaborative code editor interface

## Usage Guide

1. **Creating/Joining a Room**
   - Enter a room ID in the input field
   - Click "Create Room" to create a new room
   - Share the room ID with others to collaborate

2. **Editing Code**
   - Select your preferred programming language (JavaScript or Python)
   - Start typing in the editor
   - Changes will be synchronized in real-time with other users

3. **Running Code**
   - Click the "Run Code" button to execute your code
   - View the output in the bottom panel
   - Any errors will be displayed in red

4. **User Management**
   - See who's currently in the room
   - View real-time connection status
   - Identify your own cursor with a different color

## Troubleshooting

### Common Issues

1. **Port 5000 Already in Use**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /F /PID <PID>
   
   # Linux/Mac
   lsof -i :5000
   kill -9 <PID>
   ```

2. **Node Modules Issues**
   ```bash
   # Delete node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

3. **Python Execution Issues**
   - Ensure Python is installed and in your system PATH
   - Verify Python version: `python --version`

## Security Considerations

- Code execution is sandboxed on the server
- Temporary files are automatically cleaned up after execution
- Input validation prevents malicious code execution
- Rate limiting implemented for code execution
- Secure WebSocket connections

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
