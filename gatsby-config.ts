import type { GatsbyConfig } from "gatsby"

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Probstücke Digital`,
    subtitle: 'Digital edition of Johann Matthesons Große Generalbass-Schule',
    siteUrl: `https://www.probstuecke-digital.de`,
  },
  pathPrefix: '',
  graphqlTypegen: true,
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/probstuecke-data/encodings`,
        // Ignore files starting with a dot
        ignore: [`**/\.*`],
        // Use "mtime" and "inode" to fingerprint files (to check if file has changed)
        fastHash: true,
      },
    },
  ],
}

export default config
