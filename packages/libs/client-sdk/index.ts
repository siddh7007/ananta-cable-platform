// Generated SDK from OpenAPI specification
import type {
  ConnectorSummary,
  ConnectorMetadata,
  AssemblyDraft,
  AssemblyDraftResponse,
  NotesPack,
  LocaleColors,
  Region,
  SynthesisProposal
} from '../types/api';

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class CablePlatformClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:8080', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async searchConnectors(q: string, limit: number = 20): Promise<ApiResponse<ConnectorSummary[]>> {
    const params = new URLSearchParams({ q, limit: limit.toString() });
    return this.request<ConnectorSummary[]>(`/v1/md/search/connectors?${params}`);
  }

  async getConnector(mpn: string): Promise<ApiResponse<ConnectorMetadata>> {
    return this.request<ConnectorMetadata>(`/v1/md/connector/${mpn}`);
  }

  async saveDraftStep1(
    body: AssemblyDraft,
    idempotencyKey: string
  ): Promise<ApiResponse<AssemblyDraftResponse>> {
    return this.request<AssemblyDraftResponse>('/v1/assemblies/draft', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
    });
  }

  async getNotesPacks(): Promise<ApiResponse<NotesPack[]>> {
    return this.request<NotesPack[]>('/v1/presets/notes-packs');
  }

  async getLocaleColors(region: Region): Promise<ApiResponse<LocaleColors>> {
    const params = new URLSearchParams({ region });
    return this.request<LocaleColors>(`/v1/assist/locale-colors?${params}`);
  }

  async proposeSynthesis(draftId: string): Promise<ApiResponse<SynthesisProposal>> {
    return this.request<SynthesisProposal>('/v1/synthesis/propose', {
      method: 'POST',
      body: JSON.stringify({ draft_id: draftId }),
    });
  }

  async acceptSynthesis(proposalId: string, locks?: string[]): Promise<ApiResponse<{ assembly_id: string; schema_hash: string }>> {
    return this.request<{ assembly_id: string; schema_hash: string }>('/v1/synthesis/accept', {
      method: 'POST',
      body: JSON.stringify({ proposal_id: proposalId, locks }),
    });
  }

  async recomputeSynthesis(draftId: string, locks?: string[]): Promise<ApiResponse<SynthesisProposal>> {
    return this.request<SynthesisProposal>('/v1/synthesis/recompute', {
      method: 'POST',
      body: JSON.stringify({ draft_id: draftId, locks }),
    });
  }

  async previewDrc(proposal: SynthesisProposal): Promise<ApiResponse<{ warnings: string[]; errors: string[] }>> {
    return this.request<{ warnings: string[]; errors: string[] }>('/v1/drc/preview', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  }
}

// Export singleton instance
export const api = new CablePlatformClient();

// Export class for custom instances
export { CablePlatformClient };
export default CablePlatformClient;
