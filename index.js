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

  getCacheKey(queryString, ttl= 0) {
    return `sqlcache:${crc.crc32(`${queryString}${!ttl ? '' : `_${ttl}`}`).toString(16)}`
  }

  getQueryString(query) {
    return query.toString()
  }

  getPromise({ query, ttl, cacheString }){
    const cacheKey = this.getCacheKey(cacheString, ttl);
    let promise = this.memoizedResults.get(cacheKey);
    if (promise) return promise;
    if (!ttl) {
      promise = this.getResult(ttl, query, cacheKey);
      this.memoizedResults.set(cacheKey, promise);
      return promise;
    }
    promise = this.cacheQuery(ttl, query, cacheKey);
    this.memoizedResults.set(cacheKey, promise);
    return promise;
  }

  measureStartTime() {
    return process.hrtime()
  }

  measureDuration(startTime) {
    const diff = process.hrtime(startTime)
    return  diff[0] * 1e3 + diff[1] * 1e-6;
  }

  async execute(query, ttl = 0) {
    const cacheString = this.getQueryString(query);
    if (!DEBUG) return this.getPromise({ query, ttl, cacheString });
    const startTime = this.measureStartTime()
    const res = await this.getPromise({ query, ttl, cacheString });
    console.log(cacheString, `(${this.measureDuration(startTime).toFixed(3)} ms);`, `cache time (${ttl} s)`);
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
