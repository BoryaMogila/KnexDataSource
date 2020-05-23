# KnexDataSource

This package combines the power of [Knex] with the ease of use of [Apollo DataSources].

## Getting Started

### Installation

To install KnexDataSource: `npm i datasource-knex`

And the peer dependencies (if you do not have them already): `npm i knex graphql`

### Usage

```js
const KnexDataSource = require("datasource-knex");

const MINUTE = 60;

class MyDatabase extends KnexDataSource {
  constructor(db) {
    super();
    // Add your instance of Knex to the DataSource
    this.db = db;
  }

  getUsers() {
    this.execute(this.db.select().from("users"), MINUTE);
  }
}
```

And use it in your Apollo server configuration:

```js
const Knex = require("knex");

const knex = Knex({
  client: "pg",
  connection: {
    /* CONNECTION INFO */
  }
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache,
  context,
  dataSources: () => ({
    db: new MyDatabase(knex)
  })
});
```

## execute method

If you were to make the same query over the course of multiple requests to your server you could also be making needless requests to your server - especially for expensive queries.

### Batching
Batching work by default is you use `execute`

### Caching
Apollo's caching strategy is implemented using the `execute` method with second optional parameter
 **ttlInSeconds**.

This method accepts two parameters:

- `knexQuery`: <knexObject> A knex object that has not been then'd
- `ttlInSeconds`: <Number> number of seconds to keep cached results

### initialize

KnexDataSource implement `initialize` for inject Apollo Server context and cache to instance of
source and clear batching object.

Note: If no cache is configured, an [InMemoryLRUCache] cache is used.

## KnexDataSource

KnexDataSource is an ES6 Class that can be extended to make a new KnexDataSource and extends Apollo's
base DataSource class under the hood.

( See the Usage section above for an example )

Like all DataSources, KnexDataSource has an initialize method that Apollo will call when a new
 request is routed.

The initialize call accepts a configuration object with a cache and context.

If no cache is provided in your Apollo configuration, KnexDataSource falls back to an
 InMemoryLRUCache like the [RESTDataSource].

### context

The context from your Apollo server is available as `this.context`.

### db

The instance of knex you reference in the constructor is made available as `this.db`.

### Debug mode

To enable more enhanced logging, set DEBUG=true in your environment variables.

## Contributing

All contributions are welcome!

Please open an issue or pull request.

[knex]: https://knexjs.org/
[apollo datasources]: https://www.apollographql.com/docs/apollo-server/features/data-sources.html
[dataloader]: https://github.com/facebook/dataloader
[inmemorylrucache]: https://github.com/apollographql/apollo-server/tree/master/packages/apollo-server-caching
[restdatasource]: https://www.apollographql.com/docs/apollo-server/features/data-sources.html#REST-Data-Source
