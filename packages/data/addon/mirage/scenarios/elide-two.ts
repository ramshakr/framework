/**
 * Copyright 2021, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import { grains, defaultNamespaceAttrs } from './elide-one';
import { capitalize } from '@ember/string';

const timeDimIds = ['eventTime', 'orderTime'];

// TODO: Replace any with type supplied by new version of mirage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function (server: any) {
  server.create('time-zone', { id: 'UTC', short: 'UTC', long: 'Universal Time Coordinated' });
  const namespace = server.create('elide-namespace', defaultNamespaceAttrs);
  const [table0, table1] = server.createList('elide-table', 2, { namespace: [namespace] });
  server.createList('metric', 1, { table: table0 });
  server.createList('metric', 2, { table: table1 });
  server.createList('dimension', 2, { table: table0 });
  server.create('table-source');
  server.createList('dimension', 4, { table: table1 });
  const timeDimTables = [table1];
  grains.forEach((grain) => {
    timeDimIds.forEach((timeDimId) => {
      timeDimTables.forEach((table) => {
        const idWithGrain = `${table.id}.${timeDimId}${capitalize(grain)}`;
        let newGrain = server.create('time-dimension-grain', {
          id: `${idWithGrain}.${grain}`,
          expression: null,
          grain: grain.toUpperCase(),
        });
        server.create('time-dimension', { id: idWithGrain, table, supportedGrainIds: [newGrain.id] });
      });
    });
  });
}
