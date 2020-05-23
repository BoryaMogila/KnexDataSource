const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: "./test.sqlite"
  }
});

const KnexDataSource = require('./index');

class TestDataSource extends KnexDataSource {
  constructor(knex) {
    super();
    this.db = knex;
  }
  getTestUsers() {
    return this.execute(this.db.select().from('test'), 100)
  }
}


// const Knex = require("knex");
// const { SQLDataSource } = require("./index");

describe("jest", () => {
  test("is configured", async () => {
    const testDataSource = new TestDataSource(knex);
    testDataSource.initialize();
    await expect(await testDataSource.getTestUsers()).toEqual([{ id: 1, name: 'Test' }])
    await knex.destroy()
  });
});
