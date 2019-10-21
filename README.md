# gatsby-source-rss-feed


Source plugin for pulling data into Gatsby from RSS feed.

## Install

```bash
npm install --save gatsby-source-mutiple-rss
```

or

```bash
yarn add gatsby-source-multiple-rss
```

## How to use

```js
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-multiple-rss`,
      options: {
        urls: [`https://www.gatsbyjs.org/blog/rss.xml`],
        name: `GatsbyBlog`,
        // Optional
        // Read parser document: https://github.com/bobby-brennan/rss-parser#readme
        parserOption: {
          customFields: {
            item: ['itunes:duration']
          }
        }
      }
    }
  ]
}
```

## How to query

Query is `Feed${name}`.

When name of options is `GatsbyBlog`, query named as `FeedGatsbyBlog`.

```graphql
{
  allFeedGatsbyBlog {
    edges {
      node {
        title
        link
        content
      }
    }
  }

  feedGatsbyBlog {
    title
    link
    content
  }
}
```
