import fs from 'fs';
import path from 'path';

interface Config {
  tesla: {
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    region?: string; // NA, EU, CN
    domain?: string; // ngrok domain for partner registration
  };
}

class ConfigService {
  private configPath = process.env.CONFIG_PATH || path.join(__dirname, '../../config.json');

  getConfig(): Config {
    // Try config.json first, fallback to .env
    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        console.error('Error reading config.json, falling back to .env:', error);
      }
    }

    // Fallback to environment variables
    return {
      tesla: {
        clientId: process.env.TESLA_CLIENT_ID || '',
        clientSecret: process.env.TESLA_CLIENT_SECRET || '',
        accessToken: process.env.TESLA_ACCESS_TOKEN || '',
        refreshToken: process.env.TESLA_REFRESH_TOKEN || '',
        region: process.env.TESLA_REGION || 'NA'
      }
    };
  }

  updateFleetApiConfig(clientId: string, clientSecret: string, region: string, domain?: string): void {
    const existing = this.getConfig();
    const config: Config = {
      tesla: {
        ...existing.tesla,
        clientId,
        clientSecret,
        region,
        ...(domain ? { domain } : {})
      }
    };

    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('Fleet API config updated in config.json');
    } catch (error) {
      console.error('Error writing config.json:', error);
      throw new Error('Failed to save configuration');
    }
  }

  updateTeslaTokens(accessToken: string, refreshToken: string): void {
    const existing = this.getConfig();
    const config: Config = {
      tesla: {
        ...existing.tesla,
        accessToken,
        refreshToken
      }
    };

    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('Tesla tokens updated in config.json');
    } catch (error) {
      console.error('Error writing config.json:', error);
      throw new Error('Failed to save configuration');
    }
  }

  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config.tesla.accessToken && config.tesla.refreshToken);
  }

  hasFleetApiCredentials(): boolean {
    const config = this.getConfig();
    return !!(config.tesla.clientId && config.tesla.clientSecret);
  }
}

export default new ConfigService();
