import { Card, CardContent, List, ListItem, ListItemText, Typography } from "@mui/material"
import Link from 'next/link'
import type { ExpressionIndexData } from '@/lib/types'

interface OccurenceBoxProps {
    forId: string
    expressions: ExpressionIndexData[]
}

export const OccurenceBox = ({ forId, expressions }: OccurenceBoxProps) => {
    // maps expressionId to all xml:ids of elements mentioning the given ID
    // (a person, work etc.) inside that expression
    const mentions = new Map<string, string[]>()

    for (const expression of expressions) {
        if (!expression.indexRefs || !expression.expressionId) continue

        for (const indexRef of expression.indexRefs) {
            if (forId !== indexRef.corresp) continue

            if (mentions.has(expression.expressionId)) {
                mentions.get(expression.expressionId)?.push(indexRef.xmlId || '[no-id]')
            }
            else {
                mentions.set(expression.expressionId, [indexRef.xmlId || '[no-id]'])
            }
        }
    }

    if (mentions.size === 0) return null

    return (
        <Card style={{ float: 'right', marginBottom: '1rem' }} elevation={7}>
            <CardContent>
                <Typography variant="h6">Mentioned in …</Typography>
                <List>
                    {Array.from(mentions).map(([expressionId, xmlIds]) => {
                        return (
                            <ListItem key={expressionId}>
                                <ListItemText
                                    primary={expressionId}
                                    secondary={
                                        <>
                                            Occurrences:{" "}
                                            {xmlIds.map((xmlId, i) => (
                                                <Link key={xmlId} href={`/${expressionId}#${xmlId}`}>
                                                    [{i + 1}]{i !== xmlIds.length - 1 && ", "}
                                                </Link>
                                            ))}
                                        </>
                                    }
                                />
                            </ListItem>
                        )
                    })}
                </List>
            </CardContent>
        </Card>
    )
}
