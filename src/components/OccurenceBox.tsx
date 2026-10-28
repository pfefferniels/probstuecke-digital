import { Typography } from "@mui/material"
import Link from 'next/link'
import { Fragment } from "react"
import { longLabel, versionLabel } from '@/lib/expressionLabels'
import type { ExpressionIndexData } from '@/lib/types'

interface OccurenceBoxProps {
    forId: string
    expressions: ExpressionIndexData[]
}

interface Mentions {
    expression: ExpressionIndexData
    // the xml:ids of the elements in the text that mention the person, work etc.
    xmlIds: (string | null)[]
}

const mentionHref = (expressionId: string, xmlId: string | null) =>
    `/${expressionId}/${xmlId ? `#${xmlId}` : ''}`

// A version of a Probstück (e.g. "1731" or "Lesson by Hill"), linking to the mention in it; several mentions get a link each
const Version = ({ expression, xmlIds }: Mentions) => {
    const { expressionId, context } = expression
    const label = context ? versionLabel(context.expression) : 'Text'
    const title = context ? longLabel(context.expression) : expression.label || label

    if (xmlIds.length === 1) {
        return <Link href={mentionHref(expressionId!, xmlIds[0])} title={title}>{label}</Link>
    }

    return (
        <>
            {label}:{' '}
            {xmlIds.map((xmlId, i) => (
                <Fragment key={i}>
                    {i > 0 && ' '}
                    <Link
                        href={mentionHref(expressionId!, xmlId)}
                        className="mention"
                        aria-label={`${title}, mention ${i + 1}`}
                    >
                        {i + 1}
                    </Link>
                </Fragment>
            ))}
        </>
    )
}

/** Where a person, work etc. is mentioned, by Probstück, e.g. "Probstück 6   1719 · 1731 · English" */
export const OccurenceBox = ({ forId, expressions }: OccurenceBoxProps) => {
    // the expressions come in the order of the Probstücke and their versions
    const byWork = new Map<string, Mentions[]>()

    for (const expression of expressions) {
        if (!expression.expressionId) continue

        const xmlIds = expression.indexRefs
            .filter(indexRef => indexRef.corresp === forId)
            .map(indexRef => indexRef.xmlId)
        if (xmlIds.length === 0) continue

        const work = expression.context?.workTitle || expression.label || expression.expressionId
        byWork.set(work, [...(byWork.get(work) || []), { expression, xmlIds }])
    }

    if (byWork.size === 0) return null

    return (
        <>
            <Typography variant="subtitle2" component="h4" color="text.secondary" sx={{ mt: 2 }}>
                Mentioned in
            </Typography>
            <Typography component="ul" variant="body2" className="mentions">
                {Array.from(byWork).map(([work, versions]) => (
                    <li key={work}>
                        <span>{work}</span>
                        <span>
                            {versions.map((mentions, i) => (
                                <Fragment key={mentions.expression.expressionId}>
                                    {i > 0 && <span className="sep"> · </span>}
                                    <Version {...mentions} />
                                </Fragment>
                            ))}
                        </span>
                    </li>
                ))}
            </Typography>
        </>
    )
}
