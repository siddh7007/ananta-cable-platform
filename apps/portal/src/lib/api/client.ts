import { CablePlatformClient, type ApiResponse } from '@cable-platform/client-sdk';
import type { 
  SynthesisProposal, 
  DrcReport,
  TemplatePack,
  RenderRequest,
  RenderResponse,
  AssemblyStep1
} from '../types/api';

// Configure SDK with base URL
const BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

// API client singleton
const sdkApi = new CablePlatformClient(BASE_URL);

// API client singleton
class ApiClient {
  async getHealth(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async getMe(): Promise<ApiResponse<{ sub: string; roles?: string[] }>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/me`);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async proposeSynthesis(draftId: string): Promise<ApiResponse<SynthesisProposal>> {
    return sdkApi.proposeSynthesis(draftId);
  }

  async recomputeSynthesis(draftId: string, locks?: Record<string, string>): Promise<ApiResponse<SynthesisProposal>> {
    return sdkApi.recomputeSynthesis(draftId, locks ? Object.values(locks) : undefined);
  }

  async acceptSynthesis(proposalId: string, locks?: Record<string, string>): Promise<ApiResponse<{ assembly_id: string; schema_hash: string }>> {
    return sdkApi.acceptSynthesis(proposalId, locks ? Object.values(locks) : undefined);
  }

  async createDraft(draft: AssemblyStep1): Promise<ApiResponse<{ draft_id: string; status: string; updated_at: string }>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/assemblies/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async previewDrc(proposal: SynthesisProposal): Promise<ApiResponse<{ warnings: string[]; errors: string[] }>> {
    return sdkApi.previewDrc(proposal);
  }

  async getDrcReport(assemblyId: string): Promise<ApiResponse<DrcReport>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/assemblies/${assemblyId}/drc`);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async runDrc(assemblyId: string): Promise<ApiResponse<DrcReport>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/assemblies/${assemblyId}/drc`, {
        method: 'POST'
      });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async applyDrcFixes(assemblyId: string, fixIds: string[]): Promise<ApiResponse<DrcReport>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/assemblies/${assemblyId}/drc/fixes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixIds })
      });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async listTemplatePacks(): Promise<ApiResponse<TemplatePack[]>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/template-packs`);
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async renderAssembly(request: RenderRequest): Promise<ApiResponse<RenderResponse>> {
    try {
      const response = await fetch(`${BASE_URL}/v1/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

// Export singleton instance
export const api = new ApiClient();