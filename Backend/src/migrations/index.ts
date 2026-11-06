import * as migration_20261017_002154_initial_schema from './20261017_002154_initial_schema';
import * as migration_20261105_051419_nyheter_publisering from './20261105_051419_nyheter_publisering';

export const migrations = [
  {
    up: migration_20261017_002154_initial_schema.up,
    down: migration_20261017_002154_initial_schema.down,
    name: '20261017_002154_initial_schema',
  },
  {
    up: migration_20261105_051419_nyheter_publisering.up,
    down: migration_20261105_051419_nyheter_publisering.down,
    name: '20261105_051419_nyheter_publisering'
  },
];
