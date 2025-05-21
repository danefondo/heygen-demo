# HeyGen Demo

A full-stack application demonstrating the integration with HeyGen's API for AI-powered video generation and streaming avatars. This project showcases both video generation and real-time avatar streaming capabilities using HeyGen's services.

## Features

- Real-time avatar streaming
- Video generation with AI avatars
- Voice selection and text-to-speech
- Avatar selection and customization
- Video status tracking
- Modern Vue.js frontend
- Express.js backend

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- HeyGen API Key

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
HEYGEN_API_KEY=your_api_key_here
HEYGEN_API_URL=https://api.heygen.com/v1
PORT=3000
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd heygen-demo
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd heygen-client
npm install
cd ..
```

## Development

To run the application in development mode:

```bash
npm run dev
```

This will start both the server and client in development mode with hot-reloading enabled.

## Building for Production

To build the client and prepare for production:

```bash
npm run build
```

## Running in Production

To start the production server:

```bash
npm start
```

## Project Structure

- `/` - Server-side code and configuration
- `/heygen-client` - Vue.js frontend application
  - `/src` - Source code for the frontend
  - `/public` - Static assets
  - `/dist` - Built frontend files

## API Endpoints

### Avatar Management
- `GET /api/avatars` - List available streaming avatars
- `GET /api/video-avatars` - List avatars for video generation

### Voice Management
- `GET /api/voices` - List available voices

### Video Generation
- `POST /api/videos/create` - Create a new video
- `GET /api/videos/:video_id` - Get video status

### Streaming
- `GET /api/token` - Generate streaming token

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 