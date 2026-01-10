

/**
 * Aletheia API Service - LIVEKIT VERSION
 * Connects React Native app to Aletheia therapy bot backend
 */

// Use your ngrok URL or local server
export const API_URL = 'https://app-backend-production-cdd0.up.railway.app'; // ✅ REMOVE trailing space

const API_BASE_URL = API_URL;

// ✅ FIXED: Added 'token' property for backward compatibility
interface ConnectionResponse {
  status: string;
  room_url: string;      // LiveKit WS URL (wss://...)
  room_name: string;     // Room name
  bot_token: string;     // Token for the bot
  user_token: string;    // Token for the user
  token: string;         // ✅ BACKWARD COMPATIBILITY (same as user_token)
  bot_pid: number;
  status_endpoint: string;
}

interface HealthCheckResponse {
  status: string;
  timestamp?: string;
}

interface BotStatus {
  bot_id: number;
  status: 'running' | 'finished';
  room?: string;  // Room name
}

export const aletheiaApi = {
  /**
   * Connect to Aletheia - creates a new LiveKit therapy session
   * POST /connect-livekit
   */
  async connect(
  authToken: string,
  roomName?: string,
  userIdentity?: string
): Promise<ConnectionResponse> {
  try {
    const url = `${API_BASE_URL}/connect-livekit`;

    if (!authToken) {
      throw new Error("Missing auth token for connect-livekit");
    }

    console.log(`🚀 Connecting to Aletheia (LiveKit): ${url}`);

    const body = {
      room: roomName || `therapy-${Date.now()}`,
      identity: userIdentity || `user-${Date.now()}`
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`, // ✅ REQUIRED
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Connection Error ${response.status}:`, errorBody);
      throw new Error(
        `Connection Error: ${response.status} - ${errorBody}`
      );
    }

    const data = await response.json();

    return {
      status: data.status,
      room_url: data.room_url,
      room_name: data.room_name,
      bot_token: data.bot_token,
      user_token: data.user_token,
      token: data.user_token,
      bot_pid: data.bot_pid,
      status_endpoint: data.status_endpoint
    };
  } catch (error) {
    console.error('❌ Error connecting to Aletheia:', error);
    throw error;
  }
},
  /**
   * Check bot status
   * GET /status/{bot_pid}
   */
  async getBotStatus(botPid: number): Promise<BotStatus> {
    try {
      const url = `${API_BASE_URL}/status/${botPid}`;
      
      console.log(`🔍 Checking bot status: ${botPid}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Bot status:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error checking bot status:', error);
      throw error;
    }
  },

  /**
   * Health check
   * GET /health
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const url = `${API_BASE_URL}/health`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { status: 'unknown' };
    }
  },

  /**
   * Get LiveKit token directly (for manual connection)
   * GET /get-livekit-token?room=xxx&identity=xxx
   */
  async getLiveKitToken(room: string, identity: string): Promise<{ token: string; room: string; url: string }> {
    try {
      const url = `${API_BASE_URL}/get-livekit-token?room=${encodeURIComponent(room)}&identity=${encodeURIComponent(identity)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        token: data.token,
        room: data.room,
        url: data.livekit_url
      };
    } catch (error) {
      console.error('❌ Error getting LiveKit token:', error);
      throw error;
    }
  },

  /**
   * Get API base URL (for debugging)
   */
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  /**
   * Update the base URL (for switching between ngrok/local)
   */
  setBaseUrl(url: string): void {
    console.log('🔗 API Base URL updated to:', url);
  }
};

