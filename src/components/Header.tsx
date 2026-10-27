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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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

// usePathname() may or may not carry the trailing slash of our hrefs
const isCurrent = (pathname: string, href: string) =>
  pathname === href || `${pathname}/` === href

// Underlines the entry of the page currently shown
const navButtonSx = {
  textTransform: 'none',
  fontSize: '1rem',
  px: 1.5,
  whiteSpace: 'nowrap',
  '&[aria-current="page"], &.current': {
    textDecoration: 'underline',
    textDecorationThickness: 2,
    textUnderlineOffset: 6,
  },
}

interface NavButtonProps {
  href: string
  label: string
  pathname: string
}

const NavButton = ({ href, label, pathname }: NavButtonProps) => (
  <Button
    color="inherit"
    component={Link}
    href={href}
    aria-current={isCurrent(pathname, href) ? 'page' : undefined}
    sx={navButtonSx}
  >
    {label}
  </Button>
)

interface DrawerLinkProps {
  href: string
  label: string
  pathname: string
  onNavigate: () => void
}

// Entry of the navigation drawer used on small screens
const DrawerLink = ({ href, label, pathname, onNavigate }: DrawerLinkProps) => (
  <ListItemButton component={Link} href={href} selected={isCurrent(pathname, href)} onClick={onNavigate}>
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
      <AppBar
        position='static'
        elevation={0}
        sx={{ bgcolor: 'white', color: 'black', borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* title with the subtitle beneath it, both linking home */}
          <Box
            component={Link}
            href='/'
            sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, color: 'inherit', textDecoration: 'none' }}
          >
            <Typography
              component="span"
              sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              {title}
            </Typography>
            {/* too long for phones; the title says enough there */}
            <Typography
              component="span"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'text.secondary',
                fontSize: '0.85rem',
                lineHeight: 1.3,
                textWrap: 'balance',
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box component="nav" aria-label="Main" sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <NavButton href="/" label="Overview" pathname={pathname} />
            <NavButton href="/about/" label="About" pathname={pathname} />
            <Button
              color="inherit"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              aria-expanded={open}
              onClick={handleClick}
              endIcon={<ExpandMoreIcon />}
              className={indices.some(({ href }) => isCurrent(pathname, href)) ? 'current' : undefined}
              sx={{ ...navButtonSx, '& .MuiButton-endIcon': { ml: 0.25 } }}
            >
              Indices
            </Button>
            <NavButton href="/guidelines/" label="Edition Guidelines" pathname={pathname} />
          </Box>
          {/* below md: search and menu button at the right edge */}
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
              <MenuItem
                key={href}
                component={Link}
                href={href}
                selected={isCurrent(pathname, href)}
                onClick={handleClose}
              >
                {label}
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
