import { Card, CardContent, Chip } from "@mui/material";
import { OccurenceBox } from "./OccurenceBox";
import React from "react";

export const BiblCard = ({ work }: { work: Queries.bibliography | Queries.musicalWork }) => {
    return (
        <Card id={work.xmlId || 'no-id'} sx={{ p: 2 }} elevation={1}>
            <CardContent>
                <div style={{ float: 'left' }}>
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
                </div>
                <OccurenceBox forId={work.xmlId || ''} />
            </CardContent>
        </Card>
    )
};
