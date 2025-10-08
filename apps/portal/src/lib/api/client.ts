import { CablePlatformClient, type ApiResponse } from '@cable-platform/client-sdk';
import type { CableDesign, DRCResult, SynthesisProposal, DrcReport } from '../types/api';

// Configure SDK with base URL
const BASE_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? 'http://localhost:8080';

// API client singleton
const sdkApi = new CablePlatformClient(BASE_URL);

// API client singleton
class ApiClient {
  async getHealth(): Promise<ApiResponse<{ status: string }>> {
    // TODO: Add getHealth to CablePlatformClient
    return { ok: false, error: 'Not implemented' };
  }

  async getMe(): Promise<ApiResponse<{ sub: string; roles?: string[] }>> {
    // TODO: Add getMe to CablePlatformClient
    return { ok: false, error: 'Not implemented' };
  }

  async runDRC(body: CableDesign): Promise<ApiResponse<DRCResult>> {
    // TODO: Add runDRC to CablePlatformClient
    return { ok: false, error: 'Not implemented' };
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

  async previewDrc(proposal: SynthesisProposal): Promise<ApiResponse<{ warnings: string[]; errors: string[] }>> {
    return sdkApi.previewDrc(proposal);
  }

  async getDrcReport(assemblyId: string): Promise<ApiResponse<DrcReport>> {
    return sdkApi.getDrcReport(assemblyId);
  }

  async runDrc(assemblyId: string): Promise<ApiResponse<DrcReport>> {
    return sdkApi.runDrc(assemblyId);
  }

  async applyDrcFixes(assemblyId: string, fixIds: string[]): Promise<ApiResponse<DrcReport>> {
    return sdkApi.applyDrcFixes(assemblyId, fixIds);
  }
}

// Export singleton instance
export const api = new ApiClient();