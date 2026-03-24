export type ToolType = 
  | 'pdf-to-word' 
  | 'ppt-to-pdf' 
  | 'word-to-pdf' 
  | 'pdf-merge' 
  | 'image-to-pdf' 
  | 'add-watermark'
  | 'ai-analyzer';

export interface Tool {
  id: ToolType;
  title: string;
  description: string;
  icon: string;
  color: string;
}
