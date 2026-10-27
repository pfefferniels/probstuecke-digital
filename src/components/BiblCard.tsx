import { Box, Card, CardContent, Chip } from "@mui/material";
import { OccurenceBox } from "./OccurenceBox";
import type { Bibliography, MusicalWork, ExpressionIndexData } from '@/lib/types'

export const BiblCard = ({ work, expressions }: { work: Bibliography | MusicalWork; expressions: ExpressionIndexData[] }) => {
    return (
        <Card id={work.xmlId || 'no-id'} sx={{ p: { xs: 0, sm: 2 } }} elevation={1}>
            <CardContent>
                {/* on phones the occurrences go below */}
                <Box sx={{ float: { sm: 'left' }, mb: { xs: 2, sm: 0 } }}>
                    {work.author && (
                        <span>
                            {work.author.surname}, {work.author.forename}:
                        </span>
                    )}
                    {('editor' in work && work.editor) && (
                        <span>
                            {work.editor.surname}, {work.editor.forename} (ed.):
                        </span>
                    )}{' '}
                    <i>{work.title}</i>
                    {(work.pubPlace || work.date) && (
                        <span>
                            , {work.pubPlace} {work.date}
                        </span>
                    )}.
                    {work.link && (
                        <div>
                            <a href={work.link} target="_blank" rel="noopener noreferrer">
                                <Chip sx={{ m: 1 }} label="→ Source" size='small' color='info' />
                            </a>
                        </div>
                    )}
                </Box>
                <OccurenceBox forId={work.xmlId || ''} expressions={expressions} />
            </CardContent>
        </Card>
    )
};
