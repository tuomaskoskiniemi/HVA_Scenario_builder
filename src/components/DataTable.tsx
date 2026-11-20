export interface Cell {
  text: string;
  bold?: boolean;
  /** Not available / not published: rendered muted. */
  na?: boolean;
  /** Free-text remark column. */
  note?: boolean;
}

export interface TableData {
  head: string[];
  body: Cell[][];
  foot: Cell[][];
}

/** Municipality statistics table: striped body, totals in the footer, scrolls horizontally on narrow screens. */
export function DataTable({ data, caption }: { data: TableData; caption: string }) {
  const lastIsNote = data.body[0]?.[data.body[0].length - 1]?.note;
  const cls = (c: Cell) => [c.bold && 'bold', c.na && 'na', c.note && 'note'].filter(Boolean).join(' ') || undefined;
  return (
    <div className="table-scroll">
      <table className="kt">
        <caption className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {caption}
        </caption>
        <thead>
          <tr>
            {data.head.map((h, i) => (
              <th key={i} scope="col" className={lastIsNote && i === data.head.length - 1 ? 'left' : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.body.map((row, r) => (
            <tr key={r}>
              {row.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row" className={cls(c)} style={{ fontSize: 14, fontWeight: c.bold ? 600 : 400, color: 'inherit', border: 0, borderBottom: '1px solid var(--rule)', padding: 9, verticalAlign: 'middle' }}>
                    {c.text}
                  </th>
                ) : (
                  <td key={i} className={cls(c)}>
                    {c.text}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {data.foot.map((row, r) => (
            <tr key={r}>
              {row.map((c, i) => (
                <td key={i} className={cls(c)}>
                  {c.text}
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}
