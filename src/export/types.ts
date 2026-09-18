export interface ExportNode {
  id: string;
  frontMarkdown: string;
  backMarkdown?: string;
  isCardItem: boolean;
  children: ExportNode[];
}
