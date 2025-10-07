import { DefaultService } from '@cable-platform/client-sdk';
import { wrapSdkCall, type ApiResponse } from './http';
import type { CableDesign, DRCResult } from '../types/api';

// API client singleton
class ApiClient {
  async getHealth(): Promise<ApiResponse<{ status: string }>> {
    return wrapSdkCall(DefaultService.getHealth());
  }

  async getMe(): Promise<ApiResponse<{ sub: string; roles?: string[] }>> {
    return wrapSdkCall(DefaultService.getV1Me());
  }

  async runDRC(body: CableDesign): Promise<ApiResponse<DRCResult>> {
    return wrapSdkCall(DefaultService.postV1DrcRun(body));
  }
}

// Export singleton instance
export const api = new ApiClient();