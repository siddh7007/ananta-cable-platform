// Re-export types from the client SDK for cleaner imports
export type CableDesign = {
  id: string;
  name: string;
  cores: number;
};

export type DRCResult = {
  design_id: string;
  findings: Array<{
    code: string;
    message: string;
    severity: 'info' | 'warn' | 'error';
    path?: string;
  }>;
  severity_summary: {
    info?: number;
    warn?: number;
    error?: number;
  };
};