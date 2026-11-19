import * as migration_20261017_002154_initial_schema from './20261017_002154_initial_schema';
import * as migration_20261105_051419_nyheter_publisering from './20261105_051419_nyheter_publisering';
import * as migration_20261106_065533_kurs_sted_pris from './20261106_065533_kurs_sted_pris';

export const migrations = [
  {
    up: migration_20261017_002154_initial_schema.up,
    down: migration_20261017_002154_initial_schema.down,
    name: '20261017_002154_initial_schema',
  },
  {
    up: migration_20261105_051419_nyheter_publisering.up,
    down: migration_20261105_051419_nyheter_publisering.down,
    name: '20261105_051419_nyheter_publisering',
  },
  {
    up: migration_20261106_065533_kurs_sted_pris.up,
    down: migration_20261106_065533_kurs_sted_pris.down,
    name: '20261106_065533_kurs_sted_pris'
  },
];
