# Setlist Manager

A Next.js-based setlist management application designed for musicians to create, manage, and organize their performance setlists across multiple devices.

## Features

- **Real-time Multi-Device Sync**: Changes made on one device automatically sync to all other connected devices within seconds
- **Drag-and-Drop Interface**: Easily reorder songs in your setlist
- **Set Break Management**: Add and manage set breaks between songs
- **Song Library**: Maintain a library of songs with details like duration, key, and lyrics
- **Multiple Setlists**: Create and manage multiple setlists for different performances
- **PWA Support**: Install as a Progressive Web App on your devices
- **Responsive Design**: Works on all devices from phones to tablets to desktops

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Access the app:
- On the same device: Open [http://localhost:3000](http://localhost:3000)
- From other devices: Open `http://[your-ip-address]:3000`
  - Replace [your-ip-address] with your computer's local IP address
  - Make sure all devices are on the same network

## Using Multiple Devices

The app supports real-time synchronization across multiple devices:

1. Open the app on your primary device
2. Open the app on additional devices using the same URL
3. Changes made on any device will automatically sync to all others
4. Changes are saved immediately and persist across sessions

## Technical Details

- Built with Next.js 14
- Uses local storage for session management
- Implements polling-based synchronization (1-second intervals)
- Saves data to JSON files for persistence
- PWA-enabled for installation on mobile devices

## Recent Updates

- Added automatic multi-device synchronization
- Implemented real-time updates with timestamp-based polling
- Added immediate save functionality for all changes
- Improved data persistence and state management
- Added PWA support for home screen installation

## Development

This project uses:
- Next.js for the framework
- React for the UI
- next-pwa for Progressive Web App support
- Local JSON files for data storage
- Custom polling mechanism for real-time updates

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
