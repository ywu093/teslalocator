import { Request, Response } from 'express';
import configService from '../services/configService';
import teslaService from '../services/teslaService';

export const getStatus = (req: Request, res: Response) => {
  try {
    const config = configService.getConfig();
    res.json({
      configured: configService.isConfigured(),
      hasFleetCredentials: configService.hasFleetApiCredentials(),
      region: config.tesla.region || 'NA',
      clientId: config.tesla.clientId || '',
      clientSecret: config.tesla.clientSecret || '',
      domain: config.tesla.domain || ''
    });
  } catch (error: any) {
    console.error('Error checking config status:', error);
    res.status(500).json({ error: error.message || 'Failed to check configuration status' });
  }
};

export const updateFleetConfig = async (req: Request, res: Response) => {
  const { clientId, clientSecret, region, domain } = req.body;

  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Client ID and Client Secret are required' });
  }

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required (use your ngrok domain, e.g. abc123.ngrok-free.app)' });
  }

  try {
    const selectedRegion = region || 'NA';
    configService.updateFleetApiConfig(clientId, clientSecret, selectedRegion, domain);

    // Register the partner account in the selected region
    try {
      await teslaService.registerPartner(clientId, clientSecret, selectedRegion, domain);
      res.json({ success: true, message: 'Fleet API credentials saved and partner registered in region' });
    } catch (regError: any) {
      console.error('Partner registration warning:', regError.response?.data || regError.message);
      const regMessage = regError.response?.data?.error || regError.response?.data?.error_description || regError.message || '';
      if (regMessage.includes('already') || regError.response?.status === 409) {
        res.json({ success: true, message: 'Fleet API credentials saved (already registered)' });
      } else {
        res.json({
          success: true,
          warning: `Credentials saved but region registration failed: ${regMessage}. You may need to register manually.`
        });
      }
    }
  } catch (error: any) {
    console.error('Error saving Fleet API config:', error);
    res.status(500).json({ error: error.message || 'Failed to save configuration' });
  }
};

export const getAuthUrl = (req: Request, res: Response) => {
  try {
    const config = configService.getConfig();
    // Use the ngrok domain for the redirect URI if configured
    const domain = config.tesla.domain;
    const redirectUri = domain
      ? `https://${domain}/api/auth/tesla/callback`
      : `${req.protocol}://${req.get('host')}/api/auth/tesla/callback`;
    const authUrl = teslaService.getAuthUrl(redirectUri);
    res.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: error.message });
  }
};

export const handleCallback = async (req: Request, res: Response) => {
  const { code, state, error: authError } = req.query;

  if (authError) {
    // Redirect to frontend with error
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(String(authError))}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code received' });
  }

  try {
    const config = configService.getConfig();
    const domain = config.tesla.domain;
    const redirectUri = domain
      ? `https://${domain}/api/auth/tesla/callback`
      : `${req.protocol}://${req.get('host')}/api/auth/tesla/callback`;
    await teslaService.exchangeCode(String(code), redirectUri);

    // Redirect to frontend with success
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?auth_success=true`);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error.message)}`);
  }
};
