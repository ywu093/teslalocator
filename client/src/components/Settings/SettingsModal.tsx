import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { configService } from '../../services/configService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeployMode = 'docker' | 'local';

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [deployMode, setDeployMode] = useState<DeployMode>('docker');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [domain, setDomain] = useState('');
  const [region, setRegion] = useState('NA');
  const [googleMapsKey, setGoogleMapsKey] = useState(
    configService.getGoogleMapsApiKey() || ''
  );
  const [pollingInterval, setPollingInterval] = useState(
    configService.getPollingInterval()
  );
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Check current status on open and populate saved values
  useEffect(() => {
    if (isOpen) {
      api.getSettingsStatus().then((status) => {
        setIsConnected(status.configured);
        setHasCredentials(status.hasFleetCredentials);
        if (status.region) setRegion(status.region);
        if (status.clientId) setClientId(status.clientId);
        if (status.clientSecret) setClientSecret(status.clientSecret);
        if (status.domain) setDomain(status.domain);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSaveFleetConfig = async () => {
    if (!clientId || !clientSecret) {
      setMessage('Error: Both Client ID and Client Secret are required');
      return;
    }
    if (!domain) {
      setMessage('Error: Domain is required for Tesla OAuth redirect.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      await api.updateFleetConfig(clientId.trim(), clientSecret.trim(), region, domain.trim());
      setHasCredentials(true);
      setMessage('Fleet API credentials saved! Now click "Sign in with Tesla" below.');
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSignInWithTesla = async () => {
    setConnecting(true);
    setMessage('');

    try {
      const { authUrl } = await api.getAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.error || error.message}`);
      setConnecting(false);
    }
  };

  const handleSaveOtherSettings = () => {
    if (googleMapsKey) {
      configService.setGoogleMapsApiKey(googleMapsKey);
    }
    configService.setPollingInterval(pollingInterval);

    setMessage('Settings saved successfully!');
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tesla Fleet API Connection */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-700">Tesla Fleet API</h3>

          {isConnected && (
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              Connected to Tesla Fleet API
            </div>
          )}

          {/* Deployment Mode Toggle */}
          <div className="mb-3 flex rounded border border-gray-300 overflow-hidden">
            <button
              onClick={() => setDeployMode('docker')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                deployMode === 'docker'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Docker / Server
            </button>
            <button
              onClick={() => setDeployMode('local')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                deployMode === 'local'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Local Dev (ngrok)
            </button>
          </div>

          {/* Step 1: Fleet API Credentials */}
          <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Step 1: Enter Fleet API Credentials
            </p>

            {deployMode === 'docker' ? (
              <p className="text-xs text-gray-500 mb-2">
                1. Register a free app at{' '}
                <a
                  href="https://developer.tesla.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  developer.tesla.com
                </a>
                <br />
                2. Enter your ngrok static domain below (ngrok runs as a container alongside the app)
                <br />
                3. Use your ngrok domain as the Allowed Origin, Redirect URI, and Returned URL on Tesla Developer
              </p>
            ) : (
              <p className="text-xs text-gray-500 mb-2">
                1. Register a free app at{' '}
                <a
                  href="https://developer.tesla.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  developer.tesla.com
                </a>
                <br />
                2. Run <code className="bg-gray-200 px-1 rounded">ngrok http 3001</code> to get a public domain
                <br />
                3. Use your ngrok URL as the Allowed Origin, Redirect URI, and Returned URL on Tesla Developer
              </p>
            )}

            <input
              type="text"
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="password"
              placeholder="Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="text"
              placeholder={deployMode === 'docker'
                ? 'ngrok static domain (e.g. abc123.ngrok-free.dev)'
                : 'ngrok domain (e.g. abc123.ngrok-free.app)'
              }
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-600">Region:</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NA">North America / Asia-Pacific (incl. NZ, AU)</option>
                <option value="EU">Europe, Middle East, Africa</option>
                <option value="CN">China</option>
              </select>
            </div>
            <button
              onClick={handleSaveFleetConfig}
              disabled={saving || !clientId || !clientSecret || !domain}
              className="w-full py-2 bg-gray-700 text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving & Registering...' : hasCredentials ? 'Update & Re-register' : 'Save & Register'}
            </button>
          </div>

          {/* Step 2: Sign in with Tesla */}
          <div className="mb-2 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Step 2: Authorize with Tesla
            </p>
            <p className="text-xs text-gray-500 mb-2">
              This will open Tesla's login page. After you sign in, you'll be redirected back here.
            </p>
            <button
              onClick={handleSignInWithTesla}
              disabled={connecting || !hasCredentials}
              className="w-full py-2.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {connecting ? (
                'Redirecting to Tesla...'
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.5c.548 0 1.088.04 1.618.118L12 9.5l-1.618-6.882A9.503 9.503 0 0112 2.5zm-3.5.75L12 13l3.5-9.75A9.5 9.5 0 0121.5 12c0 5.247-4.253 9.5-9.5 9.5S2.5 17.247 2.5 12a9.5 9.5 0 015-8.75z"/>
                  </svg>
                  Sign in with Tesla
                </>
              )}
            </button>
            {!hasCredentials && (
              <p className="text-xs text-amber-600 mt-1">
                Save your Fleet API credentials first (Step 1)
              </p>
            )}
          </div>

          {domain && (
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              <p>Use these URLs on developer.tesla.com:</p>
              <p>Origin: <code className="bg-gray-100 px-1 rounded">https://{domain}</code></p>
              <p>Redirect URI: <code className="bg-gray-100 px-1 rounded">https://{domain}/api/auth/tesla/callback</code></p>
              <p>Returned URL: <code className="bg-gray-100 px-1 rounded">https://{domain}</code></p>
            </div>
          )}
        </div>

        {/* Google Maps */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-700">Google Maps API Key</h3>
          <input
            type="text"
            placeholder="AIza..."
            value={googleMapsKey}
            onChange={(e) => setGoogleMapsKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your key at{' '}
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.cloud.google.com
            </a>
          </p>
        </div>

        {/* Polling Interval */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-700">Polling Interval</h3>
          <input
            type="number"
            value={pollingInterval}
            onChange={(e) => setPollingInterval(parseInt(e.target.value) || 10000)}
            min="5000"
            step="1000"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            How often to update vehicle locations (milliseconds). Recommended: 10000ms (10 seconds)
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.includes('Error')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOtherSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
