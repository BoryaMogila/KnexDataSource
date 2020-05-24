const { InMemoryLRUCache } = require("apollo-server-caching");
const { DataSource } = require("apollo-datasource");
const crc = require('crc')

const { DEBUG } = process.env;

class KnexDataSource extends DataSource {
  constructor(props) {
    super(props);
    this.cache = new InMemoryLRUCache();
    this.memoizedResults = new Map();
  }
  initialize(config = {}) {
    this.memoizedResults = new Map();
    this.context = config.context;
    this.cache = config.cache || this.cache;
    if (!this.db) throw configError;
  }

  getCacheKey(queryString) {
    return crc.crc32(`${queryString}`).toString(16)
  }

  getCacheString(ttl = 0, query) {
    return `${query.toString()}${!ttl ? '' : `_${ttl}`}`
  }

  getPromise({ query, ttl, cacheString }){
    const cacheKey = this.getCacheKey(cacheString);
    let promise = this.memoizedResults.get(cacheKey);
    if (promise) return promise;
    if (!ttl) {
      promise = this.getResult(ttl, query, cacheKey);
      this.memoizedResults.set(cacheKey, this.getResult(ttl, query, cacheKey));
      return promise;
    }
    promise = this.cacheQuery(ttl, query, cacheKey);
    this.memoizedResults.set(cacheKey, promise);
    return promise;
  }

  async execute(query, ttl = 0) {
    const cacheString = this.getCacheString(ttl, query);
    if (!DEBUG) return this.getPromise({ query, ttl, cacheString });
    console.time(cacheString);
    const res = await this.getPromise({ query, ttl, cacheString });
    console.timeEnd(cacheString);
    return res;
  }

  getResult(ttl = 0, query, cacheKey) {
    return query.then(rows => {
      if (!ttl || !rows) return Promise.resolve(rows);
      this.cache.set(cacheKey, JSON.stringify(rows), { ttl });
      return Promise.resolve(rows);
    });
  }

  cacheQuery(ttl = 0, query, cacheKey) {
    return this.cache.get(cacheKey).then(entry => {
      if (entry) return Promise.resolve(JSON.parse(entry));
      return this.getResult(ttl, query, cacheKey);
    });
  }
}

module.exports = KnexDataSource;
