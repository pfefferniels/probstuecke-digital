'use client'

import { useEffect, useRef, useState } from 'react'
import { Box, Button, Typography } from '@mui/material'

interface CitationBoxProps {
    /** citation without access date and final full stop */
    citation: string
}

export const CitationBox = ({ citation }: CitationBoxProps) => {
    const [accessed, setAccessed] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const textRef = useRef<HTMLParagraphElement>(null)

    // the site is built ahead of time, so the access date is set in the browser
    useEffect(() => {
        setAccessed(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
    }, [])

    const fullCitation = accessed ? `${citation} (accessed ${accessed}).` : `${citation}.`

    const selectText = () => {
        const el = textRef.current
        if (!el) return
        const range = document.createRange()
        range.selectNodeContents(el)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
    }

    const handleCopy = () => {
        if (!navigator.clipboard) {
            selectText()
            return
        }
        navigator.clipboard
            .writeText(fullCitation)
            .then(() => setCopied(true))
            .catch(selectText)
    }

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 }}>
            <Typography ref={textRef} variant="body2" sx={{ flex: '1 1 20rem', minWidth: 0, overflowWrap: 'anywhere' }}>
                {fullCitation}
            </Typography>
            <Button size="small" variant="outlined" onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy citation'}
            </Button>
        </Box>
    )
}
