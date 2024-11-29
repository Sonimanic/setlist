# How to Use Setlist App

## Running the App

### On Your PC
1. Open a terminal in the project directory
2. Build the app:
   ```bash
   npm run build
   ```
3. Start the server:
   ```bash
   npx next start -H 192.168.1.140 -p 3000
   ```
4. Keep the terminal window open while using the app

### On Your iPad
1. Make sure your iPad is connected to the same WiFi network as your PC
2. Open Chrome browser on your iPad
3. Go to: `http://192.168.1.140:3000`

## Adding to iPad Home Screen
1. In Chrome on your iPad:
   - Tap the three dots menu (⋮)
   - Select "Add to Home Screen"
   - Name it "Setlist"
   - Tap "Add"

## Important Notes
- Your PC must be running and on the same network as your iPad
- The app will only work when:
  - The PC is turned on
  - The server is running
  - Both devices are on the same WiFi network
- If you make changes to the code:
  1. Stop the server (Ctrl+C in terminal)
  2. Rebuild (`npm run build`)
  3. Start the server again

## Troubleshooting
If the app isn't loading:
1. Check that both devices are on the same WiFi network
2. Ensure the server is running on your PC
3. Try accessing `http://localhost:3000` on your PC to verify the server is working
4. Make sure you're using Chrome on iPad (Safari may not work properly)
5. Check if your PC's firewall is blocking the connection

## Development
To run in development mode (for making changes):
```bash
npm run dev -- --hostname 192.168.1.140 --port 3000
```

## Features
- Create and manage setlists
- Add and organize songs
- Drag and drop to reorder items
- View song details and lyrics
- Track set durations

Need help? Check the [README.md](./README.md) for more detailed information about the project.
