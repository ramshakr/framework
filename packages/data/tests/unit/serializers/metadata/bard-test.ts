import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import config from 'ember-get-config';
import { TestContext } from 'ember-test-helpers';
import BardMetadataSerializer, {
  RawEverythingPayload,
  RawDimensionPayload,
  RawMetricPayload,
  RawTablePayload,
} from 'navi-data/serializers/metadata/bard';
import DimensionMetadataModel, { DimensionMetadataPayload } from 'navi-data/models/metadata/dimension';
import TimeDimensionMetadataModel, { TimeDimensionMetadataPayload } from 'navi-data/models/metadata/time-dimension';
import MetricMetadataModel, { MetricMetadataPayload } from 'navi-data/models/metadata/metric';
import ColumnFunctionMetadataModel, { ColumnFunctionMetadataPayload } from 'navi-data/models/metadata/column-function';
import BardTableMetadataModel, { BardTableMetadataPayload } from 'navi-data/models/metadata/bard/table';
import RequestConstraintMetadataModel, {
  RequestConstraintMetadataPayload,
} from 'navi-data/models/metadata/request-constraint';
import { EverythingMetadataPayload } from 'navi-data/serializers/metadata/base';

const Payload: RawEverythingPayload = {
  tables: [
    {
      name: 'tableName',
      description: 'Table Description',
      longName: 'tableLongName',
      category: 'General',
      timeGrains: [
        {
          name: 'all',
          description: 'The tableName all grain',
          metrics: [
            {
              category: 'category',
              name: 'metricOne',
              longName: 'Metric One',
              type: 'number',
            },
            {
              category: 'category',
              name: 'metricFour',
              longName: 'Metric Four',
              type: 'money',
              parameters: {
                currency: {
                  type: 'dimension',
                  dimensionName: 'displayCurrency',
                  defaultValue: 'USD',
                },
                format: {
                  type: 'dimension',
                  dimensionName: 'displayFormat',
                  defaultValue: 'none',
                },
              },
            },
          ],
          retention: 'P24M',
          longName: 'All',
          dimensions: [
            {
              category: 'categoryOne',
              name: 'dimensionOne',
              longName: 'Dimension One',
              cardinality: 10,
              datatype: 'text',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
                {
                  name: 'desc',
                  description: 'Dimension Description',
                  longName: 'Desc',
                },
              ],
            },
            {
              category: 'categoryTwo',
              name: 'dimensionTwo',
              longName: 'Dimension Two',
              cardinality: 5,
              datatype: 'text',
              fields: [
                {
                  name: 'foo',
                  description: 'bar',
                  longName: 'Foo',
                },
              ],
            },
            {
              category: 'dateCategory',
              name: 'dimensionThree',
              longName: 'Dimension Three',
              cardinality: 50000,
              datatype: 'dateTime',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
              ],
            },
          ],
        },
        {
          name: 'day',
          description: 'The tableName day grain',
          metrics: [
            {
              category: 'category',
              name: 'metricOne',
              longName: 'Metric One',
              type: 'number',
            },
            {
              category: 'category',
              name: 'metricFour',
              longName: 'Metric Four',
              type: 'money',
              parameters: {
                currency: {
                  type: 'dimension',
                  dimensionName: 'displayCurrency',
                  defaultValue: 'USD',
                },
                format: {
                  type: 'dimension',
                  dimensionName: 'displayFormat',
                  defaultValue: 'none',
                },
              },
            },
          ],
          retention: 'P24M',
          longName: 'Day',
          dimensions: [
            {
              category: 'categoryOne',
              name: 'dimensionOne',
              longName: 'Dimension One',
              cardinality: 10,
              datatype: 'text',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
                {
                  name: 'desc',
                  description: 'Dimension Description',
                  longName: 'Desc',
                },
              ],
            },
            {
              category: 'categoryTwo',
              name: 'dimensionTwo',
              longName: 'Dimension Two',
              cardinality: 5,
              datatype: 'text',
              fields: [
                {
                  name: 'foo',
                  description: 'bar',
                  longName: 'Foo',
                },
              ],
            },
            {
              category: 'dateCategory',
              name: 'dimensionThree',
              longName: 'Dimension Three',
              cardinality: 50000,
              datatype: 'dateTime',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
              ],
            },
          ],
        },
        {
          name: 'month',
          description: 'The tableName month grain',
          metrics: [
            {
              category: 'category',
              name: 'metricOne',
              longName: 'Metric One',
              type: 'number',
            },
            {
              category: 'category',
              name: 'metricTwo',
              longName: 'Metric Two',
              type: 'money',
              parameters: {
                currency: {
                  type: 'dimension',
                  dimensionName: 'displayCurrency',
                  defaultValue: 'USD',
                },
              },
            },
          ],
          retention: 'P24M',
          longName: 'Month',
          dimensions: [
            {
              category: 'categoryOne',
              name: 'dimensionOne',
              longName: 'Dimension One',
              cardinality: 10,
              datatype: 'text',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
                {
                  name: 'desc',
                  description: 'Dimension Description',
                  longName: 'Desc',
                },
              ],
            },
            {
              category: 'categoryTwo',
              name: 'dimensionTwo',
              longName: 'Dimension Two',
              cardinality: 5,
              datatype: 'text',
              fields: [
                {
                  name: 'foo',
                  description: 'bar',
                  longName: 'Foo',
                },
              ],
            },
            {
              category: 'dateCategory',
              name: 'dimensionThree',
              longName: 'Dimension Three',
              cardinality: 50000,
              datatype: 'dateTime',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'secondTable',
      longName: 'Second Table',
      description: "Second table's description",
      category: 'Special',
      timeGrains: [
        {
          name: 'day',
          description: 'The secondTable day grain',
          longName: 'Day',
          retention: 'P24M',
          metrics: [
            {
              category: 'category',
              name: 'metricFive',
              longName: 'Metric Five',
              type: 'number',
              metricFunctionId: 'metricFunctionId take precedence over parameters',
              parameters: {
                whiteNoise: {
                  type: 'dimension',
                  dimensionName: 'displayCurrency',
                  defaultValue: 'USD',
                },
              },
            },
            {
              category: 'category',
              name: 'metricTwo',
              longName: 'Metric Two',
              type: 'money',
              parameters: {
                currency: {
                  type: 'dimension',
                  dimensionName: 'displayCurrency',
                  defaultValue: 'USD',
                },
              },
            },
          ],
          dimensions: [
            {
              category: 'categoryTwo',
              name: 'dimensionTwo',
              longName: 'Dimension Two',
              cardinality: 5,
              datatype: 'text',
              fields: [
                {
                  name: 'foo',
                  description: 'bar',
                  longName: 'Foo',
                },
              ],
            },
            {
              category: 'dateCategory',
              name: 'dimensionThree',
              longName: 'Dimension Three',
              cardinality: 50000,
              datatype: 'dateTime',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
              ],
            },
          ],
        },
        {
          name: 'week',
          description: 'The secondTable week grain',
          longName: 'Week',
          retention: 'P24M',
          metrics: [
            {
              category: 'category',
              name: 'metricOne',
              longName: 'Metric One',
              type: 'number',
            },
            {
              category: 'category',
              name: 'metricThree',
              longName: 'Metric Three',
              type: 'number',
            },
          ],
          dimensions: [
            {
              category: 'categoryTwo',
              name: 'dimensionTwo',
              longName: 'Dimension Two',
              cardinality: 5,
              datatype: 'text',
              fields: [
                {
                  name: 'foo',
                  description: 'bar',
                  longName: 'Foo',
                },
              ],
            },
            {
              category: 'dateCategory',
              name: 'dimensionThree',
              longName: 'Dimension Three',
              cardinality: 50000,
              datatype: 'dateTime',
              fields: [
                {
                  name: 'id',
                  description: 'Dimension ID',
                  longName: 'Id',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
// list of table objects, with table->timegrains->dimensions+metrics
const TablePayloads: BardTableMetadataPayload[] = [
  {
    cardinality: 'MEDIUM',
    isFact: true,
    category: 'General',
    description: 'Table Description',
    dimensionIds: ['dimensionOne', 'dimensionTwo'],
    id: 'tableName',
    metricIds: ['metricOne', 'metricFour', 'metricTwo'],
    name: 'tableLongName',
    source: 'bardOne',
    timeDimensionIds: ['dimensionThree', 'tableName.dateTime'],
    timeGrainIds: ['day', 'month'],
    requestConstraintIds: ['normalizer-generated:requestConstraint(filters=tableName.dateTime)'],
    hasAllGrain: true,
  },
  {
    cardinality: 'MEDIUM',
    isFact: true,
    category: 'Special',
    description: "Second table's description",
    dimensionIds: ['dimensionTwo'],
    id: 'secondTable',
    metricIds: ['metricFive', 'metricTwo', 'metricOne', 'metricThree'],
    name: 'Second Table',
    source: 'bardOne',
    timeDimensionIds: ['dimensionThree', 'secondTable.dateTime'],
    timeGrainIds: ['day', 'isoWeek'],
    requestConstraintIds: [
      'normalizer-generated:requestConstraint(filters=secondTable.dateTime)',
      'normalizer-generated:requestConstraint(columns=secondTable.dateTime)',
    ],
    hasAllGrain: false,
  },
];

const DimensionsPayloads: DimensionMetadataPayload[] = [
  {
    cardinality: 'SMALL',
    category: 'categoryOne',
    columnFunctionId: 'normalizer-generated:dimensionField(fields=desc,id)',
    description: undefined,
    id: 'dimensionOne',
    name: 'Dimension One',
    source: 'bardOne',
    type: 'field',
    valueType: 'text',
    isSortable: false,
    storageStrategy: null,
    partialData: true,
    fields: [
      {
        name: 'id',
        description: 'Dimension ID',
        longName: 'Id',
      },
      {
        name: 'desc',
        description: 'Dimension Description',
        longName: 'Desc',
      },
    ],
    tableSource: {
      suggestionColumns: [
        { id: 'dimensionOne', parameters: { field: 'id' } },
        { id: 'dimensionOne', parameters: { field: 'desc' } },
      ],
    },
  },
  {
    cardinality: 'SMALL',
    category: 'categoryTwo',
    columnFunctionId: 'normalizer-generated:dimensionField(fields=foo)',
    description: undefined,
    id: 'dimensionTwo',
    name: 'Dimension Two',
    source: 'bardOne',
    isSortable: false,
    type: 'field',
    valueType: 'text',
    fields: [
      {
        name: 'foo',
        longName: 'Foo',
        description: 'bar',
      },
    ],
    tableSource: {
      suggestionColumns: [{ id: 'dimensionTwo', parameters: { field: 'foo' } }],
    },
    storageStrategy: null,
    partialData: true,
  },
];

const TimeDimensionPayloads: TimeDimensionMetadataPayload[] = [
  {
    cardinality: 'MEDIUM',
    category: 'dateCategory',
    description: undefined,
    columnFunctionId: 'normalizer-generated:timeDimension(fields=id,grains=second)',
    id: 'dimensionThree',
    name: 'Dimension Three',
    source: 'bardOne',
    type: 'field',
    fields: [
      {
        name: 'id',
        description: 'Dimension ID',
        longName: 'Id',
      },
    ],
    tableSource: {
      suggestionColumns: [{ id: 'dimensionThree', parameters: { field: 'id' } }],
    },
    isSortable: true,
    valueType: 'dateTime',
    storageStrategy: null,
    partialData: true,
    supportedGrains: [
      {
        expression: '',
        grain: 'Second',
        id: 'second',
      },
    ],
    timeZone: 'utc',
  },
  {
    category: 'Date',
    columnFunctionId: 'normalizer-generated:timeGrain(table=tableName;grains=day,month)',
    description: undefined,
    fields: undefined,
    tableSource: undefined,
    id: 'tableName.dateTime',
    name: 'Date Time',
    source: 'bardOne',
    supportedGrains: [
      {
        expression: '',
        grain: 'Day',
        id: 'day',
      },
      {
        expression: '',
        grain: 'Month',
        id: 'month',
      },
    ],
    timeZone: 'UTC',
    type: 'field',
    isSortable: true,
    valueType: 'date',
  },
  {
    category: 'Date',
    columnFunctionId: 'normalizer-generated:timeGrain(table=secondTable;grains=day,isoWeek)',
    description: undefined,
    fields: undefined,
    tableSource: undefined,
    id: 'secondTable.dateTime',
    name: 'Date Time',
    source: 'bardOne',
    supportedGrains: [
      {
        expression: '',
        grain: 'Day',
        id: 'day',
      },
      {
        expression: '',
        grain: 'IsoWeek',
        id: 'isoWeek',
      },
    ],
    timeZone: 'UTC',
    type: 'field',
    isSortable: true,
    valueType: 'date',
  },
];

const MetricPayloads: MetricMetadataPayload[] = [
  {
    category: 'category',
    id: 'metricOne',
    columnFunctionId: undefined,
    description: undefined,
    name: 'Metric One',
    partialData: true,
    source: 'bardOne',
    type: 'field',
    isSortable: true,
    valueType: 'number',
  },
  {
    category: 'category',
    id: 'metricFour',
    columnFunctionId: 'normalizer-generated:columnFunction(parameters=currency,format)',
    description: undefined,
    name: 'Metric Four',
    partialData: true,
    source: 'bardOne',
    type: 'field',
    isSortable: true,
    valueType: 'money',
  },
  {
    category: 'category',
    id: 'metricTwo',
    columnFunctionId: 'normalizer-generated:columnFunction(parameters=currency)',
    description: undefined,
    name: 'Metric Two',
    partialData: true,
    source: 'bardOne',
    type: 'field',
    isSortable: true,
    valueType: 'money',
  },
  {
    category: 'category',
    id: 'metricFive',
    columnFunctionId: 'metricFunctionId take precedence over parameters',
    description: undefined,
    name: 'Metric Five',
    partialData: true,
    source: 'bardOne',
    type: 'field',
    isSortable: true,
    valueType: 'number',
  },
  {
    category: 'category',
    id: 'metricThree',
    columnFunctionId: undefined,
    description: undefined,
    name: 'Metric Three',
    partialData: true,
    source: 'bardOne',
    type: 'field',
    isSortable: true,
    valueType: 'number',
  },
];

const ColumnFunctionPayloads: ColumnFunctionMetadataPayload[] = [
  {
    _parametersPayload: [
      {
        _localValues: [
          {
            description: undefined,
            id: 'id',
            name: 'Id',
          },
          {
            description: undefined,
            id: 'desc',
            name: 'Desc',
          },
        ],
        defaultValue: 'id',
        description: 'The field to be projected for this dimension',
        expression: 'self',
        id: 'field',
        name: 'Dimension Field',
        source: 'bardOne',
        type: 'ref',
      },
    ],
    description: 'Dimension Field',
    id: 'normalizer-generated:dimensionField(fields=desc,id)',
    name: 'Dimension Field',
    source: 'bardOne',
  },
  {
    _parametersPayload: [
      {
        _localValues: [
          {
            description: undefined,
            id: 'foo',
            name: 'Foo',
          },
        ],
        defaultValue: 'foo',
        description: 'The field to be projected for this dimension',
        expression: 'self',
        id: 'field',
        name: 'Dimension Field',
        source: 'bardOne',
        type: 'ref',
      },
    ],
    description: 'Dimension Field',
    id: 'normalizer-generated:dimensionField(fields=foo)',
    name: 'Dimension Field',
    source: 'bardOne',
  },
  {
    _parametersPayload: [
      {
        _localValues: [
          {
            description: undefined,
            id: 'id',
            name: 'Id',
          },
        ],
        defaultValue: 'id',
        description: 'The field to be projected for this dimension',
        expression: 'self',
        id: 'field',
        name: 'Dimension Field',
        source: 'bardOne',
        type: 'ref',
      },
      {
        _localValues: [{ id: 'second', name: 'second' }],
        defaultValue: 'second',
        description: 'The time grain to group dates by',
        expression: 'self',
        id: 'grain',
        name: 'Time Grain',
        source: 'bardOne',
        type: 'ref',
      },
    ],
    description: 'Dimension Field',
    id: 'normalizer-generated:timeDimension(fields=id,grains=second)',
    name: 'Dimension Field',
    source: 'bardOne',
  },
  {
    _parametersPayload: [
      {
        _localValues: undefined,
        source: 'bardOne',
        defaultValue: 'USD',
        description: undefined,
        expression: 'dimension:displayCurrency',
        id: 'currency',
        name: 'currency',
        type: 'ref',
      },
      {
        _localValues: undefined,
        source: 'bardOne',
        defaultValue: 'none',
        description: undefined,
        expression: 'dimension:displayFormat',
        id: 'format',
        name: 'format',
        type: 'ref',
      },
    ],
    description: '',
    id: 'normalizer-generated:columnFunction(parameters=currency,format)',
    name: '',
    source: 'bardOne',
  },
  {
    _parametersPayload: [
      {
        _localValues: undefined,
        source: 'bardOne',
        defaultValue: 'USD',
        description: undefined,
        expression: 'dimension:displayCurrency',
        id: 'currency',
        name: 'currency',
        type: 'ref',
      },
    ],
    description: '',
    id: 'normalizer-generated:columnFunction(parameters=currency)',
    name: '',
    source: 'bardOne',
  },
  {
    id: 'normalizer-generated:timeGrain(table=tableName;grains=day,month)',
    name: 'Time Grain',
    description: 'Time Grain',
    source: 'bardOne',
    _parametersPayload: [
      {
        defaultValue: 'day',
        description: 'The time grain to group dates by',
        expression: 'self',
        id: 'grain',
        name: 'Time Grain',
        source: 'bardOne',
        type: 'ref',
        _localValues: [
          { id: 'day', description: 'The tableName day grain', name: 'Day' },
          { id: 'month', description: 'The tableName month grain', name: 'Month' },
        ],
      },
    ],
  },
  {
    id: 'normalizer-generated:timeGrain(table=secondTable;grains=day,isoWeek)',
    name: 'Time Grain',
    description: 'Time Grain',
    source: 'bardOne',
    _parametersPayload: [
      {
        defaultValue: 'day',
        description: 'The time grain to group dates by',
        expression: 'self',
        id: 'grain',
        name: 'Time Grain',
        source: 'bardOne',
        type: 'ref',
        _localValues: [
          {
            description: 'The secondTable day grain',
            id: 'day',
            name: 'Day',
          },
          {
            description: 'The secondTable week grain',
            id: 'isoWeek',
            name: 'Week',
          },
        ],
      },
    ],
  },
];

const RequestConstraintPayloads: RequestConstraintMetadataPayload[] = [
  {
    id: 'normalizer-generated:requestConstraint(filters=tableName.dateTime)',
    name: 'Date Time Filter',
    description: 'The request has a Date Time filter that specifies an interval.',
    type: 'existence',
    constraint: { property: 'filters', matches: { type: 'timeDimension', field: 'tableName.dateTime' } },
    source: 'bardOne',
  },
  {
    id: 'normalizer-generated:requestConstraint(filters=secondTable.dateTime)',
    name: 'Date Time Filter',
    description: 'The request has a Date Time filter that specifies an interval.',
    type: 'existence',
    constraint: { property: 'filters', matches: { type: 'timeDimension', field: 'secondTable.dateTime' } },
    source: 'bardOne',
  },
  {
    id: 'normalizer-generated:requestConstraint(columns=secondTable.dateTime)',
    name: 'Date Time Column',
    description: 'The request has a Date Time column.',
    type: 'existence',
    constraint: { property: 'columns', matches: { type: 'timeDimension', field: 'secondTable.dateTime' } },
    source: 'bardOne',
  },
];

let Serializer: BardMetadataSerializer;
let ColumnFunctions: ColumnFunctionMetadataModel[];
let RequestConstraints: RequestConstraintMetadataModel[];
let Metrics: MetricMetadataModel[];
let TimeDimensions: TimeDimensionMetadataModel[];
let Dimensions: DimensionMetadataModel[];
let Tables: BardTableMetadataModel[];

module('Unit | Serializer | metadata/bard', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function (this: TestContext) {
    Serializer = this.owner.lookup('serializer:metadata/bard');
    Tables = TablePayloads.map((p) => this.owner.factoryFor('model:metadata/bard/table').create(p));
    Dimensions = DimensionsPayloads.map((p) => this.owner.factoryFor('model:metadata/dimension').create(p));
    TimeDimensions = TimeDimensionPayloads.map((p) => this.owner.factoryFor('model:metadata/time-dimension').create(p));
    Metrics = MetricPayloads.map((p) => this.owner.factoryFor('model:metadata/metric').create(p));
    ColumnFunctions = ColumnFunctionPayloads.map((p) =>
      this.owner.factoryFor('model:metadata/column-function').create(p)
    );
    RequestConstraints = RequestConstraintPayloads.map((p) =>
      this.owner.factoryFor('model:metadata/request-constraint').create(p)
    );
  });

  test('normalize `everything` with metric legacy `parameters`', function (assert) {
    assert.expect(7);
    const expected: EverythingMetadataPayload = {
      metrics: Metrics,
      dimensions: Dimensions,
      timeDimensions: TimeDimensions,
      tables: Tables,
      columnFunctions: ColumnFunctions,
      requestConstraints: RequestConstraints,
    };
    const normalized = Serializer.normalize('everything', Payload, 'bardOne');

    assert.deepEqual(
      Object.keys(expected).sort(),
      Object.keys(normalized as object).sort(),
      'Everything metadata payload has all types'
    );
    Object.keys(expected).forEach((key: keyof EverythingMetadataPayload) => {
      assert.deepEqual(expected[key], normalized?.[key], `All normalized ${key} are created correctly`);
    });
  });

  test('normalize `everything` with column functions', function (assert) {
    const MetricFunctionIdsPayload: RawEverythingPayload = {
      metricFunctions: [
        {
          id: 'moneyMetric',
          name: 'Mo Money',
          description: 'Mo Problems',
          arguments: {
            currency: {
              type: 'enum',
              defaultValue: null,
              values: [
                { id: 'USD', name: 'USD' },
                { id: 'CAN', name: 'CAN' },
              ],
              description: 'Currency Parameter',
            },
          },
        },
      ],
      tables: [
        {
          name: 'tableName',
          description: 'Table Description',
          longName: 'tableLongName',
          category: 'General',
          timeGrains: [
            {
              name: 'day',
              description: 'The tableName day grain',
              metrics: [
                {
                  category: 'category',
                  name: 'metricOne',
                  longName: 'Metric One',
                  type: 'number',
                },
                {
                  category: 'category',
                  name: 'metricTwo',
                  longName: 'Metric Two',
                  type: 'money',
                  metricFunctionId: 'moneyMetric',
                },
              ],
              retention: 'P24M',
              longName: 'Day',
              dimensions: [],
            },
          ],
        },
      ],
    };

    const { metrics, columnFunctions } = Serializer.normalize('everything', MetricFunctionIdsPayload, 'bardOne') || {};

    const expectedMetricPayloads: MetricMetadataPayload[] = [
      {
        category: 'category',
        id: 'metricOne',
        name: 'Metric One',
        description: undefined,
        valueType: 'number',
        source: 'bardOne',
        columnFunctionId: undefined,
        type: 'field',
        isSortable: true,
        partialData: true,
      },
      {
        category: 'category',
        id: 'metricTwo',
        name: 'Metric Two',
        description: undefined,
        valueType: 'money',
        source: 'bardOne',
        columnFunctionId: 'moneyMetric',
        type: 'field',
        isSortable: true,
        partialData: true,
      },
    ];

    assert.deepEqual(
      metrics,
      expectedMetricPayloads.map((p) => this.owner.factoryFor('model:metadata/metric').create(p)),
      'The metric with parameters has a columnFunctionId provided by the raw data'
    );

    const expectedColumnFunctionPayloads: ColumnFunctionMetadataPayload[] = [
      {
        _parametersPayload: [
          {
            _localValues: [
              { id: 'USD', name: 'USD' },
              { id: 'CAN', name: 'CAN' },
            ],
            defaultValue: null,
            description: 'Currency Parameter',
            expression: 'self',
            id: 'currency',
            name: 'currency',
            type: 'ref',
            source: 'bardOne',
          },
        ],
        description: 'Mo Problems',
        id: 'moneyMetric',
        name: 'Mo Money',
        source: 'bardOne',
      },
      {
        description: 'Time Grain',
        id: 'normalizer-generated:timeGrain(table=tableName;grains=day)',
        name: 'Time Grain',
        source: 'bardOne',
        _parametersPayload: [
          {
            defaultValue: 'day',
            description: 'The time grain to group dates by',
            expression: 'self',
            id: 'grain',
            name: 'Time Grain',
            source: 'bardOne',
            type: 'ref',
            _localValues: [
              {
                description: 'The tableName day grain',
                id: 'day',
                name: 'Day',
              },
            ],
          },
        ],
      },
    ];
    assert.deepEqual(
      columnFunctions,
      expectedColumnFunctionPayloads.map((p) => this.owner.factoryFor('model:metadata/column-function').create(p)),
      'Raw column functions are normalized correctly'
    );
  });

  test('normalizeDimensions', function (assert) {
    const rawDimension: RawDimensionPayload = {
      category: 'categoryOne',
      name: 'dimensionOne',
      longName: 'Dimension One',
      cardinality: 10,
      fields: [
        {
          name: 'foo',
          description: 'bar',
          longName: 'Foo',
        },
        {
          name: 'baz',
          description: 'bang',
          longName: 'Baz',
        },
      ],
      datatype: 'text',
    };
    const source = 'bardOne';

    const expectedDimensionPayload: DimensionMetadataPayload = {
      id: rawDimension.name,
      name: rawDimension.longName,
      description: undefined,
      category: rawDimension.category,
      valueType: rawDimension.datatype,
      cardinality: 'SMALL',
      type: 'field',
      isSortable: false,
      storageStrategy: null,
      fields: rawDimension.fields,
      tableSource: {
        suggestionColumns: rawDimension.fields.map((f) => ({ id: rawDimension.name, parameters: { field: f.name } })),
      },
      source,
      partialData: true,
    };

    assert.deepEqual(
      Serializer['normalizeDimensions']([rawDimension], source),
      [this.owner.factoryFor('model:metadata/dimension').create(expectedDimensionPayload)],
      'New dimension is constructed correctly normalized'
    );
  });

  test('normalizeMetrics', function (assert) {
    const source = 'bardOne';

    const rawMetric: RawMetricPayload = {
      category: 'categoryOne',
      name: 'metricOne',
      longName: 'Metric One',
      type: 'number',
      metricFunctionId: 'money',
    };

    const expectedMetricPayload: MetricMetadataPayload = {
      id: rawMetric.name,
      name: rawMetric.longName,
      description: undefined,
      category: rawMetric.category,
      valueType: rawMetric.type,
      source,
      columnFunctionId: rawMetric.metricFunctionId,
      type: 'field',
      isSortable: true,
      partialData: true,
    };

    assert.deepEqual(
      Serializer['normalizeMetrics']([rawMetric], source),
      [this.owner.factoryFor('model:metadata/metric').create(expectedMetricPayload)],
      'Metric is constructed correctly with no new column function id or parameter'
    );
  });

  test('configure defaultTimeGrain if it exists', async function (assert) {
    const originalDefaultTimeGrain = config.navi.defaultTimeGrain;

    const table: RawTablePayload = {
      name: 'table',
      longName: 'Table',
      timeGrains: [
        { name: 'day', longName: 'Day', metrics: [], dimensions: [] },
        { name: 'hour', longName: 'Hour', metrics: [], dimensions: [] },
        { name: 'week', longName: 'Week', metrics: [], dimensions: [] },
        { name: 'month', longName: 'Month', metrics: [], dimensions: [] },
      ],
    };

    config.navi.defaultTimeGrain = 'isoWeek';
    const tableGrainInfo = Serializer['parseTableGrains'](table);
    let columnFunction = Serializer['createTimeGrainColumnFunction'](table, tableGrainInfo, 'bardOne');
    assert.equal(columnFunction['_parametersPayload'][0].defaultValue, 'isoWeek', 'Picks default from config');

    config.navi.defaultTimeGrain = 'year';
    columnFunction = Serializer['createTimeGrainColumnFunction'](table, tableGrainInfo, 'bardOne');
    assert.equal(columnFunction['_parametersPayload'][0].defaultValue, 'hour', 'Falls back to first defined grain');

    config.navi.defaultTimeGrain = 'hour';
    columnFunction = Serializer['createTimeGrainColumnFunction'](table, tableGrainInfo, 'bardOne');
    assert.equal(columnFunction['_parametersPayload'][0].defaultValue, 'hour', 'Picks default from config');

    config.navi.defaultTimeGrain = originalDefaultTimeGrain;
  });
});
