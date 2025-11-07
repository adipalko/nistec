export interface Station {
  name: string;
  expectedDate?: string;
  internalPriority?: string;
  rank?: number;
  score?: number;
  priorityScore?: number;
}

export interface FileUploadProps {
  onFileProcessed: (stations: Station[]) => void;
  isProcessing: boolean;
}

export interface ResultsTableProps {
  stations: Station[];
  isLoading: boolean;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export interface ExportButtonProps {
  data: Station[];
  disabled: boolean;
  fileName?: string;
}

export interface GenerateButtonProps {
  onGenerate: () => void;
  disabled: boolean;
  isProcessing: boolean;
}