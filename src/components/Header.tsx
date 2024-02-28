import React from 'react'
import './Header.css'
import { AppBar, Toolbar, Typography } from '@mui/material'
import { Link } from 'gatsby'

interface HeaderProps {
  title: string
  subtitle: string
}

export const Header = ({ title, subtitle }: HeaderProps) => (
  <div className="header">
    <AppBar sx={{ bgcolor: 'white' }} position='absolute' elevation={1}>
      <Toolbar sx={{ color: 'black' }}>
        <Typography variant="h5" component="div" sx={{ flexGrow: 0 }}>
          <Link to='/' style={{ textDecoration: 'none', color: 'black' }}>
            {title}
          </Link>
        </Typography>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'gray', paddingLeft: 1 }}>
          {subtitle}
        </Typography>
      </Toolbar>
    </AppBar>
    <Toolbar />
  </div>
)

