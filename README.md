# Tesla Location Tracker

A responsive web application to track the real-time location of your Tesla vehicles on an interactive Google Map, powered by the Tesla Fleet API.

## Features

- **Multi-Vehicle Tracking** - Track multiple Tesla vehicles simultaneously on a single map
- **Real-Time Location Updates** - Automatic polling every 10 seconds for online vehicles (configurable)
- **Interactive Google Map** - Pan, zoom, and switch map types with custom Tesla-styled vehicle markers
- **Vehicle Selection & Auto-Follow** - Click a vehicle to select and auto-follow its location on the map; click again to deselect
- **Reverse Geocoding** - Shows the nearest street address for each vehicle using Google Maps Geocoder
- **GPS Coordinates** - Displays latitude/longitude for each vehicle in the sidebar
- **Speed Display** - Shows current speed in km/h
- **Custom Tesla Vehicle Icons** - SVG markers with Tesla logo, color-coded by vehicle state (green=online, gray=asleep/offline), rotated by heading
- **Web-Based Settings** - Configure Tesla Fleet API credentials, Google Maps API key, and polling interval through the UI — no manual file editing required
- **Deploy Mode Toggle** - Settings UI switches between Docker/Server mode (ngrok container) and Local Dev mode (standalone ngrok)
- **Tesla Fleet API (OAuth 2.0)** - Secure authentication using OAuth 2.0 with PKCE via Tesla's official Fleet API
- **EC Key Pair Management** - Auto-generates and serves the required EC key pair for Tesla Fleet API registration
- **Password Protection** - Optional login page protects the app from public access when deployed to the internet
- **Responsive Design** - Optimized layout for mobile (bottom sheet), tablet (overlay sidebar), and desktop (fixed sidebar)
- **Smart Polling** - Only actively polls online vehicles; uses longer cache times for asleep/offline vehicles to avoid battery drain
- **Production-Ready** - Express serves the built frontend; works behind ngrok or reverse proxies
- **Docker Support** - Dockerfile and docker-compose files for containerized 24/7 deployment on QNAP NAS or any Docker host

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Maps**: Google Maps JavaScript API (`@react-google-maps/api`)
- **Data Fetching**: React Query (`@tanstack/react-query`) with automatic polling
- **Auth**: Tesla Fleet API OAuth 2.0 + PKCE, `express-session` for app login
- **HTTP Client**: Axios

## Project Structure

```
teslalocator/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx              # Main app layout with vehicle tracking
│   │   │   ├── Layout/
│   │   │   │   └── Header.tsx       # App header with settings & logout buttons
│   │   │   ├── Map/
│   │   │   │   ├── VehicleMap.tsx    # Google Maps with auto-follow
│   │   │   │   └── VehicleMarker.tsx # Custom Tesla SVG markers
│   │   │   ├── Settings/
│   │   │   │   └── SettingsModal.tsx # Fleet API, Maps key, polling config
│   │   │   └── VehicleList/
│   │   │       └── VehicleList.tsx   # Sidebar with address, GPS & speed info
│   │   ├── hooks/
│   │   │   ├── useVehicles.ts       # Fetch vehicle list
│   │   │   ├── useVehicleLocation.ts # Poll vehicle locations
│   │   │   └── useReverseGeocode.ts # Address lookup from coordinates
│   │   ├── services/
│   │   │   ├── api.ts               # Axios API client with session handling
│   │   │   └── configService.ts     # localStorage settings manager
│   │   └── types/
│   │       └── vehicle.ts           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── server/                          # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── vehicleController.ts  # Vehicle request handlers
│   │   │   └── settingsController.ts # Settings & OAuth callback handlers
│   │   ├── routes/
│   │   │   ├── vehicles.ts           # Vehicle API routes
│   │   │   ├── settings.ts           # Settings API routes
│   │   │   └── auth.ts               # Login page, login POST, logout routes
│   │   ├── services/
│   │   │   ├── teslaService.ts       # Tesla Fleet API integration
│   │   │   ├── configService.ts      # Server config (config.json) manager
│   │   │   └── keyService.ts         # EC key pair generation & management
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Session-based auth gate middleware
│   │   │   └── errorHandler.ts       # Express error handling
│   │   └── index.ts                  # Express server entry point
│   ├── config.json.example
│   └── package.json
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Local/self-hosted deployment
├── docker-compose.qnap.yml           # QNAP Container Station deployment
├── .github/workflows/
│   └── docker-publish.yml            # Auto-build & push image to GHCR on push
├── .dockerignore
└── package.json                      # Workspace configuration
```

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Tesla account with vehicles
- Tesla Developer account ([developer.tesla.com](https://developer.tesla.com))
- ngrok account with a static domain ([ngrok.com](https://ngrok.com)) — required for Tesla OAuth
- Google Maps API key with Maps JavaScript API enabled ([Get one here](https://developers.google.com/maps/documentation/javascript/get-api-key))

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm run dev
```

This starts:
- **Backend server** on http://localhost:3001
- **Frontend app** on http://localhost:5173

### 3. Configure via Settings UI

Open http://localhost:5173 and click the gear icon in the header to open Settings.

Select **Local Dev (ngrok)** mode and follow the steps:

1. **Tesla Fleet API** — Enter your Client ID, Client Secret, and ngrok domain, then click "Sign in with Tesla"
2. **Google Maps API Key** — Enter your API key (stored in browser localStorage)
3. **Polling Interval** — Set how often to poll locations in milliseconds (default: 10000)

### 4. Run ngrok for Tesla OAuth

Tesla requires a publicly accessible HTTPS URL for OAuth callbacks. Run ngrok pointing at the backend:

```bash
ngrok http --domain=your-domain.ngrok-free.dev 3001
```

Enter this domain in the Settings UI under "Local Dev (ngrok)" mode.

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the backend |
| `npm run build` | Build both client and server for production |
| `npm run build:client` | Build only the frontend |
| `npm run build:server` | Build only the backend |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vehicles` | List all vehicles |
| `GET` | `/api/vehicles/:id/location` | Get vehicle location |
| `POST` | `/api/vehicles/:id/wake` | Wake a sleeping vehicle |
| `GET` | `/api/settings/status` | Check configuration status |
| `POST` | `/api/settings/fleet-config` | Save Fleet API credentials |
| `GET` | `/api/settings/auth-url` | Get Tesla OAuth authorization URL |
| `GET` | `/api/auth/tesla/callback` | Tesla OAuth callback handler (always public) |
| `GET` | `/.well-known/appspecific/com.tesla.3p.public-key.pem` | Tesla-required public key (always public) |
| `GET` | `/login` | Login page |
| `POST` | `/api/login` | Authenticate with app password |
| `POST` | `/api/logout` | End session |
| `GET` | `/health` | Health check (always public) |

## QNAP Container Station Deployment

The app is built and published automatically to GitHub Container Registry on every push to `main`. No SSH or git clone needed on the QNAP.

### Step 1: Wait for the Docker image to build

Go to `https://github.com/ywu093/teslalocator/actions` and confirm the latest workflow completed (green checkmark). The image is published at `ghcr.io/ywu093/teslalocator:latest`.

> If the repository is private, go to `https://github.com/ywu093?tab=packages`, click the package, then **Package settings > Change visibility > Public**.

### Step 2: Create the application in Container Station

1. Open **Container Station** on your QNAP
2. Go to **Application > Create**
3. Paste the contents of `docker-compose.qnap.yml`, replacing the placeholder values:

```yaml
services:
  teslalocator:
    image: ghcr.io/ywu093/teslalocator:latest
    container_name: teslalocator
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - teslalocator-data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CORS_ORIGIN=*
      - APP_PASSWORD=your-strong-password-here
      - SESSION_SECRET=your-random-secret-here

  ngrok:
    image: ngrok/ngrok:latest
    container_name: teslalocator-ngrok
    restart: unless-stopped
    command: http teslalocator:3001 --domain=your-domain.ngrok-free.dev
    environment:
      - NGROK_AUTHTOKEN=your-ngrok-auth-token
    depends_on:
      - teslalocator

volumes:
  teslalocator-data:
```

Replace:
- `your-strong-password-here` — password to log in to the app
- `your-random-secret-here` — random string for session encryption (generate with `openssl rand -hex 32`)
- `your-domain.ngrok-free.dev` — your ngrok static domain
- `your-ngrok-auth-token` — from [dashboard.ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)

4. Click **Create**

### Step 3: Open the app

Go to `https://your-domain.ngrok-free.dev` and log in with the password you set.

On first use, open Settings, select **Docker / Server** mode, and enter your Tesla Fleet API credentials using your ngrok static domain.

### Updating

Push code to `main` → GitHub Actions rebuilds the image → In Container Station, click **Recreate** to pull the latest.

## Password Protection

When `APP_PASSWORD` is set, the app requires a password to access:

- Visiting the app redirects to a login page
- After login, a session cookie is stored (valid for 7 days)
- Click the logout button (→ icon) in the header to sign out
- The Tesla OAuth callback and public key endpoint are always public (required by Tesla's servers)
- If `APP_PASSWORD` is not set, the app is open — suitable for local development

## Features in Detail

### Vehicle Selection & Auto-Follow

- Click a vehicle in the sidebar to select it — the map zooms in and follows the vehicle as it moves
- Click again to deselect — the map stops following
- Selected vehicles show a "Tracking" label in the sidebar

### Reverse Geocoded Addresses

Each vehicle shows its nearest street address, resolved using the Google Maps Geocoder from the Maps JavaScript SDK. Results are cached in memory to minimize API calls.

### Custom Vehicle Markers

Vehicles are displayed with custom SVG markers featuring:
- Tesla logo overlay
- Color-coded glow: green (online), gray (asleep/offline)
- Heading-based rotation
- InfoWindow on click showing status, speed (km/h), GPS, and last update time

### Smart Polling Strategy

- Online vehicles: polled every 10 seconds (configurable)
- Asleep/offline vehicles: location fetched once, cached for 60 seconds
- Polling pauses automatically when the browser tab is inactive

### Settings Persistence

- **Server-side** (`config.json` / Docker volume): Tesla Fleet API credentials, OAuth tokens — persists across restarts
- **Client-side** (localStorage): Google Maps API key, polling interval — per-browser
- **Fallback**: `.env` files are used if `config.json` doesn't exist

### Responsive Layout

- **Desktop (>=1024px)**: Fixed 320px sidebar + map
- **Tablet (768-1023px)**: Overlay sidebar
- **Mobile (<768px)**: Full-screen map with bottom sheet vehicle list

## Troubleshooting

### Redirected to login page unexpectedly

- Your session may have expired (7-day limit) — log in again
- Check that `SESSION_SECRET` is set consistently and hasn't changed between container restarts

### "Error loading vehicles"

- Open Settings and verify your Tesla Fleet API credentials
- Ensure you've completed the OAuth flow ("Sign in with Tesla")
- Check that the ngrok tunnel is running

### "Google Maps API key not configured"

- Open Settings and enter your Google Maps API key
- Ensure the Maps JavaScript API is enabled in Google Cloud Console

### Vehicles not updating

- Check that vehicles are "online" (sleeping vehicles are not actively polled)
- Adjust the polling interval in Settings
- Check browser console for errors

### Street address not showing

- The Google Maps JavaScript API must be loaded before reverse geocoding works
- The hook retries automatically after 3 seconds if Maps JS isn't ready yet

### Tesla OAuth error: "Domain is not valid"

- DDNS domains (e.g. `*.myqnapcloud.com`) are rejected by Tesla Developer portal
- Use an ngrok static domain instead — Tesla accepts these

## Security Notes

- `APP_PASSWORD` and `SESSION_SECRET` should be set via environment variables, not hardcoded
- Tesla credentials and OAuth tokens are stored in `server/config.json` (gitignored) or Docker volume
- Google Maps API key is stored in browser localStorage
- EC private keys in `server/keys/` are gitignored
- Never commit `.env` or `config.json` to version control

## Limitations

- Tesla Fleet API has rate limits — excessive polling may trigger throttling
- Frequent polling may prevent vehicles from entering sleep mode (battery impact)
- Google Maps has usage limits (free tier includes $200/month credit)
- The `@react-google-maps/api` library uses the legacy `google.maps.Marker` (deprecated but functional)

## License

ISC
