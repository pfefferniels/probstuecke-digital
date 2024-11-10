import { Link } from "gatsby"
import React from "react"

interface ExpressionListProps {
    expressions: Queries.workExpressions[]
}

export const ExpressionList = ({ expressions }: ExpressionListProps) => {
    return (
        expressions.map((expression, i) => {
            return (
                <>
                    <Link key={expression.id} to={`${expression.referringTo}`}>
                        {expression.type === 'edition'
                            ? expression.date
                            : expression.lang}
                    </Link>
                    {(i !== expressions.length - 1) &&
                        <span style={{ color: 'gray', marginLeft: 2, marginRight: 2 }}>·</span>}
                </>
            )
        })
    )
}