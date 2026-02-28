'use client'

import { type MouseEvent, useState } from 'react'
import './Header.css'
import { AppBar, Button, Divider, Menu, MenuItem, Toolbar, Typography } from '@mui/material'
import Link from 'next/link'
import { SearchDialog } from './SearchDialog'

interface HeaderProps {
  title: string
  subtitle: string
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }


  return (
    <div className="header">
      <AppBar sx={{ bgcolor: 'white' }} position='absolute' elevation={1}>
        <Toolbar sx={{ color: 'black' }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 0, paddingRight: 1 }}>
            <Link href='/' style={{ textDecoration: 'none', color: 'black' }}>
              {title}
            </Link>
          </Typography>
          <Typography component="div" sx={{ flexGrow: 1, color: 'gray', borderLeft: '1px solid black', paddingLeft: 1, maxWidth: 300 }}>
            {subtitle}
          </Typography>

            <Button
            color="inherit"
            aria-label="menu"
            onClick={() => window.open('/', '_self')}
            >
              Overview
            </Button>
          <Divider flexItem orientation='vertical' variant='middle' />
          <Button
            color="inherit"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleClick}
          >
            Indices
          </Button>
          <Divider flexItem orientation='vertical' variant='middle' />
          <Button
            color="inherit"
            aria-label="menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={() => window.open('/guidelines', '_self')}
          >
            Edition Guidelines
          </Button>
          <Divider flexItem orientation='vertical' variant='middle' />
          <SearchDialog />

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <Link href='/bibliography' style={{ textDecoration: 'none', color: 'black' }}>
                Bibliography
              </Link>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Link href='/musicalworks' style={{ textDecoration: 'none', color: 'black' }}>
                Index of Musical Works
              </Link>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Link href='/persons' style={{ textDecoration: 'none', color: 'black' }}>
                Index of Persons
              </Link>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </div>
  )
}
