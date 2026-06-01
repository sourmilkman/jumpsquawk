export type HealthState = {
  ok: boolean;
  realtimeReady: boolean;
  model?: string;
  voice?: string;
};

export async function getGatewayHealth(gatewayUrl: string): Promise<HealthState> {
  const base = gatewayUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/health`);

  if (!response.ok) {
    throw new Error("Gateway health check failed.");
  }

  return response.json();
}
