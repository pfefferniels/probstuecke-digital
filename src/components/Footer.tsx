import React from "react"
import Container from "@mui/material/Container"
import { Box, Typography } from "@mui/material"

const styles = {
  footer: {
    backgroundColor: "#efefef",
    padding: "1rem 0",
    borderTop: "1px solid #dadada",
    fontSize: "1rem"
  }
}

export const Footer = () => (
  <Box component="footer" sx={styles.footer}>
    <Container maxWidth="lg">
      <Typography>
        The open source code for this collection is available at <a href='https://github.com/digimuwi/lma-digital'>https://github.com/pfefferniels/probstuecke-data</a>.
      </Typography>
      <Typography>
        © {new Date().getFullYear()}
      </Typography>
    </Container>
  </Box>
)
