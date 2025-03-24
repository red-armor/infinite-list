import { ColumnDimensionInfo, GetColumnWidth } from '../types';

export const resolveColumnInfo = (options: {
  width?: number;
  getColumnWidth?: GetColumnWidth;
  column: number;
}) => {
  const { width, getColumnWidth, column } = options;

  const sequence = Array.from({ length: column }, (_, i) => i + 1);
  const nextWidth = width || 0;
  return sequence.reduce<ColumnDimensionInfo[]>((acc, cur, index) => {
    const current = {
      width: getColumnWidth?.(index) || nextWidth / column,
      left: 0,
      right: nextWidth - (getColumnWidth?.(index) || nextWidth / column),
    };
    if (!index) {
      acc.push(current);
      return acc;
    }
    const last = acc[acc.length - 1];
    if (last) {
      current.left = last.left + last.width;
      current.right = nextWidth - current.left - last.width;
    }
    acc.push(current);
    return acc;
  }, []);
};
