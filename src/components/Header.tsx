'use client'

import { type MouseEvent, useState } from 'react'
import './Header.css'
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SearchDialog } from './SearchDialog'

interface HeaderProps {
  title: string
  subtitle: string
}

const indices = [
  { href: '/bibliography/', label: 'Bibliography' },
  { href: '/musicalworks/', label: 'Index of Musical Works' },
  { href: '/persons/', label: 'Index of Persons' },
]

interface DrawerLinkProps {
  href: string
  label: string
  pathname: string
  onNavigate: () => void
}

// Entry of the navigation drawer used on small screens
const DrawerLink = ({ href, label, pathname, onNavigate }: DrawerLinkProps) => (
  <ListItemButton component={Link} href={href} selected={pathname === href} onClick={onNavigate}>
    <ListItemText primary={label} />
  </ListItemButton>
)

export const Header = ({ title, subtitle }: HeaderProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const open = Boolean(anchorEl)
  const closeDrawer = () => setDrawerOpen(false)
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div className="header">
      <AppBar sx={{ bgcolor: 'white' }} position='static' elevation={1}>
        <Toolbar sx={{ color: 'black' }}>
          <Typography
            variant="h5"
            component="div"
            sx={{ flexGrow: 0, paddingRight: 1, fontSize: { xs: '1.3rem', sm: '1.5rem' }, whiteSpace: 'nowrap' }}
          >
            <Link href='/' style={{ textDecoration: 'none', color: 'black' }}>
              {title}
            </Link>
          </Typography>
          {/* too long for phones; the title says enough there */}
          <Typography
            component="div"
            sx={{
              display: { xs: 'none', sm: 'block' },
              flexGrow: 1,
              color: 'gray',
              borderLeft: '1px solid black',
              paddingLeft: 1,
              maxWidth: 300,
              fontSize: { sm: '0.9rem', md: '1rem' },
            }}
          >
            {subtitle}
          </Typography>

          <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, alignSelf: 'stretch', alignItems: 'center' }}>
            <Button color="inherit" component={Link} href="/">
              Overview
            </Button>
            <Divider flexItem orientation='vertical' variant='middle' />
            <Button color="inherit" component={Link} href="/about/">
              About
            </Button>
            <Divider flexItem orientation='vertical' variant='middle' />
            <Button
              color="inherit"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleClick}
            >
              Indices
            </Button>
            <Divider flexItem orientation='vertical' variant='middle' />
            <Button color="inherit" component={Link} href="/guidelines/">
              Edition Guidelines
            </Button>
            <Divider flexItem orientation='vertical' variant='middle' />
          </Box>
          {/* below md: search and menu button at the right edge */}
          <Box sx={{ flexGrow: 1, display: { md: 'none' } }} />
          <SearchDialog />
          <IconButton
            color="inherit"
            edge="end"
            aria-label="Open the navigation"
            aria-controls="navigation-drawer"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

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
            {indices.map(({ href, label }) => (
              <MenuItem key={href} onClick={handleClose}>
                <Link href={href} style={{ textDecoration: 'none', color: 'black' }}>
                  {label}
                </Link>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        id="navigation-drawer"
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
      >
        <Box component="nav" aria-label="Main" sx={{ width: 280, maxWidth: '85vw' }}>
          <Typography sx={{ px: 2, pt: 2, pb: 1, color: 'gray', fontSize: '0.9rem' }}>
            {subtitle}
          </Typography>
          <Divider />
          <List>
            <DrawerLink href="/" label="Overview" pathname={pathname} onNavigate={closeDrawer} />
            <DrawerLink href="/about/" label="About" pathname={pathname} onNavigate={closeDrawer} />
            <DrawerLink href="/guidelines/" label="Edition Guidelines" pathname={pathname} onNavigate={closeDrawer} />
          </List>
          <Divider />
          <List subheader={<ListSubheader disableSticky>Indices</ListSubheader>}>
            {indices.map(index => (
              <DrawerLink key={index.href} {...index} pathname={pathname} onNavigate={closeDrawer} />
            ))}
          </List>
        </Box>
      </Drawer>
    </div>
  )
}
