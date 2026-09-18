import type { RemType } from '@remnote/plugin-sdk';

export interface ExportNode {
  id: string;
  frontMarkdown: string;
  backMarkdown?: string;
  isCardItem: boolean;
  remType: RemType;
  fontSize?: 'H1' | 'H2' | 'H3';
  practiceDirection: 'forward' | 'backward' | 'none' | 'both';
  children: ExportNode[];
}
