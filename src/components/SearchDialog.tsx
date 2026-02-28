'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

interface PagefindResult {
  id: string
  url: string
  excerpt: string
  meta: { title?: string }
}

interface PagefindResponse {
  results: { id: string; data: () => Promise<PagefindResult> }[]
}

interface Pagefind {
  init: () => Promise<void>
  search: (query: string) => Promise<PagefindResponse>
}

export const SearchDialog = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pagefindRef = useRef<Pagefind | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const loadPagefind = useCallback(async () => {
    if (pagefindRef.current) return pagefindRef.current
    try {
      const pf = await import(
        // @ts-expect-error — generated at build time
        /* webpackIgnore: true */ '/pagefind/pagefind.js'
      )
      await pf.init()
      pagefindRef.current = pf as Pagefind
      return pf as Pagefind
    } catch {
      setError('Search index not available. Run a production build first.')
      return null
    }
  }, [])

  const handleOpen = useCallback(() => {
    setOpen(true)
    loadPagefind()
  }, [loadPagefind])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  // Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) handleClose()
        else handleOpen()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, handleOpen, handleClose])

  // Search on query change (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const pf = await loadPagefind()
      if (!pf) return

      setLoading(true)
      try {
        const response = await pf.search(query)
        const loaded = await Promise.all(
          response.results.slice(0, 20).map((r) => r.data())
        )
        setResults(loaded)
      } catch {
        setError('Search failed.')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, loadPagefind])

  return (
    <>
      <IconButton color="inherit" aria-label="search" onClick={handleOpen}>
        <SearchIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { minHeight: 300 } },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>Search</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search across all texts…"
            variant="outlined"
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mt: 1, mb: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {loading && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Searching…
            </Typography>
          )}

          {!loading && !error && query.trim() && results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No results found.
            </Typography>
          )}

          {results.length > 0 && (
            <List dense disablePadding>
              {results.map((r) => (
                <ListItemButton
                  key={r.id}
                  component="a"
                  href={r.url}
                  onClick={handleClose}
                >
                  <ListItemText
                    primary={r.meta.title || r.url}
                    secondary={
                      <span dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
