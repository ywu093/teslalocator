import axios from 'axios';
import crypto from 'crypto';
import { Vehicle, VehicleLocation } from '../types/tesla';
import configService from './configService';

// Tesla Fleet API regional base URLs
const FLEET_API_URLS: Record<string, string> = {
  NA: 'https://fleet-api.prd.na.vn.cloud.tesla.com',
  EU: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
  CN: 'https://fleet-api.prd.cn.vn.cloud.tesla.cn'
};

const AUTH_URL = 'https://auth.tesla.com/oauth2/v3/authorize';
const TOKEN_URL = 'https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token';

// Scopes needed for vehicle location tracking
const SCOPES = 'openid offline_access vehicle_device_data vehicle_location';

class TeslaService {
  private authToken: string | null = null;
  private vehicleCache: Map<string, VehicleLocation> = new Map();

  // Store state/verifier for OAuth flow
  private oauthState: string | null = null;
  private oauthCodeVerifier: string | null = null;

  private getFleetApiBase(): string {
    const config = configService.getConfig();
    const region = config.tesla.region || 'NA';
    return FLEET_API_URLS[region] || FLEET_API_URLS.NA;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Register the partner account in the configured region.
   * Must be called before the app can make Fleet API calls.
   */
  async registerPartner(clientId: string, clientSecret: string, region: string, domain: string): Promise<string> {
    const fleetApiBase = FLEET_API_URLS[region] || FLEET_API_URLS.NA;

    // Step 1: Get a partner token using client_credentials grant
    console.log('🔑 Obtaining partner token...');
    const tokenBody = {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid vehicle_device_data vehicle_location',
      audience: fleetApiBase
    };

    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams(tokenBody).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    const partnerToken = tokenResponse.data.access_token;
    console.log('✅ Partner token obtained');

    // Step 2: Register the partner account in the region using the provided domain
    console.log(`📝 Registering partner account in ${region} region with domain: ${domain}...`);
    const registerResponse = await axios.post(
      `${fleetApiBase}/api/1/partner_accounts`,
      { domain },
      {
        headers: {
          'Authorization': `Bearer ${partnerToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('✅ Partner account registered successfully:', JSON.stringify(registerResponse.data, null, 2));
    return registerResponse.data?.response?.account_id || 'registered';
  }

  /**
   * Generate the Tesla OAuth authorization URL for the user to visit
   */
  getAuthUrl(redirectUri: string): string {
    const config = configService.getConfig();
    if (!config.tesla.clientId) {
      throw new Error('Fleet API Client ID not configured. Please enter it in settings first.');
    }

    // Generate PKCE code verifier and challenge
    this.oauthCodeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(this.oauthCodeVerifier)
      .digest('base64url');

    this.oauthState = crypto.randomBytes(16).toString('hex');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.tesla.clientId,
      redirect_uri: redirectUri,
      scope: SCOPES,
      state: this.oauthState,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const url = `${AUTH_URL}?${params.toString()}`;
    console.log('🔗 Generated OAuth URL for Tesla authorization');
    return url;
  }

  /**
   * Exchange an authorization code for Fleet API tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<void> {
    const config = configService.getConfig();
    if (!config.tesla.clientId || !config.tesla.clientSecret) {
      throw new Error('Fleet API credentials not configured');
    }

    try {
      console.log('🔄 Exchanging authorization code for Fleet API tokens...');

      const body: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: config.tesla.clientId,
        client_secret: config.tesla.clientSecret,
        code,
        redirect_uri: redirectUri,
        audience: this.getFleetApiBase()
      };

      // Include PKCE verifier if we have one
      if (this.oauthCodeVerifier) {
        body.code_verifier = this.oauthCodeVerifier;
      }

      const response = await axios.post(TOKEN_URL, new URLSearchParams(body).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });

      const { access_token, refresh_token } = response.data;

      if (!access_token) {
        throw new Error('No access token received from Tesla');
      }

      // Save tokens
      configService.updateTeslaTokens(access_token, refresh_token || '');
      this.authToken = access_token;

      console.log('✅ Fleet API tokens obtained and saved successfully!');

      // Validate by listing vehicles
      const vehicles = await this.getVehicles();
      console.log(`📋 Token validated - found ${vehicles.length} vehicle(s)`);

    } catch (error: any) {
      console.error('❌ Token exchange failed:', error.response?.data || error.message);

      if (error.response?.data?.error === 'invalid_auth_code') {
        throw new Error('Authorization code expired or invalid. Please try signing in again.');
      }

      throw new Error(`Failed to exchange authorization code: ${error.response?.data?.error_description || error.message}`);
    } finally {
      this.oauthState = null;
      this.oauthCodeVerifier = null;
    }
  }

  /**
   * Refresh an expired access token using the refresh token
   */
  async refreshAccessToken(): Promise<void> {
    const config = configService.getConfig();
    if (!config.tesla.clientId || !config.tesla.refreshToken) {
      throw new Error('Cannot refresh token: missing client ID or refresh token');
    }

    try {
      console.log('🔄 Refreshing Tesla access token...');

      const body = {
        grant_type: 'refresh_token',
        client_id: config.tesla.clientId,
        refresh_token: config.tesla.refreshToken
      };

      const response = await axios.post(TOKEN_URL, new URLSearchParams(body).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });

      const { access_token, refresh_token } = response.data;

      configService.updateTeslaTokens(access_token, refresh_token || config.tesla.refreshToken);
      this.authToken = access_token;

      console.log('✅ Access token refreshed successfully');
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message);
      this.authToken = null;
      throw new Error('Token refresh failed. Please sign in with Tesla again.');
    }
  }

  async authenticate(): Promise<void> {
    const config = configService.getConfig();

    console.log('🔐 Authentication attempt...');

    if (config.tesla.accessToken) {
      this.authToken = config.tesla.accessToken;
      console.log('✅ Using stored Fleet API access token');
      return;
    }

    throw new Error('Tesla not connected. Please sign in with Tesla in the settings page.');
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken) {
      await this.authenticate();
    }
  }

  /**
   * Make an authenticated API call with automatic token refresh on 401
   */
  private async apiCall<T>(method: 'get' | 'post', path: string, data?: any): Promise<T> {
    await this.ensureAuthenticated();

    const url = `${this.getFleetApiBase()}${path}`;

    try {
      const response = method === 'get'
        ? await axios.get(url, { headers: this.headers, timeout: 15000 })
        : await axios.post(url, data || {}, { headers: this.headers, timeout: 15000 });
      return response.data;
    } catch (error: any) {
      // If 401, try refreshing the token and retry once
      if (error.response?.status === 401) {
        console.log('⚠️ Token expired, attempting refresh...');
        try {
          await this.refreshAccessToken();
          const response = method === 'get'
            ? await axios.get(url, { headers: this.headers, timeout: 15000 })
            : await axios.post(url, data || {}, { headers: this.headers, timeout: 15000 });
          return response.data;
        } catch (refreshError: any) {
          this.authToken = null;
          throw new Error('Tesla token expired. Please sign in with Tesla again in settings.');
        }
      }
      throw error;
    }
  }

  async getVehicles(): Promise<Vehicle[]> {
    try {
      const data = await this.apiCall<any>('get', '/api/1/vehicles');
      const vehicles = data.response;
      console.log(`📋 Found ${vehicles.length} vehicle(s)`);

      return vehicles.map((vehicle: any) => ({
        id: vehicle.vin,
        name: vehicle.display_name || `Vehicle ${vehicle.vin}`,
        model: this.getModelName(vehicle.vin),
        state: this.normalizeState(vehicle.state),
        vin: vehicle.vin
      }));
    } catch (error: any) {
      console.error('Error fetching vehicles:', error.response?.data || error.message);
      throw new Error(error.message || 'Failed to fetch vehicles from Tesla API');
    }
  }

  async getVehicleLocation(vehicleVin: string): Promise<VehicleLocation> {
    try {
      const data = await this.apiCall<any>(
        'get',
        `/api/1/vehicles/${vehicleVin}/vehicle_data?endpoints=location_data%3Bdrive_state`
      );

      const vehicleData = data.response;
      const state = this.normalizeState(vehicleData.state);

      // Try drive_state first, then location_data
      const driveState = vehicleData.drive_state || {};
      const lat = driveState.latitude ?? driveState.active_route_latitude;
      const lng = driveState.longitude ?? driveState.active_route_longitude;

      if (lat == null || lng == null) {
        // No location data in response - check cache
        const cached = this.vehicleCache.get(vehicleVin);
        if (cached) {
          return { ...cached, state };
        }
        throw new Error(`No location data available for vehicle ${vehicleVin}`);
      }

      const location: VehicleLocation = {
        vehicleId: vehicleVin,
        location: {
          latitude: lat,
          longitude: lng,
          heading: driveState.heading || 0,
          speed: driveState.speed
        },
        timestamp: driveState.timestamp
          ? new Date(driveState.timestamp).toISOString()
          : new Date().toISOString(),
        state
      };

      this.vehicleCache.set(vehicleVin, location);
      return location;
    } catch (error: any) {
      console.error(`Error fetching location for ${vehicleVin}:`, error.response?.data || error.message);

      // Return cached location if available
      const cached = this.vehicleCache.get(vehicleVin);
      if (cached) return { ...cached, state: 'offline' };

      throw new Error(error.message || `Failed to fetch vehicle location`);
    }
  }

  async wakeVehicle(vehicleVin: string): Promise<void> {
    try {
      await this.apiCall('post', `/api/1/vehicles/${vehicleVin}/wake_up`);
      console.log(`Vehicle ${vehicleVin} wake up command sent`);
    } catch (error: any) {
      console.error(`Error waking vehicle ${vehicleVin}:`, error.response?.data || error.message);
      throw new Error('Failed to wake vehicle');
    }
  }

  private normalizeState(state: string): 'online' | 'asleep' | 'offline' {
    const normalized = state.toLowerCase();
    if (normalized === 'online') return 'online';
    if (normalized === 'asleep') return 'asleep';
    return 'offline';
  }

  private getModelName(vin: string): string {
    const modelCode = vin.substring(2, 4);
    const modelMap: { [key: string]: string } = {
      'YJ': 'Model 3',
      'SA': 'Model S',
      'YG': 'Model Y',
      'RE': 'Model X'
    };
    return modelMap[modelCode] || 'Tesla';
  }
}

export default new TeslaService();
