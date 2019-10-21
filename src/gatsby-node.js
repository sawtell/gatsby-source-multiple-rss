import crypto from 'crypto'
import Parser from 'rss-parser'
import omitBy from 'lodash/omitBy'

const normalize = (item) => {
  const namespaceMatched = Object.keys(item).filter(e => e.match(/:/))
  if (namespaceMatched.length === 0) {
    return item
  }

  let namespaced = {}
  namespaceMatched.forEach(key => {
    const [namespace, childKey] = key.split(":")
    if (!namespaced[namespace]) {
      namespaced[namespace] = {}
    }
    namespaced[namespace][childKey] = item[key]
  })

  return {
    ...omitBy(item, (_, key) => key.match(/:/)),
    ...namespaced,
  }
}

const renameSymbolMap = {
  _: 'text',
  $: 'attrs',
}

const renameSymbolKeys = (obj) => {
  Object.keys(obj).forEach(key => {
    if (typeof　obj[key] === 'object') {
      renameSymbolKeys(obj[key])
    }
    if (renameSymbolMap[key]) {
      obj[renameSymbolMap[key]] = obj[key]
      delete obj[key]
    }
  })
}


const createContentDigest = obj =>
  crypto
    .createHash(`md5`)
    .update(JSON.stringify(obj))
    .digest(`hex`)

exports.sourceNodes = async ({
  actions,
  createNodeId
}, {
  urls,
  name,
  parserOption = {}
}) => {
  if (!urls) {
    throw new Error('urls is required.')
  }

  if (!name) {
    throw new Error('name is required.')
  }

  const { createNode } = actions
  const parser = new Parser(parserOption)

  const mapLoop = async _ => {
    const promises = urls.map(async url => {
      return await parser.parseURL(url);
    });
    const feeds = await Promise.all(promises);
    feeds.forEach(feed => {
      // Clone the feed object
      const feedMeta = JSON.parse(JSON.stringify(feed));
      delete feedMeta.items;
      const normalizedMeta = normalize(feedMeta);
      renameSymbolKeys(normalizedMeta);
      let feedChildren = [];
      feed.items.forEach(item => {
        const nodeId = createNodeId(item.link);
        feedChildren.push(nodeId);
        const normalizedItem = normalize(item);
        renameSymbolKeys(normalizedItem);
        createNode({ ...normalizedItem,
          id: nodeId,
          parent: null,
          children: [],
          internal: {
            contentDigest: createContentDigest(item),
            type: `Feed${name}Items`
          }
        });
      });
      createNode({ ...normalizedMeta,
        id: createNodeId(feedMeta.feedUrl),
        parent: null,
        children: feedChildren,
        internal: {
          contentDigest: createContentDigest(feedMeta),
          type: `Feed${name}`
        }
      });
    });
  };

  await mapLoop();
}
