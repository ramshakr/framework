import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { print } from 'graphql';
import asyncFactsMutationStr from 'navi-data/gql/mutations/async-facts.graphql';
import asyncFactsCancelMutationStr from 'navi-data/gql/mutations/async-facts-cancel.graphql';
import asyncFactsQueryStr from 'navi-data/gql/queries/async-facts.graphql';
import exportFactsQueryStr from 'navi-data/gql/queries/export-facts.graphql';
import Pretender from 'pretender';
import config from 'ember-get-config';
import moment from 'moment';
import ElideFactsAdapter, { getElideField } from 'navi-data/adapters/facts/elide';
import type { Filter, RequestV2 } from 'navi-data/adapters/facts/interface';
import type MetadataModelRegistry from 'navi-data/models/metadata/registry';
import { taskFor } from 'ember-concurrency-ts';

const HOST = config.navi.dataSources[2].uri;
const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const TestRequest: RequestV2 = {
  table: 'table1',
  columns: [
    { field: 'table1.m1', type: 'metric', parameters: {} },
    { field: 'table1.m2', type: 'metric', parameters: {} },
    { field: 'table1.r', type: 'metric', parameters: { p: '123' } },
    { field: 'table1.d1', type: 'dimension', parameters: {} },
    { field: 'table1.d2', type: 'dimension', parameters: {} },
  ],
  filters: [
    { field: 'table1.d3', operator: 'in', values: ['v1', 'v2'], type: 'dimension', parameters: {} },
    { field: 'table1.d4', operator: 'in', values: ['v3', 'v4'], type: 'dimension', parameters: {} },
    { field: 'table1.d5', operator: 'isnull', values: [true], type: 'dimension', parameters: {} },
    {
      field: 'table1.time',
      operator: 'gte',
      values: ['2015-01-03'],
      type: 'timeDimension',
      parameters: { grain: 'day' },
    },
    {
      field: 'table1.time',
      operator: 'lt',
      values: ['2015-01-04'],
      type: 'timeDimension',
      parameters: { grain: 'day' },
    },
    { field: 'table1.m1', operator: 'gt', values: ['0'], type: 'metric', parameters: {} },
  ],
  sorts: [{ field: 'table1.d1', parameters: {}, type: 'dimension', direction: 'asc' }],
  limit: 10000,
  requestVersion: '2.0',
  dataSource: 'elideOne',
};

let Server: Pretender;

module('Unit | Adapter | facts/elide', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    Server = new Pretender();
  });

  hooks.afterEach(function () {
    Server.shutdown();
  });

  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:facts/elide');
    assert.ok(adapter, 'elide-fact adapter exists');
  });

  test('getElideField', function (assert) {
    assert.equal(getElideField('foo', { bar: 'baz' }), 'foo(bar:"baz")', 'Field with parameter is not supported');
    assert.equal(
      getElideField('foo', { bar: 'baz', bang: 'boom' }),
      'foo(bar:"baz", bang:"boom")',
      'Field with multiple parameters is formatted correctly'
    );
    assert.equal(getElideField('foo'), 'foo', 'Name is returned for field with no parameters');
  });

  test('dataQueryFromRequest', function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const queryStr = adapter['dataQueryFromRequest'](TestRequest);
    assert.equal(
      queryStr,
      `{"query":"{ table1(filter: \\"d3=in=('v1','v2');d4=in=('v3','v4');d5=isnull=true;time[grain:day]=ge=('2015-01-03');time[grain:day]=lt=('2015-01-04');col0=gt=('0')\\",sort: \\"col3\\",first: \\"10000\\") { edges { node { col0:m1 col1:m2 col2:r(p:\\"123\\") col3:d1 col4:d2 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'dataQueryFromRequestV2 returns the correct query string for the given request V2'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [],
        limit: null,
        requestVersion: '2.0',
        dataSource: 'elideOne',
      }),
      `{"query":"{ myTable { edges { node { col0:m1(p:\\"q\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Arguments are properly excluded if they are not in the request'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: {}, type: 'metric' },
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric', direction: 'desc' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension', direction: 'asc' },
        ],
        filters: [],
        limit: null,
        requestVersion: '2.0',
        dataSource: 'elideOne',
      }),
      `{"query":"{ myTable(sort: \\"-col1,col2\\") { edges { node { col0:m1 col1:m1(p:\\"q\\") col2:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Request with sorts and parameters is queried correctly'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: {}, type: 'metric' },
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric', operator: 'in', values: ['v1', 'v2'] },
          { field: 'myTable.d1', parameters: {}, type: 'dimension', operator: 'neq', values: ['a'] },
          { field: 'myTable.d2', parameters: {}, type: 'dimension', operator: 'eq', values: ['b'] },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col1=in=('v1','v2');col2!=('a');d2==('b')\\") { edges { node { col0:m1 col1:m1(p:\\"q\\") col2:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Request with filters and parameters is queried correctly'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [],
        limit: 5,
        requestVersion: '2.0',
        dataSource: 'elideOne',
      }),
      `{"query":"{ myTable(first: \\"5\\") { edges { node { col0:m1(p:\\"q\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Request with limit is queried correctly'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric', operator: 'bet', values: ['v1', 'v2'] },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col0=ge=('v1');col0=le=('v2')\\") { edges { node { col0:m1(p:\\"q\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Request with "between" filter operator splits the filter into two correctly'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          { field: 'myTable.m1', parameters: { p: 'q' }, type: 'metric', operator: 'nbet', values: ['v1', 'v2'] },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col0=lt=('v1'),col0=gt=('v2')\\") { edges { node { col0:m1(p:\\"q\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Request with "not between" filter operator splits the filter into two correctly'
    );

    const lastMonth = moment.utc().subtract(1, 'month').format('YYYY-MM');
    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.time', parameters: { grain: 'month' }, type: 'timeDimension' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          {
            field: 'myTable.time',
            parameters: { grain: 'month' },
            type: 'timeDimension',
            operator: 'bet',
            values: ['P1M', 'current'],
          },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col0=ge=('${lastMonth}');col0=le=('${lastMonth}')\\") { edges { node { col0:time(grain:\\"MONTH\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Macros and durations in time-dimension filters are converted to date strings properly ([P1X, current] -> equals 1 X duration)'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.time', parameters: { grain: 'day' }, type: 'timeDimension' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          {
            field: 'myTable.time',
            parameters: { grain: 'day' },
            type: 'timeDimension',
            operator: 'isnull',
            values: [true],
          },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col0=isnull=true\\") { edges { node { col0:time(grain:\\"DAY\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Filter without 2 filter values is unaffected'
    );

    assert.equal(
      adapter['dataQueryFromRequest']({
        table: 'myTable',
        columns: [
          { field: 'myTable.time', parameters: { grain: 'day' }, type: 'timeDimension' },
          { field: 'myTable.d1', parameters: {}, type: 'dimension' },
        ],
        sorts: [],
        filters: [
          {
            field: 'myTable.time',
            parameters: { grain: 'day' },
            type: 'timeDimension',
            operator: 'bet',
            values: ['2020-05-05', '2020-05-08'],
          },
        ],
        requestVersion: '2.0',
        dataSource: 'elideOne',
        limit: null,
      }),
      `{"query":"{ myTable(filter: \\"col0=ge=('2020-05-05');col0=le=('2020-05-08')\\") { edges { node { col0:time(grain:\\"DAY\\") col1:d1 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'Filter with 2 non-macro date values is unaffected'
    );

    assert.strictEqual(
      adapter['dataQueryFromRequest']({ ...TestRequest, limit: null }, { first: 10, after: 1 }),
      `{"query":"{ table1(filter: \\"d3=in=('v1','v2');d4=in=('v3','v4');d5=isnull=true;time[grain:day]=ge=('2015-01-03');time[grain:day]=lt=('2015-01-04');col0=gt=('0')\\",sort: \\"col3\\",first: \\"10\\",after: \\"1\\") { edges { node { col0:m1 col1:m2 col2:r(p:\\"123\\") col3:d1 col4:d2 } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'The first and after pagination options are applied to the query'
    );
  });

  test('createAsyncQuery - pagination', async function (assert) {
    assert.expect(7);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let Pagination: Parameters<ElideFactsAdapter['dataQueryFromRequest']>[1] = undefined;
    let Message = '';
    adapter.apollo.mutate = () => undefined;
    adapter['dataQueryFromRequest'] = (_request, pagination) => {
      assert.deepEqual(pagination, Pagination, Message);
      return '';
    };

    assert.throws(
      () => adapter.createAsyncQuery(TestRequest, { perPage: 2 }),
      /The request specified a limit of 10000 which conflicts with page=1 and perPage=2/,
      'The request cannot specify a different limit and perPage'
    );

    assert.throws(
      () => adapter.createAsyncQuery(TestRequest, { perPage: 1000, page: 2 }),
      /The request specified a limit of 10000 which conflicts with page=2 and perPage=1000/,
      'The request cannot specify a different limit and perPage'
    );

    Pagination = { first: 10000, after: 0 };
    Message = 'A limit and perPage that are equal is allowed';
    await adapter.createAsyncQuery(TestRequest, { perPage: 10000 });

    Pagination = { first: 10000, after: 0 };
    Message = 'A limit and perPage that are equal is allowed if page=1';
    await adapter.createAsyncQuery(TestRequest, { perPage: 10000, page: 1 });

    const limitless = { ...TestRequest, limit: null };
    Pagination = { first: 3, after: 3 };
    Message = 'Specifying perPage and page is translated correctly';
    await adapter.createAsyncQuery(limitless, { perPage: 3, page: 2 });

    Pagination = { first: 4, after: 12 };
    await adapter.createAsyncQuery(limitless, { perPage: 4, page: 4 });

    Pagination = { first: 4, after: 4 };
    await adapter.createAsyncQuery(limitless, { perPage: 4, page: 2 });
  });

  test('createAsyncQuery - success', async function (assert) {
    assert.expect(5);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      assert.deepEqual(
        Object.keys(requestObj.variables),
        ['id', 'query', 'asyncAfterSeconds'],
        'createAsyncQuery sends id, query, and asyncAfterSeconds request variables'
      );

      assert.ok(uuidRegex.exec(requestObj.variables.id), 'A uuid is generated for the request id');

      const expectedTable = TestRequest.table;
      const expectedColumns = TestRequest.columns
        .map((c, idx) => getElideField(c.field, c.parameters, `col${idx}`))
        .join(' ');
      const expectedArgs = `(filter: "d3=in=('v1','v2');d4=in=('v3','v4');d5=isnull=true;time[grain:day]=ge=('2015-01-03');time[grain:day]=lt=('2015-01-04');col0=gt=('0')",sort: "col3",first: "10000")`;

      assert.equal(
        requestObj.variables.query.replace(/[ \t\r\n]+/g, ' '),
        JSON.stringify({
          query: `{ ${expectedTable}${expectedArgs} { edges { node { ${expectedColumns} } } pageInfo { startCursor endCursor totalRecords } } }`,
        }).replace(/[ \t\r\n]+/g, ' '),
        'createAsyncQuery sends the correct query variable string'
      );
      assert.equal(
        requestObj.query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
        print(asyncFactsMutationStr).replace(/[ \t\r\n]+/g, ''),
        'createAsyncQuery sends the correct mutation to create a new asyncQuery'
      );

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                query: requestObj.variables.query,
                queryType: 'GRAPHQL_V1_0',
                status: 'QUEUED',
                result: null,
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    const asyncQuery = await adapter.createAsyncQuery(TestRequest);

    assert.deepEqual(asyncQuery, response, 'createAsyncQuery returns the correct response payload');
  });

  test('createAsyncQuery - header', async function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody, requestHeaders }) {
      const requestObj = JSON.parse(requestBody);
      assert.equal(requestHeaders.authentication, 'Bearer abc-123', 'createAsyncQuery sends custom headers');

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                query: requestObj.variables.query,
                queryType: 'GRAPHQL_V1_0',
                status: 'QUEUED',
                result: null,
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    await adapter.createAsyncQuery(TestRequest, {
      customHeaders: {
        Authentication: 'Bearer abc-123',
      },
    });
  });

  test('createAsyncQuery - error', async function (assert) {
    assert.expect(1);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    const response = { errors: [{ message: 'Error in graphql query' }] };
    Server.post(HOST, () => [200, { 'Content-Type': 'application/json' }, JSON.stringify(response)]);

    try {
      await adapter.createAsyncQuery(TestRequest);
    } catch (error) {
      assert.deepEqual(error, response, 'createAsyncQuery returns the error response payload');
    }
  });

  test('cancelAsyncQuery - success', async function (assert) {
    assert.expect(2);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(
        requestObj.query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
        print(asyncFactsCancelMutationStr).replace(/[ \t\r\n]+/g, ''),
        'cancelAsyncQuery sends the correct mutation to cancel an asyncQuery'
      );

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                status: 'CANCELLED',
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    const result = await adapter.cancelAsyncQuery('request1', 'elideOne');
    assert.deepEqual(result, response, 'createAsyncQuery returns the correct response payload');
  });

  test('cancelAsyncQuery - header', async function (assert) {
    assert.expect(1);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody, requestHeaders }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(requestHeaders.authentication, 'Bearer abc-123', 'cancelAsyncQuery sends custom headers');

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                status: 'CANCELLED',
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    await adapter.cancelAsyncQuery('request1', 'elideOne', {
      customHeaders: {
        Authentication: 'Bearer abc-123',
      },
    });
  });

  test('fetchAsyncQuery - success', async function (assert) {
    assert.expect(2);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(
        requestObj.query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
        print(asyncFactsQueryStr).replace(/[ \t\r\n]+/g, ''),
        'fetchAsyncQuery sent the correct query to fetch an asyncQuery'
      );

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.ids[0],
                query: 'foo',
                queryType: 'GRAPHQL_V1_0',
                status: 'COMPLETE',
                result: {
                  httpStatus: '200',
                  contentLength: 2,
                  responseBody: JSON.stringify({
                    table: {
                      edges: [
                        {
                          node: {
                            metric: 123,
                            dimension: 'foo',
                          },
                        },
                      ],
                    },
                  }),
                },
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    const result = await adapter.fetchAsyncQuery('request1', 'elideOne');
    assert.deepEqual(result, response, 'fetchAsyncQuery returns the correct response payload');
  });

  test('fetchAsyncQuery - header', async function (assert) {
    assert.expect(1);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody, requestHeaders }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(requestHeaders.authentication, 'Bearer abc-123', 'fetchAsyncQuery sends custom headers');

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: requestObj.variables.ids[0],
                query: 'foo',
                queryType: 'GRAPHQL_V1_0',
                status: 'COMPLETE',
                result: {
                  httpStatus: '200',
                  contentLength: 2,
                  responseBody: JSON.stringify({
                    table: {
                      edges: [
                        {
                          node: {
                            metric: 123,
                            dimension: 'foo',
                          },
                        },
                      ],
                    },
                  }),
                },
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    await adapter.fetchAsyncQuery('request1', 'elideOne', {
      customHeaders: {
        Authentication: 'Bearer abc-123',
      },
    });
  });

  test('fetchTableExport - success', async function (assert) {
    assert.expect(2);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(
        requestObj.query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
        print(exportFactsQueryStr).replace(/[ \t\r\n]+/g, ''),
        'fetchTableExport sent the correct query to fetch a tableExport'
      );

      response = {
        tableExport: {
          edges: [
            {
              node: {
                id: requestObj.variables.ids[0],
                query: 'foo',
                queryType: 'GRAPHQL_V1_0',
                status: 'COMPLETE',
                result: {
                  httpStatus: '200',
                  url: 'downloadURL',
                  message: '',
                },
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });
    const result = await adapter.fetchTableExport('request1', 'elideOne');
    assert.deepEqual(result, response, 'fetchTableExport returns the correct response payload');
  });

  test('fetchTableExport - header', async function (assert) {
    assert.expect(1);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody, requestHeaders }) {
      const requestObj = JSON.parse(requestBody);

      assert.equal(requestHeaders.authentication, 'Bearer abc-123', 'fetchTableExport sends custom headers');

      response = {
        tableExport: {
          edges: [
            {
              node: {
                id: requestObj.variables.ids[0],
                query: 'foo',
                queryType: 'GRAPHQL_V1_0',
                status: 'COMPLETE',
                result: {
                  httpStatus: '200',
                  url: 'downloadURL',
                  message: '',
                },
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });
    await adapter.fetchTableExport('request1', 'elideOne', {
      customHeaders: {
        Authentication: 'Bearer abc-123',
      },
    });
  });

  test('fetchDataForRequest - success', async function (assert) {
    assert.expect(10);

    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    adapter._pollingInterval = 300;

    let callCount = 0;
    let queryVariable: string;
    let queryId: string;

    let response: TODO;
    Server.post(HOST, function ({ requestBody }) {
      callCount++;
      let result = null;
      const { query, variables } = JSON.parse(requestBody);

      if (callCount === 1) {
        queryVariable = variables.query;
        queryId = variables.id;

        assert.equal(
          query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
          print(asyncFactsMutationStr).replace(/[ \t\r\n]+/g, ''),
          'fetchDataForRequest first creates an asyncQuery'
        );
      } else if (callCount < 6) {
        assert.equal(
          query.replace(/__typename/g, '').replace(/[ \t\r\n]+/g, ''),
          print(asyncFactsQueryStr).replace(/[ \t\r\n]+/g, ''),
          'fetchDataForRequest polls for the asyncQuery to complete'
        );
        assert.equal(
          variables.ids[0],
          queryId,
          'fetchDataForRequest requests the same asyncQuery id as the one it created'
        );

        if (callCount === 5) {
          result = {
            httpStatus: 200,
            contentLength: 1,
            responseBody: JSON.stringify({
              data: {
                tableName: {
                  edges: [
                    {
                      node: {
                        column1: '123',
                        column2: '321',
                      },
                    },
                  ],
                },
              },
            }),
          };
        }
      } else {
        assert.ok(false, 'Error: fetchDataForRequest did not for the asyncQuery to complete');
      }

      response = {
        asyncQuery: {
          edges: [
            {
              node: {
                id: queryId,
                query: queryVariable,
                queryType: 'GRAPHQL_V1_0',
                status: callCount !== 5 ? 'QUEUED' : 'COMPLETE',
                result,
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    const result = await taskFor(adapter.fetchDataForRequest).perform(TestRequest);
    assert.deepEqual(result, response, 'fetchDataForRequest returns the correct response payload');
  });

  test('fetchDataForRequest - error', async function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let errors = [{ message: 'Bad request' }];
    Server.post(HOST, () => [400, { 'Content-Type': 'application/json' }, JSON.stringify({ errors })]);

    try {
      await taskFor(adapter.fetchDataForRequest).perform(TestRequest);
    } catch ({ errors }) {
      const responseText = await errors[0].statusText;
      assert.deepEqual(responseText, errors[0].messages, 'fetchDataForRequest an array of response objects on error');
    }
  });

  test('urlForDownloadQuery - success', async function (assert) {
    assert.expect(3);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const downloadURL = 'https://yavin.dev/export/123';
    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);
      assert.deepEqual(
        Object.keys(requestObj.variables),
        ['id', 'query'],
        'urlForDownloadQuery sends id, query request variables'
      );

      assert.ok(uuidRegex.exec(requestObj.variables.id), 'A uuid is generated for the request id');

      response = {
        tableExport: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                query: requestObj.variables.query,
                status: 'COMPLETE',
                result: {
                  httpStatus: 200,
                  url: downloadURL,
                  message: '',
                },
              },
            },
          ],
        },
      };
      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });
    const tableExportUrl: string = await taskFor(adapter.urlForDownloadQuery).perform(TestRequest, {});
    assert.deepEqual(tableExportUrl, downloadURL, 'urlForDownloadQuery returns the correct response payload');
  });

  test('urlForDownloadQuery - Internal server error', async function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');

    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      response = {
        tableExport: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                query: requestObj.variables.query,
                status: 'FAILURE',
                result: {
                  httpStatus: 500,
                  url: '',
                  message: '',
                },
              },
            },
          ],
        },
      };

      return [500, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });

    try {
      await taskFor(adapter.urlForDownloadQuery).perform(TestRequest, {});
    } catch (e) {
      assert.deepEqual(
        e.errors[0].response.statusText,
        'Internal Server Error',
        'urlForDownloadQuery returns appropriate error message on server error'
      );
    }
  });

  test('urlForDownloadQuery - Bad request error', async function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    let response;
    Server.post(HOST, function ({ requestBody }) {
      const requestObj = JSON.parse(requestBody);

      response = {
        tableExport: {
          edges: [
            {
              node: {
                id: requestObj.variables.id,
                query: requestObj.variables.query,
                status: 'FAILURE',
                result: {
                  httpStatus: 200,
                  url: '',
                  message: '',
                },
              },
            },
          ],
        },
      };

      return [200, { 'Content-Type': 'application/json' }, JSON.stringify({ data: response })];
    });
    try {
      await taskFor(adapter.urlForDownloadQuery).perform(TestRequest, {});
    } catch (e) {
      assert.deepEqual(
        e.message,
        'Table Export Query did not complete successfully',
        'urlForDownloadQuery returns appropriate error message on bad request'
      );
    }
  });

  test('escaped filter values', async function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const EscapedTest: RequestV2 = {
      table: 'table1',
      columns: [],
      filters: [
        {
          field: 'table1.d6',
          parameters: { field: 'id' },
          type: 'dimension',
          operator: 'in',
          values: ['with, comma', 'no comma'],
        },
        {
          field: 'table1.d7',
          parameters: { field: 'id' },
          type: 'dimension',
          operator: 'in',
          values: ['with "quote"', 'but why'],
        },
        {
          field: 'table1.d8',
          parameters: { field: 'id' },
          type: 'dimension',
          operator: 'in',
          values: ['okay', "with 'single quote'"],
        },
      ],
      sorts: [{ field: 'table1.d1', parameters: {}, type: 'dimension', direction: 'asc' }],
      limit: 10000,
      requestVersion: '2.0',
      dataSource: 'elideOne',
    };

    const queryStr = adapter['dataQueryFromRequest'](EscapedTest);

    //test all of the escaped functionalities and verify them in the below assert
    assert.equal(
      queryStr,
      `{"query":"{ table1(filter: \\"d6[field:id]=in=('with, comma','no comma');d7[field:id]=in=('with \\"quote\\"','but why');d8[field:id]=in=('okay','with \\\\\\\\'single quote\\\\\\\\'')\\",sort: \\"d1\\",first: \\"10000\\") { edges { node {  } } pageInfo { startCursor endCursor totalRecords } } }"}`,
      'dataQueryFromRequestV2 returns the correct query string with escaped quotes and commas for the given request V2'
    );
  });

  test('buildFilterStr - alias', async function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const filters: Filter[] = [
      {
        field: 'table1.dim1',
        parameters: { p: 'q' },
        type: 'dimension',
        operator: 'contains',
        values: ['v1'],
      },
      {
        field: 'table1.dim1',
        parameters: {},
        type: 'dimension',
        operator: 'contains',
        values: ['v2'],
      },
    ];
    assert.equal(
      adapter['buildFilterStr'](filters, { 'table1.dim1(p=q)': 'col1' }),
      "col1=in=('*v1*');dim1=in=('*v2*')",
      '`buildFilterStr` builds correct filter string for an aliased column'
    );
  });

  test('buildFilterStr - contains', async function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const filters: Filter[] = [
      {
        field: 'table1.dim1',
        parameters: {},
        type: 'dimension',
        operator: 'contains',
        values: ['v1'],
      },
    ];
    assert.equal(
      adapter['buildFilterStr'](filters, {}),
      "dim1=in=('*v1*')",
      '`buildFilterStr` builds correct filter string for a `contains` filter'
    );

    const escapedFilter: Filter[] = [
      {
        field: 'table1.dim1',
        parameters: {},
        type: 'dimension',
        operator: 'contains',
        values: ["'"],
      },
    ];
    assert.equal(
      adapter['buildFilterStr'](escapedFilter, {}),
      "dim1=in=('*\\\\'*')",
      '`buildFilterStr` builds correct filter string for a `contains` filter and escaped value'
    );
  });

  test('buildFilterStr - filter out empty values', async function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const noValues: Filter[] = [
      {
        field: 'table1.dim1',
        parameters: {},
        type: 'dimension',
        operator: 'contains',
        values: [],
      },
    ];
    assert.equal(
      adapter['buildFilterStr'](noValues, {}),
      '',
      '`buildFilterStr` returns an empty string if no filters have values'
    );

    const someValues: Filter[] = [
      {
        field: 'table1.dim2',
        parameters: {},
        type: 'dimension',
        operator: 'eq',
        values: [1],
      },
      {
        field: 'table1.dim1',
        parameters: {},
        type: 'dimension',
        operator: 'contains',
        values: [],
      },
    ];
    assert.equal(
      adapter['buildFilterStr'](someValues, {}),
      "dim2==('1')",
      '`buildFilterStr` filters out filters with empty values'
    );
  });

  test('buildFilterStr - params', async function (assert) {
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    let DefaultParams = {};
    //@ts-expect-error
    adapter.naviMetadata = {
      getById<K extends keyof MetadataModelRegistry>(_type: K, _id: string, _dataSourceName: string) {
        return ({ getDefaultParameters: () => DefaultParams } as unknown) as MetadataModelRegistry[K];
      },
    };
    const noValues: Filter[] = [
      {
        field: 'table1.dim1',
        parameters: { param: 'val' },
        type: 'dimension',
        operator: 'contains',
        values: ['test'],
      },
    ];
    assert.deepEqual(
      adapter['buildFilterStr'](noValues, {}),
      "dim1[param:val]=in=('*test*')",
      '`buildFilterStr` returns a filter when there is no alias if params are used'
    );

    DefaultParams = { param: 'notval' };
    assert.deepEqual(
      adapter['buildFilterStr'](noValues, {}),
      "dim1[param:val]=in=('*test*')",
      '`buildFilterStr` returns a filter when there is no alias if non-default params are used'
    );

    assert.deepEqual(
      adapter['buildFilterStr'](noValues, { 'table1.dim1(param=val)': 'col1' }),
      `col1=in=('*test*')`,
      '`buildFilterStr` returns alias if available'
    );
  });

  test('buildFilterStr - intervals', function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    const intervalFilter: Filter[] = [
      {
        field: 'table1.timeDim',
        parameters: { grain: 'day' },
        type: 'timeDimension',
        operator: 'intervals',
        values: ['2021-10/2021-12', '2022-10/2022-12', '2023-10/2023-12'],
      },
    ];

    try {
      adapter['buildFilterStr'](intervalFilter, {});
    } catch (e) {
      assert.equal(e.message, 'Assertion Failed: Filter operator not supported: intervals');
    }
  });

  test('urlForFindQuery', function (assert) {
    assert.expect(1);
    const adapter: ElideFactsAdapter = this.owner.lookup('adapter:facts/elide');
    assert.equal(
      decodeURIComponent(adapter.urlForFindQuery(TestRequest, {})),
      `{"query":"{ table1(filter: \\"d3=in=('v1','v2');d4=in=('v3','v4');d5=isnull=true;time[grain:day]=ge=('2015-01-03');time[grain:day]=lt=('2015-01-04');col0=gt=('0')\\",sort: \\"col3\\",first: \\"10000\\") { edges { node { col0:m1 col1:m2 col2:r(p:\\"123\\") col3:d1 col4:d2 } } } }"}`,
      'urlForFindQuery correctly built the query for the provided request with no pagination info'
    );
  });
});
