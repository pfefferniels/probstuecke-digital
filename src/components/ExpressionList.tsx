import Link from 'next/link'
import { Fragment } from "react"
import type { WorkExpression } from '@/lib/types'

interface ExpressionListProps {
    expressions: WorkExpression[]
}

export const ExpressionList = ({ expressions }: ExpressionListProps) => {
    return (
        expressions.map((expression, i) => {
            return (
                <Fragment key={expression.id}>
                    <Link href={`${expression.referringTo}`}>
                        {expression.type === 'edition'
                            ? expression.date
                            : expression.author !== ''
                                ? expression.author
                                : expression.lang
                        }
                    </Link>
                    {(i !== expressions.length - 1) &&
                        <span style={{ color: 'gray', marginLeft: 2, marginRight: 2 }}>·</span>}
                </Fragment>
            )
        })
    )
}
