import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { formatCompact, formatCurrency, formatMonth } from '../../lib/format'

// Chart colors mirror the CSS tokens; Recharts needs literal values for SVG attributes.
const ACCENT = '#B8860B'
const ACCENT_SOFT = '#E6CF9C'
const BORDER = '#E8E4DF'
const MUTED_FG = '#6B6B6B'

function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const { month, total } = payload[0].payload as { month: string; total: number }
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 shadow-md">
      <p className="small-caps text-muted-foreground">{formatMonth(month)}</p>
      <p className="figure mt-1 text-lg">{formatCurrency(total)}</p>
    </div>
  )
}

/**
 * Six-month spending trend. One series, one hue: the selected month is full
 * gold, earlier months a softer step of the same gold — emphasis, not identity.
 */
export function TrendChart({ data, selected }: { data: { month: string; total: number }[]; selected: string }) {
  return (
    <figure>
      <div className="h-72" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={BORDER} strokeDasharray="0" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => formatMonth(m, true)}
              tickLine={false}
              axisLine={{ stroke: BORDER }}
              tick={{ fill: MUTED_FG, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              dy={6}
            />
            <YAxis
              tickFormatter={formatCompact}
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fill: MUTED_FG, fontSize: 11, fontFamily: 'IBM Plex Mono' }}
            />
            <Tooltip content={TrendTooltip} cursor={{ fill: 'rgb(184 134 11 / 0.06)' }} />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={48} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.month} fill={d.month === selected ? ACCENT : ACCENT_SOFT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader equivalent of the chart. */}
      <table className="sr-only">
        <caption>Total spending per month</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{formatMonth(d.month)}</th>
              <td>{formatCurrency(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
