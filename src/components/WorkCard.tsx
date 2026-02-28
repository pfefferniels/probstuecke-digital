import { Card, Table, TableBody, TableRow, TableCell, tableCellClasses } from "@mui/material"
import { ExpressionList } from './ExpressionList'
import type { WorkExpression, WorkKey } from '@/lib/types'

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

export interface ExpressionsByCategory {
    [index: string]: WorkExpression[]
}

interface WorkCardProps {
    title: string
    incipitSVG: string
    keySignature: WorkKey
    expressions: ExpressionsByCategory
}

export const WorkCard = ({ title, incipitSVG, expressions, keySignature }: WorkCardProps) => {
    return (
        <Card style={{ padding: '1.25rem', borderRadius: '0.25rem' }}>
            <h3 style={{ fontFamily: 'sans-serif', fontWeight: 'normal', paddingBottom: 0 }}>
                <b>{title}</b><span style={{ color: 'gray' }}> · {keySignature.pname?.toUpperCase()}{keySignature.accid === 'f' ? '♭' : keySignature.accid === 's' ? '♯' : ''} {keySignature.mode}</span>
            </h3>

            <div dangerouslySetInnerHTML={{ __html: incipitSVG }} style={{width: '100%'}}/>

            <Table size='small' sx={{
                [`& .${tableCellClasses.root}`]: {
                    borderBottom: "none"
                }
            }}>
                <TableBody>
                    {Object.entries(expressions).map(([category, expressions]) => {
                        return (
                            <TableRow key={category}>
                                <TableCell sx={{ fontWeight: 'bold', width: 0 }}>
                                    {capitalizeFirstLetter(category) + 's'}
                                </TableCell>
                                <TableCell>
                                    <ExpressionList expressions={expressions} />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </Card>
    )
}
