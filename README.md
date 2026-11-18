# IslamQuiZz

[![Live Demo](https://img.shields.io/badge/Live%20Demo-islamquizz.sahihfinder.com-0f5132?style=for-the-badge)](http://islamquizz.sahihfinder.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-63.5%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PeerJS](https://img.shields.io/badge/Networking-PeerJS-0284c7)](https://peerjs.com/)

**IslamQuiZz** is a browser-based Islamic trivia experience for solo play and live multiplayer rooms. It includes Hadith verification, Seerah, and Islamic history decks, plus a quiz builder that turns custom decks into shareable links.

Live at: **http://islamquizz.sahihfinder.com/**

## Features

### Solo quizzes
- Timed four-choice questions
- Randomized question and answer order
- Speed-based and streak-based scoring
- Live score, streak, and countdown displays
- Answer explanations and result summaries
- CSV export for results

### Multiplayer rooms
- Host a live room with a randomly generated six-digit PIN
- Peer-to-peer connections powered by **PeerJS**
- Custom player nicknames and avatars
- Real-time scores and streak updates
- Player leaderboard and top-three podium
- Live match export to CSV

### Quiz builder
- Create custom quiz decks in the browser
- Add a title, author, question, four choices, and the correct answer
- Include a source or explanation for every question
- Remove and reorganize draft questions
- Publish and share custom decks through an encoded URL
- No account or database is required for custom quizzes

### Built-in deck categories
- Hadith verification and commonly circulated quotes
- Seerah and Islamic history
- Custom shared quiz decks

## How it works

1. A player chooses a premade or shared quiz deck.
2. **Solo mode** runs the quiz locally using `QuizGameEngine`.
3. **Host mode** creates a PeerJS peer whose ID contains the six-digit room PIN.
4. Players join by entering that PIN; the host and players communicate directly through reliable PeerJS data connections.
5. The host starts the match, sends the selected deck to connected players, and receives score updates.
6. Shared custom decks are encoded into the URL fragment as JSON and Base64 data.

## Project structure

```text
.
├── index.html              # Main application markup and view containers
├── style.css               # Responsive application styling
├── favicon1.png            # Application icon
├── CNAME                   # Custom-domain configuration
└── src/
    ├── main.ts             # App initialization, lobby, builder, and DOM events
    ├── game.ts             # Quiz flow, timer, scoring, and answer handling
    ├── multi.ts            # Live PeerJS host/client implementation
    ├── multiplayer.ts      # Alternate multiplayer implementation
    ├── player.ts           # Player state, podium, leaderboard, and CSV export
    ├── presets.ts          # Built-in quiz decks
    └── types.ts            # Quiz deck and question interfaces
```

## Technology

- **HTML5** — semantic application structure
- **CSS3** — responsive layout and animated results UI
- **TypeScript** — game, builder, and multiplayer logic
- **PeerJS** — browser-to-browser room connections
- **Web Audio API** — answer feedback and join sounds
- **GitHub Pages** — static hosting
- **No backend/database** — the app and shared quiz data run entirely in the browser

## Running locally

Because the app is ES-module based and uses PeerJS, serve it through a local HTTP server rather than opening `index.html` directly with a `file://` URL.

### 1. Clone the repository

```bash
git clone https://github.com/Shahadah-Studios-Elite/IslamQuiZz-main.git
cd IslamQuiZz-main
```

### 2. Compile TypeScript

Use the TypeScript compiler if you have it installed:

```bash
npx tsc --project tsconfig.json
```

The browser entry module is configured to load compiled output from:

```text
dist/main.js
```

If the repository does not contain a `tsconfig.json` or an existing build setup, create a simple one that emits ES modules under `dist`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts"]
}
```

Then compile:

```bash
npx tsc --project tsconfig.json
```

### 3. Start a local server

```bash
npx serve .
```

Or with Python:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

For TypeScript changes, recompile before refreshing the browser.

## Deployment

This is a static site and can be deployed to GitHub Pages, Netlify, Cloudflare Pages, or any other static web host.

For GitHub Pages:

1. Push the compiled `dist` files and `index.html` to the repository's `main` branch.
2. Open **Settings → Pages**.
3. Select the `main` branch and `/ (root)` folder.
4. Add the custom domain through the repository's Pages settings.

The repository's `CNAME` file can be used for a custom domain such as `islamquizz.sahihfinder.com`.

## Multiplayer guide

### Hosting

1. Open the application.
2. Select **Host Live** on a quiz card.
3. Share the displayed six-digit PIN with players.
4. Wait for at least one player to join.
5. Select **Start Live Match**.

### Joining

1. Open the application in another browser or device.
2. Select **Join Live PIN**.
3. Choose an avatar.
4. Enter a nickname.
5. Enter the host's six-digit PIN.
6. Wait for the host to begin the match.

> Multiplayer relies on PeerJS cloud signaling and Peer-to-Peer connectivity. Some networks or browsers may restrict P2P traffic. Firewalls, VPNs, private-network policies, or browser privacy settings can prevent a room from connecting.

## Scoring

A correct answer awards points based on speed and streak:

```text
base points = 100 + (seconds remaining × 10)
streak multiplier = 1 + ((current streak - 1) × 0.25)
maximum streak multiplier = 3×
awarded points = rounded(base points × streak multiplier)
```

Incorrect answers and expired timers reset the current streak. The best streak reached during the match is stored in the results screen.

## Custom quiz links

The quiz builder serializes a quiz deck and places it in a URL fragment:

```text
https://your-domain.example/#quiz=<base64-and-uri-encoded-json>
```

This makes custom quizzes easy to share without a server or database, but the full deck is included in the URL and should not contain sensitive or private information.

## Browser support

The project targets modern evergreen browsers with support for:

- ES modules
- `window.AudioContext` or `webkitAudioContext`
- PeerJS WebRTC connections
- Clipboard API
- Modern JavaScript features such as `Array.at()`

Clipboard access may require HTTPS or a local `localhost` origin.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/my-improvement
   ```

3. Make and test your changes.
4. Submit a pull request with a clear description and screenshots for UI changes.

Before changing quiz content, please verify the accuracy and scholarly grading of Islamic references.

## Content and accuracy

IslamQuiZz is an educational trivia application. Deck explanations are intended for general learning and should not replace study with qualified scholars or consultation of primary sources.

## License

No license has currently been specified for this repository. Add a `LICENSE` file if you intend to grant reuse, modification, or redistribution permissions.

## Credits

- **Shahadah Studios Elite** — development and publishing
- **SahihFinder** — project integration and educational resources
- [PeerJS](https://peerjs.com/) — peer-to-peer networking
